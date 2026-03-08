/**
 * GET /api/revit-auth/oauth?provider=google|microsoft&port=PORT&machineId=MACHINE
 * 
 * Khởi tạo OAuth flow cho Revit desktop app.
 * Redirect user → Google/Microsoft consent screen.
 * Sau khi user đồng ý → callback sẽ redirect về localhost:PORT trên máy user.
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const provider = url.searchParams.get('provider') || 'google';
        const port = url.searchParams.get('port') || '0';
        const machineId = url.searchParams.get('machineId') || 'UNKNOWN';

        if (!port || port === '0') {
            return NextResponse.json(
                { error: 'Missing port parameter' },
                { status: 400 }
            );
        }

        // Build state param to carry port + machineId through OAuth flow
        const state = Buffer.from(JSON.stringify({ port, machineId, provider })).toString('base64url');

        // Build callback URL — this app's own callback endpoint
        const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;
        const callbackUrl = `${baseUrl}/api/revit-auth/oauth/callback`;

        let authUrl: string;

        if (provider === 'google') {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            if (!clientId) {
                return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
            }

            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent('openid email profile')}` +
                `&state=${state}` +
                `&access_type=offline` +
                `&prompt=select_account`;
        } else if (provider === 'microsoft') {
            const clientId = process.env.AZURE_AD_CLIENT_ID;
            const tenantId = process.env.AZURE_AD_TENANT_ID || 'common';
            if (!clientId) {
                return NextResponse.json({ error: 'Microsoft OAuth not configured' }, { status: 500 });
            }

            authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent('openid email profile')}` +
                `&state=${state}` +
                `&prompt=select_account`;
        } else {
            return NextResponse.json({ error: 'Invalid provider. Use google or microsoft.' }, { status: 400 });
        }

        // Redirect browser to OAuth consent screen
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('[Revit OAuth] Init error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate OAuth flow' },
            { status: 500 }
        );
    }
}

// CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
