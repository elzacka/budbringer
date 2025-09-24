import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('recipients')
      .select('id, email, active');

    if (error) {
      console.error('Supabase error (GET recipients):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke hente recipients' }, { status: 500 });
    }

    return NextResponse.json({ recipients: data });
  } catch (err: any) {
    console.error('Route handler error (GET recipients):', err);
    return NextResponse.json({ error: 'Uventet feil ved henting av recipients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const { email, active } = await req.json();

    const { data, error } = await supabase
      .from('recipients')
      .insert([{ email, active }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error (insert recipient):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke opprette recipient' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Recipient opprettet', recipient: data });
  } catch (err: any) {
    console.error('Route handler error (POST recipient):', err);
    return NextResponse.json({ error: 'Uventet feil ved oppretting av recipient' }, { status: 500 });
  }
}
