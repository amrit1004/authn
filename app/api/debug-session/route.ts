import { getSession } from '@/app/lib/auth0Client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Read session using request cookies context
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Return a safe representation: user keys and flags (don't return tokens)
    const userKeys = session.user && typeof session.user === 'object' ? Object.keys(session.user) : null;

    return NextResponse.json({
      userKeys,
      needsProfileCompletion: !!session.needsProfileCompletion,
      needsDeviceManagement: !!session.needsDeviceManagement,
      deviceId: session.deviceId ?? null,
      newDeviceToAdd: session.newDeviceToAdd ? { user_agent: session.newDeviceToAdd.user_agent, ip: session.newDeviceToAdd.ip } : null,
    });
  } catch (err) {
    console.error('/api/debug-session error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
