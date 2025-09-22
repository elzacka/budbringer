import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../lib/supabase-admin';
import { verifySignature } from '../../../lib/unsubscribe';

const schema = z.object({
  email: z.string().email(),
  signature: z.string().min(10)
});

export async function POST(request: Request) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Unsubscribe ikke konfigurert' }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 422 });
  }

  const { email, signature } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  if (!verifySignature(normalizedEmail, signature, secret)) {
    return NextResponse.json({ error: 'Signaturen er ugyldig' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const result = await service
    .from('subscribers')
    .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
    .eq('email', normalizedEmail);

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Avmeldt' });
}
