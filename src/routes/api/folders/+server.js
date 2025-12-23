import { json } from '@sveltejs/kit';
import { getDriveService, listFolders } from '$lib/server/google-drive.js';

export async function GET({ url, cookies }) {
    const accessToken = cookies.get('google_access_token');

    if (!accessToken) {
        return json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const drive = await getDriveService(accessToken);
        const folderId = url.searchParams.get('folderId');
        const folders = await listFolders(drive, folderId);

        return json({ folders });
    } catch (error) {
        console.error('Error listing folders:', error);
        return json({ error: error.message }, { status: 500 });
    }
}