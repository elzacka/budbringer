import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteHandlerClient } from '../../../../lib/supabase-server';
import { getSupabaseServiceClient } from '../../../../lib/supabase-admin';
import { requireAdmin } from '../../../../lib/auth';

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  status: z.enum(['pending', 'confirmed', 'unsubscribed']).optional(),
  language: z.literal('nb-NO').optional(),
  preferences: z.record(z.any()).nullable().optional()
});

export async function POST(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  const adminCheck = await requireAdmin(supabase);
  if (adminCheck.error) {
    return adminCheck.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig payload' }, { status: 422 });
  }

  const service = getSupabaseServiceClient();
  // @ts-expect-error Supabase typing does not narrow insert payload for this client
  const result = await service.from('subscribers').insert({
    email: parsed.data.email.trim().toLowerCase(),
    status: parsed.data.status ?? 'confirmed',
    language: parsed.data.language ?? 'nb-NO',
    preferences: parsed.data.preferences ?? null,
    source: 'admin'
  });

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke lagre mottaker' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Lagret' });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  const adminCheck = await requireAdmin(supabase);
  if (adminCheck.error) {
    return adminCheck.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(payload);

  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json({ error: 'ID kreves for oppdatering' }, { status: 422 });
  }

  const service = getSupabaseServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (service as any)
    .from('subscribers')
    .update({
      email: parsed.data.email.trim().toLowerCase(),
      status: parsed.data.status,
      language: parsed.data.language,
      preferences: parsed.data.preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', parsed.data.id);

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere mottaker' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Oppdatert' });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  const adminCheck = await requireAdmin(supabase);
  if (adminCheck.error) {
    return adminCheck.error;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID mangler' }, { status: 400 });
  }

  const service = getSupabaseServiceClient();
  const result = await service.from('subscribers').delete().eq('id', id);

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke slette mottaker' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Slettet' });
}
