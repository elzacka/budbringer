import { NextResponse } from 'next/server';
import { getSupabaseRouteHandlerClient } from '../../../../lib/supabase-server';
import { requireAdmin } from '../../../../lib/auth';

export async function GET() {
  const supabase = await getSupabaseRouteHandlerClient();
  const adminCheck = await requireAdmin(supabase);
  if (adminCheck.error) {
    return adminCheck.error;
  }

  const result = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (result.error) {
    console.error(result.error);
    return NextResponse.json({ error: 'Kunne ikke hente mottakere' }, { status: 500 });
  }

  return NextResponse.json({ recipients: result.data });
}
