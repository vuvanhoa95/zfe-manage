import { NextResponse } from 'next/server';
import { revitCorsResponse } from '@/lib/api-security';

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

        const state = Buffer.from(JSON.stringify({ port, machineId, provider })).toString('base64url');
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
                `&scope=${encodeURIComponent('openid email profile User.Read')}` +
                `&state=${state}` +
                `&prompt=select_account`;
        } else {
            return NextResponse.json({ error: 'Invalid provider. Use google or microsoft.' }, { status: 400 });
        }

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
export async function OPTIONS(req: Request) {
    return revitCorsResponse(req, 'GET, OPTIONS');
}
