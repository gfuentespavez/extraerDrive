import { json } from '@sveltejs/kit';
import { getDriveService, getAllItemsInFolder } from '$lib/server/google-drive.js';

export async function POST({ request, cookies }) {
    const accessToken = cookies.get('google_access_token');

    if (!accessToken) {
        return json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { folderIds, includeSubfolders } = await request.json();
        const drive = await getDriveService(accessToken);

        let allItems = [];

        for (const folderId of folderIds) {
            const items = await getAllItemsInFolder(drive, folderId, includeSubfolders);
            allItems = allItems.concat(items);
        }

        // Ordenar por fecha de creación (ascendente: más antiguo primero)
        allItems.sort((a, b) => {
            const dateA = new Date(a.created);
            const dateB = new Date(b.created);
            return dateA - dateB; // Ascendente: 2023 -> 2024 -> 2025
        });

        return json({ items: allItems, count: allItems.length });
    } catch (error) {
        console.error('Error exporting:', error);
        return json({ error: error.message }, { status: 500 });
    }
}