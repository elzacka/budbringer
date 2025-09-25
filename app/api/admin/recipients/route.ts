import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../../../../lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('subscribers')
      .select('id, email, status, created_at, updated_at, last_sent_at');

    if (error) {
      console.error('Supabase error (GET recipients):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke hente recipients' }, { status: 500 });
    }

    return NextResponse.json({ recipients: data });
  } catch (err: unknown) {
    console.error('Route handler error (GET recipients):', err);
    return NextResponse.json({ error: 'Uventet feil ved henting av recipients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const { email } = await req.json();

    const { data, error } = await supabase
      .from('subscribers')
      .insert([{
        email: email.toLowerCase().trim(),
        status: 'confirmed',
        source: 'admin'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error (insert subscriber):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke opprette subscriber' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscriber opprettet', recipient: data });
  } catch (err: unknown) {
    console.error('Route handler error (POST subscriber):', err);
    return NextResponse.json({ error: 'Uventet feil ved oppretting av subscriber' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing subscriber ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error (delete subscriber):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke slette subscriber' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscriber slettet' });
  } catch (err: unknown) {
    console.error('Route handler error (DELETE subscriber):', err);
    return NextResponse.json({ error: 'Uventet feil ved sletting av subscriber' }, { status: 500 });
  }
}
