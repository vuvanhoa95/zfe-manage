import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = NextResponse.json({ success: true, message: 'Đã xoá cookie đăng nhập (NextAuth).' });

    // NextAuth / Auth.js cookie names (tùy version)
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      // Auth.js v5+ naming
      'authjs.session-token',
      '__Secure-authjs.session-token',
      'authjs.csrf-token',
      '__Host-authjs.csrf-token',
      'authjs.callback-url',
      '__Secure-authjs.callback-url',
    ];

    for (const name of cookieNames) {
      res.cookies.set({
        name,
        value: '',
        path: '/',
        maxAge: 0,
      });
    }

    return res;
  } catch (error) {
    console.error('[CLEAR_AUTH_COOKIES]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

