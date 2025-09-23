import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteHandlerClient } from '../../../../lib/supabase-server';
import { getSupabaseServiceClient } from '../../../../lib/supabase-admin';
import { requireAdmin } from '../../../../lib/auth';

const createSchema = z.object({
  name: z.string().min(3),
  body: z.string().min(10),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

const activateSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean()
});

export async function POST(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  const adminCheck = await requireAdmin(supabase);
  if (adminCheck.error) {
    return adminCheck.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig prompt' }, { status: 422 });
  }

  const service = getSupabaseServiceClient();

  const { data: latest } = await service
    .from('prompts')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = ((latest as { version: number } | null)?.version ?? 0) + 1;

  // @ts-expect-error Supabase type inference fails in build step, but payload matches table schema
  const result = await service.from('prompts').insert({
    name: parsed.data.name,
    body: parsed.data.body,
    notes: parsed.data.notes ?? null,
    tags: parsed.data.tags ?? null,
    is_active: version === 1,
    version
  });

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke lagre prompt' }, { status: 500 });
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
  const parsed = activateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig data' }, { status: 422 });
  }

  const service = getSupabaseServiceClient();

  if (parsed.data.active) {
    // Set all to inactive first
    // @ts-expect-error Supabase typing does not narrow update payload for this client
    const deactivate = await service.from('prompts').update({ is_active: false }).eq('is_active', true);
    if (deactivate.error) {
      console.error(deactivate.error);
      return NextResponse.json({ error: 'Kunne ikke deaktivere eksisterende prompt' }, { status: 500 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (service as any).from('prompts').update({ is_active: parsed.data.active }).eq('id', parsed.data.id);

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere prompt' }, { status: 500 });
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
  const result = await service.from('prompts').delete().eq('id', id);

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke slette prompt' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Slettet' });
}
