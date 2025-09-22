import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../lib/supabase-admin';

const payloadSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await request.json().catch(() => null);
  const parseResult = payloadSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Ugyldig e-postadresse' }, { status: 422 });
  }

  const { email } = parseResult.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing.error && existing.error.code !== 'PGRST116') {
    console.error(existing.error);
    return NextResponse.json({ error: 'Kunne ikke sjekke eksisterende registrering' }, { status: 500 });
  }

  if (existing.data) {
    if (existing.data.status !== 'confirmed') {
      await supabase
        .from('subscribers')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
          source: 'form'
        })
        .eq('id', existing.data.id);
    }

    return NextResponse.json({ message: 'Du står allerede på listen.' }, { status: 200 });
  }

  const insertResult = await supabase.from('subscribers').insert({
    email: normalizedEmail,
    status: 'confirmed',
    source: 'form',
    language: 'nb-NO'
  });

  if (insertResult.error) {
    console.error(insertResult.error);
    return NextResponse.json({ error: 'Kunne ikke lagre registreringen' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Registrert' }, { status: 201 });
}
