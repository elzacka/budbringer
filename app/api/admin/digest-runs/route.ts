import { NextResponse } from 'next/server';
import { deleteDigestRun } from '../../../../lib/queries';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('id');

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    await deleteDigestRun(runId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting digest run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}