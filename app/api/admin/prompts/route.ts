import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('prompts')
      .select('id, name, body, is_active, version, notes');

    if (error) {
      console.error('Supabase error (GET prompts):', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Kunne ikke hente prompts' }, { status: 500 });
    }

    return NextResponse.json({ prompts: data });
  } catch (err: any) {
    console.error('Route handler error (GET prompts):', err);
    return NextResponse.json({ error: 'Uventet feil ved henting av prompts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const { name, body, version, notes } = await req.json();

    // Sett alle eksisterende prompts inaktive
    const { error: deactivateError } = await supabase
      .from('prompts')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Supabase error (deactivate prompts):', JSON.stringify(deactivateError, null, 2));
      return NextResponse.json({ error: 'Kunne ikke deaktivere gamle prompts' }, { status: 500 });
    }

    // Sett inn ny prompt
    const { data, error: insertError } = await supabase
      .from('prompts')
      .insert([{ name, body, is_active: true, version, notes }])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error (insert prompt):', JSON.stringify(insertError, null, 2));
      return NextResponse.json({ error: 'Kunne ikke opprette ny prompt' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ny prompt opprettet og aktivert', prompt: data });
  } catch (err: any) {
    console.error('Route handler error (POST prompt):', err);
    return NextResponse.json({ error: 'Uventet feil ved oppretting av prompt' }, { status: 500 });
  }
}
