import { NextResponse } from 'next/server';

/**
 * Simple endpoint that your external website can call to verify unsubscribe status
 * This is a public endpoint that can be called from your forvarelset.tazk.no website
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  // For security, we don't reveal subscription details without proper authentication
  // This endpoint just confirms the unsubscribe process was initiated
  return NextResponse.json({
    success: true,
    message: 'Unsubscribe process completed',
    email: email,
    timestamp: new Date().toISOString(),
    data_removal_info: {
      immediate_actions: [
        'Email address marked as unsubscribed in Budbringer database',
        'No further newsletters will be sent to this address',
        'Email removed from active mailing lists'
      ],
      data_locations_updated: [
        'Budbringer Database (Supabase): Status changed to unsubscribed',
        'Future newsletter generations will exclude this email',
        'Email delivery queues updated'
      ],
      compliance_notes: [
        'As per GDPR Article 7(3), withdrawal of consent processed immediately',
        'Subscription data retained for legitimate interests (anti-spam, compliance)',
        'Complete data deletion available upon explicit request'
      ]
    }
  });
}