<script>
    import FolderBrowser from '$lib/components/FolderBrowser.svelte';
    import { onMount } from 'svelte';

    let authenticated = false;
    let selectedFolderIds = [];
    let includeSubfolders = true;
    let includeFiles = true; // Nueva opción
    let exportFormat = 'csv'; // Nueva opción: csv, json, txt
    let exporting = false;
    let exportResult = null;
    let isLoading = true;

    onMount(async () => {
        const response = await fetch('/api/folders');
        authenticated = response.ok;
        isLoading = false;
    });

    async function login() {
        window.location.href = '/api/auth';
    }

    function handleFoldersSelected(folderIds) {
        selectedFolderIds = folderIds;
    }

    async function exportLinks() {
        if (selectedFolderIds.length === 0) {
            return;
        }

        exporting = true;
        exportResult = null;

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderIds: selectedFolderIds,
                    includeSubfolders
                })
            });

            const data = await response.json();

            // Filtrar según la opción seleccionada
            let filteredItems = data.items;
            if (!includeFiles) {
                filteredItems = data.items.filter(item => item.type === 'Carpeta');
            }

            exportResult = {
                count: filteredItems.length,
                total: data.count
            };

            // Descargar según formato
            switch(exportFormat) {
                case 'csv':
                    downloadCSV(filteredItems);
                    break;
                case 'json':
                    downloadJSON(filteredItems);
                    break;
                case 'txt':
                    downloadTXT(filteredItems);
                    break;
                case 'md':
                    downloadMarkdown(filteredItems);
                    break;
            }

            setTimeout(() => {
                exportResult = null;
            }, 5000);
        } catch (error) {
            alert('Error al exportar: ' + error.message);
        } finally {
            exporting = false;
        }
    }

    function downloadCSV(items) {
        const headers = ['Ruta', 'Nombre', 'Tipo', 'Link', 'Propiedad', 'Creado', 'Modificado'];
        const csvContent = [
            headers.join(','),
            ...items.map(item => [
                `"${item.path}"`,
                `"${item.name}"`,
                item.type,
                item.link,
                `"${item.ownership || 'N/A'}"`,
                item.created,
                item.modified
            ].join(','))
        ].join('\n');

        downloadFile(csvContent, 'text/csv', 'csv');
    }

    function downloadJSON(items) {
        const jsonContent = JSON.stringify({
            exportDate: new Date().toISOString(),
            totalItems: items.length,
            includeFiles: includeFiles,
            includeSubfolders: includeSubfolders,
            items: items.map(item => ({
                path: item.path,
                name: item.name,
                type: item.type,
                link: item.link,
                ownership: item.ownership,
                created: item.created,
                modified: item.modified
            }))
        }, null, 2);

        downloadFile(jsonContent, 'application/json', 'json');
    }

    function downloadTXT(items) {
        const txtContent = [
            '═══════════════════════════════════════════════════════════',
            '              LINKS DE GOOGLE DRIVE',
            '═══════════════════════════════════════════════════════════',
            `Fecha de exportación: ${new Date().toLocaleString('es-ES')}`,
            `Total de elementos: ${items.length}`,
            `Incluye archivos: ${includeFiles ? 'Sí' : 'No (solo carpetas)'}`,
            `Incluye subcarpetas: ${includeSubfolders ? 'Sí' : 'No'}`,
            '═══════════════════════════════════════════════════════════',
            '',
            ...items.map(item => [
                `📍 ${item.name}`,
                `   Ruta: ${item.path}`,
                `   Tipo: ${item.type}`,
                `   Link: ${item.link}`,
                `   Propiedad: ${item.ownership}`,
                `   Creado: ${new Date(item.created).toLocaleString('es-ES')}`,
                `   Modificado: ${new Date(item.modified).toLocaleString('es-ES')}`,
                '───────────────────────────────────────────────────────────',
                ''
            ].join('\n'))
        ].join('\n');

        downloadFile(txtContent, 'text/plain', 'txt');
    }

    function downloadMarkdown(items) {
        const mdContent = [
            '# Links de Google Drive',
            '',
            `**Fecha de exportación:** ${new Date().toLocaleString('es-ES')}  `,
            `**Total de elementos:** ${items.length}  `,
            `**Incluye archivos:** ${includeFiles ? 'Sí' : 'No (solo carpetas)'}  `,
            `**Incluye subcarpetas:** ${includeSubfolders ? 'Sí' : 'No'}`,
            '',
            '---',
            '',
            '## Contenido',
            '',
            ...items.map(item => {
                const icon = item.type === 'Carpeta' ? '📁' : '📄';
                return [
                    `### ${icon} ${item.name}`,
                    '',
                    `- **Ruta:** \`${item.path}\``,
                    `- **Tipo:** ${item.type}`,
                    `- **Link:** [Abrir en Drive](${item.link})`,
                    `- **Propiedad:** ${item.ownership}`,
                    `- **Creado:** ${new Date(item.created).toLocaleString('es-ES')}`,
                    `- **Modificado:** ${new Date(item.modified).toLocaleString('es-ES')}`,
                    '',
                    '---',
                    ''
                ].join('\n');
            })
        ].join('\n');

        downloadFile(mdContent, 'text/markdown', 'md');
    }

    function downloadFile(content, mimeType, extension) {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `drive_links_${Date.now()}.${extension}`;
        link.click();
    }
</script>

<svelte:head>
    <title>Drive Links Extractor</title>
</svelte:head>

<div class="container">
    {#if isLoading}
        <div class="loading-screen">
            <div class="spinner"></div>
            <p>Cargando...</p>
        </div>
    {:else if !authenticated}
        <div class="auth-container">
            <div class="logo">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>

            <h1>Drive Links Extractor</h1>
            <p class="subtitle">Extrae y organiza los enlaces de tus carpetas de Google Drive</p>

            <button class="btn-primary" on:click={login}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Conectar con Google Drive
            </button>

            <div class="features">
                <div class="feature">
                    <span class="feature-icon">🔍</span>
                    <span>Navega por tus carpetas</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">✓</span>
                    <span>Selecciona las que necesites</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📥</span>
                    <span>Exporta en múltiples formatos</span>
                </div>
            </div>
        </div>
    {:else}
        <header>
            <div class="header-content">
                <h1>Drive Links Extractor</h1>
                <div class="header-stats">
                    {#if selectedFolderIds.length > 0}
                        <span class="stat-badge">{selectedFolderIds.length} seleccionada{selectedFolderIds.length !== 1 ? 's' : ''}</span>
                    {/if}
                </div>
            </div>
        </header>

        <main class="main-content">
            <div class="browser-section">
                <FolderBrowser onFoldersSelected={handleFoldersSelected} />
            </div>

            <div class="actions-section">
                <div class="options-card">
                    <h3 class="options-title">Opciones de exportación</h3>

                    <div class="options-grid">
                        <label class="toggle-option">
                            <input type="checkbox" bind:checked={includeSubfolders} />
                            <span class="toggle-label">
                                <span class="toggle-icon">🔄</span>
                                Incluir subcarpetas
                            </span>
                        </label>

                        <label class="toggle-option">
                            <input type="checkbox" bind:checked={includeFiles} />
                            <span class="toggle-label">
                                <span class="toggle-icon">📄</span>
                                Incluir archivos
                            </span>
                        </label>
                    </div>

                    <div class="format-selector">
                        <label class="format-label">Formato de exportación</label>
                        <div class="format-options">
                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="csv" />
                                <span class="format-card">
                                    <span class="format-icon">📊</span>
                                    <span class="format-info">
                                        <strong>CSV</strong>
                                        <small>Excel compatible</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="json" />
                                <span class="format-card">
                                    <span class="format-icon">{'{ }'}</span>
                                    <span class="format-info">
                                        <strong>JSON</strong>
                                        <small>Desarrollo</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="txt" />
                                <span class="format-card">
                                    <span class="format-icon">📝</span>
                                    <span class="format-info">
                                        <strong>TXT</strong>
                                        <small>Lectura fácil</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="md" />
                                <span class="format-card">
                                    <span class="format-icon">📄</span>
                                    <span class="format-info">
                                        <strong>Markdown</strong>
                                        <small>Documentación</small>
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <button
                    class="btn-export"
                    on:click={exportLinks}
                    disabled={exporting || selectedFolderIds.length === 0}
                >
                    {#if exporting}
                        <span class="btn-spinner"></span>
                        Exportando...
                    {:else}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Exportar Links
                    {/if}
                </button>

                {#if exportResult}
                    <div class="result-card">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 4L12 14.01l-3-3" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>
                            <strong>{exportResult.count} elementos exportados</strong>
                            <p>
                                {#if !includeFiles && exportResult.count !== exportResult.total}
                                    Solo carpetas ({exportResult.total - exportResult.count} archivos filtrados)
                                {:else}
                                    El archivo {exportFormat.toUpperCase()} se ha descargado correctamente
                                {/if}
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </main>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #f5f2f2;
        color: #1a1a1a;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    .container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    /* Loading Screen */
    .loading-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(26, 26, 26, 0.1);
        border-top-color: #1a1a1a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Auth Container */
    .auth-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 4rem 2rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }

    .logo {
        margin-bottom: 2rem;
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }

    h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.02em;
        color: #1a1a1a;
        font-family: 'Axiforma', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
    }

    header h1 {
        font-size: 1.5rem;
        margin: 0;
        font-family: 'Axiforma', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
    }

    .subtitle {
        font-size: 1.125rem;
        color: #666;
        margin: 0 0 3rem 0;
        line-height: 1.6;
    }

    .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background: #1a1a1a;
        color: #f5f2f2;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(26, 26, 26, 0.2);
        background: #2a2a2a;
    }

    .btn-primary:active {
        transform: translateY(0);
    }

    .features {
        display: flex;
        gap: 2rem;
        margin-top: 4rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    .feature {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.9rem;
    }

    .feature-icon {
        font-size: 1.5rem;
    }

    /* Header */
    header {
        background: white;
        border-bottom: 1px solid rgba(26, 26, 26, 0.08);
        padding: 1.5rem 2rem;
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.9);
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    header h1 {
        font-size: 1.5rem;
        margin: 0;
    }

    .header-stats {
        display: flex;
        gap: 1rem;
    }

    .stat-badge {
        padding: 0.5rem 1rem;
        background: #1a1a1a;
        color: #f5f2f2;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    /* Main Content */
    .main-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .browser-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
        border: 1px solid rgba(26, 26, 26, 0.06);
    }

    .actions-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .options-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
        border: 1px solid rgba(26, 26, 26, 0.06);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .options-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .toggle-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        user-select: none;
        padding: 0.75rem;
        border-radius: 8px;
        transition: background 0.2s;
    }

    .toggle-option:hover {
        background: #fafafa;
    }

    .toggle-option input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #1a1a1a;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 500;
    }

    .toggle-icon {
        font-size: 1.25rem;
    }

    /* Format Selector */
    .format-selector {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .format-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .format-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
    }

    .format-option {
        cursor: pointer;
    }

    .format-option input[type="radio"] {
        display: none;
    }

    .format-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border: 2px solid rgba(26, 26, 26, 0.1);
        border-radius: 12px;
        transition: all 0.2s;
        background: #fafafa;
    }

    .format-option:hover .format-card {
        border-color: rgba(26, 26, 26, 0.3);
        background: white;
    }

    .format-option input:checked ~ .format-card {
        border-color: #1a1a1a;
        background: white;
        box-shadow: 0 2px 8px rgba(26, 26, 26, 0.08);
    }

    .format-icon {
        font-size: 1.5rem;
    }

    .format-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        text-align: center;
    }

    .format-info strong {
        font-size: 0.9rem;
        color: #1a1a1a;
    }

    .format-info small {
        font-size: 0.75rem;
        color: #666;
    }

    .btn-export {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        width: 100%;
        padding: 1.25rem 2rem;
        background: #1a1a1a;
        color: #f5f2f2;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
    }

    .btn-export:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(26, 26, 26, 0.2);
        background: #2a2a2a;
    }

    .btn-export:active:not(:disabled) {
        transform: translateY(0);
    }

    .btn-export:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .btn-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(245, 242, 242, 0.3);
        border-top-color: #f5f2f2;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    .result-card {
        background: white;
        border: 1px solid rgba(26, 26, 26, 0.08);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
    }

    .result-card strong {
        display: block;
        margin-bottom: 0.25rem;
        color: #1a1a1a;
    }

    .result-card p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        h1 {
            font-size: 2rem;
        }

        .main-content {
            padding: 1rem;
        }

        .browser-section,
        .options-card {
            padding: 1rem;
        }

        .features {
            gap: 1rem;
        }

        .feature {
            font-size: 0.8rem;
        }

        .format-options {
            grid-template-columns: repeat(2, 1fr);
        }

        .options-grid {
            grid-template-columns: 1fr;
        }
    }
</style>