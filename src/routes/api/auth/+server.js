import { getOAuth2Client, getAuthUrl } from '$lib/server/google-drive.js';
import { redirect } from '@sveltejs/kit';

export async function GET() {
    const oauth2Client = getOAuth2Client();
    const authUrl = getAuthUrl(oauth2Client);
    throw redirect(302, authUrl);
}