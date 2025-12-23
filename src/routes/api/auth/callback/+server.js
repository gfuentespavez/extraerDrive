import { getOAuth2Client } from '$lib/server/google-drive.js';
import { redirect } from '@sveltejs/kit';

export async function GET({ url, cookies }) {
    const code = url.searchParams.get('code');

    if (!code) {
        throw redirect(302, '/?error=no_code');
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        cookies.set('google_access_token', tokens.access_token, {
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60
        });

        throw redirect(302, '/');
    } catch (error) {
        console.error('Error getting tokens:', error);
        throw redirect(302, '/?error=auth_failed');
    }
}