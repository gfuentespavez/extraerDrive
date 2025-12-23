import { google } from 'googleapis';
import { env } from '$env/dynamic/private';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export function getOAuth2Client() {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI
    );
}

export function getAuthUrl(oauth2Client) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
}

export async function getDriveService(accessToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listFolders(drive, folderId = null, includeShared = true) {
    let allFolders = [];

    // Query base para carpetas Y accesos directos a carpetas
    let query;
    if (folderId) {
        query = `'${folderId}' in parents and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.shortcut') and trashed=false`;
    } else {
        query = `(mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.shortcut') and trashed=false and 'root' in parents`;
    }

    try {
        let pageToken = null;

        // Paginar para obtener TODAS las carpetas
        do {
            const response = await drive.files.list({
                q: query,
                fields: 'nextPageToken, files(id, name, mimeType, parents, shared, ownedByMe, owners, shortcutDetails)',
                pageSize: 1000, // Máximo permitido por Google
                pageToken: pageToken,
                orderBy: 'name',
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });

            const items = response.data.files || [];

            // Procesar carpetas y accesos directos
            for (const item of items) {
                let folder;

                if (item.mimeType === 'application/vnd.google-apps.shortcut') {
                    // Es un acceso directo
                    if (item.shortcutDetails?.targetMimeType === 'application/vnd.google-apps.folder') {
                        // Acceso directo a carpeta
                        folder = {
                            id: item.shortcutDetails.targetId, // Usar el ID de la carpeta de destino
                            name: `🔗 ${item.name}`, // Indicar que es acceso directo
                            mimeType: 'application/vnd.google-apps.folder',
                            isShared: true,
                            isShortcut: true,
                            originalId: item.id
                        };
                    }
                } else {
                    // Es una carpeta normal
                    const isShared = item.shared || !item.ownedByMe;
                    folder = {
                        ...item,
                        name: isShared ? `🔗 ${item.name}` : item.name,
                        isShared: isShared,
                        isShortcut: false
                    };
                }

                if (folder) {
                    allFolders.push(folder);
                }
            }

            pageToken = response.data.nextPageToken;
        } while (pageToken);

        // Si estamos en la raíz, también agregar carpetas compartidas directamente
        if (!folderId && includeShared) {
            const sharedQuery = `mimeType='application/vnd.google-apps.folder' and sharedWithMe=true and trashed=false`;
            let sharedPageToken = null;

            do {
                const sharedResponse = await drive.files.list({
                    q: sharedQuery,
                    fields: 'nextPageToken, files(id, name, mimeType, parents, shared, ownedByMe)',
                    pageSize: 1000,
                    pageToken: sharedPageToken,
                    orderBy: 'name',
                    includeItemsFromAllDrives: true,
                    supportsAllDrives: true
                });

                const sharedFolders = (sharedResponse.data.files || [])
                    .filter(folder => {
                        // Evitar duplicados - solo carpetas sin parent o fuera de root
                        return !folder.parents || !folder.parents.includes('root');
                    })
                    .map(folder => ({
                        ...folder,
                        name: `🔗 ${folder.name}`,
                        isShared: true,
                        isShortcut: false
                    }));

                allFolders = [...allFolders, ...sharedFolders];
                sharedPageToken = sharedResponse.data.nextPageToken;
            } while (sharedPageToken);
        }

        return allFolders;
    } catch (error) {
        console.error('Error listing folders:', error);
        throw error;
    }
}

export async function getAllItemsInFolder(drive, folderId, includeSubfolders = true) {
    const items = [];
    const processedIds = new Set(); // Evitar duplicados

    async function scanFolder(currentFolderId, path = '') {
        if (processedIds.has(currentFolderId)) {
            return; // Ya procesamos esta carpeta
        }
        processedIds.add(currentFolderId);

        const query = `'${currentFolderId}' in parents and trashed=false`;
        let pageToken = null;

        do {
            try {
                const response = await drive.files.list({
                    q: query,
                    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, createdTime, modifiedTime, shared, ownedByMe, owners, sharingUser, shortcutDetails)',
                    pageSize: 1000, // Máximo permitido
                    pageToken: pageToken,
                    includeItemsFromAllDrives: true,
                    supportsAllDrives: true
                });

                for (const file of response.data.files) {
                    let actualFile = file;
                    let isShortcut = false;

                    // Si es acceso directo, obtener información del destino
                    if (file.mimeType === 'application/vnd.google-apps.shortcut') {
                        isShortcut = true;
                        // Para accesos directos, usar el target ID
                        actualFile = {
                            ...file,
                            id: file.shortcutDetails.targetId,
                            mimeType: adsfile.shortcutDetails.targetMimeType,
                            name: `🔗 ${file.name}`
                        };
                    }

                    const isFolder = actualFile.mimeType === 'application/vnd.google-apps.folder';
                    const itemPath = path ? `${path}/${actualFile.name}` : actualFile.name;
                    const link = isFolder
                        ? `https://drive.google.com/drive/folders/${actualFile.id}`
                        : (actualFile.webViewLink || `https://drive.google.com/file/d/${actualFile.id}/view`);

                    // Detectar estado de propiedad
                    let ownershipStatus;
                    if (isShortcut) {
                        ownershipStatus = '🔗 Acceso directo';
                    } else if (file.ownedByMe) {
                        ownershipStatus = file.shared ? 'Propio (compartido)' : 'Propio';
                    } else if (file.sharingUser) {
                        ownershipStatus = `🔗 Compartido por ${file.sharingUser.displayName || 'alguien'}`;
                    } else {
                        ownershipStatus = '🔗 Compartido';
                    }

                    items.push({
                        name: actualFile.name,
                        path: itemPath,
                        id: actualFile.id,
                        type: isFolder ? 'Carpeta' : 'Archivo',
                        link: link,
                        mimeType: actualFile.mimeType,
                        created: file.createdTime,
                        modified: file.modifiedTime,
                        ownership: ownershipStatus,
                        isShortcut: isShortcut
                    });

                    if (isFolder && includeSubfolders) {
                        await scanFolder(actualFile.id, itemPath);
                    }
                }

                pageToken = response.data.nextPageToken;
            } catch (error) {
                console.error(`Error scanning folder ${currentFolderId}:`, error);
                break;
            }
        } while (pageToken);
    }

    await scanFolder(folderId);
    return items;
}