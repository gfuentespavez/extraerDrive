<script>
    import FolderBrowser from '$lib/components/FolderBrowser.svelte';
    import Icon from '$lib/components/Icon.svelte';
    import Logo from '$lib/components/Logo.svelte';
    import { onMount } from 'svelte';

    let authenticated = false;
    let selectedFolderIds = [];
    let includeSubfolders = true;
    let includeFiles = true;
    let exportFormat = 'csv';
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

            let filteredItems = data.items;
            if (!includeFiles) {
                filteredItems = data.items.filter(item => item.type === 'Carpeta');
            }

            exportResult = {
                count: filteredItems.length,
                total: data.count
            };

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
                `• ${item.name}`,
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
        <div class="hero-container">
            <div class="hero-grid">
                <!-- Columna Izquierda: Logo y Descripción -->
                <div class="hero-left">
                    <div class="logo-section">
                        <Logo size="lg" />
                    </div>

                    <h1 class="hero-title">
                        Extrae enlaces de <span class="highlight">Google Drive</span> en segundos
                    </h1>

                    <p class="hero-description">
                        Navega, selecciona y exporta los enlaces de tus carpetas de Google Drive
                        en múltiples formatos. Simple, rápido y eficiente.
                    </p>

                    <div class="hero-stats">
                        <div class="stat">
                            <span class="stat-number">100%</span>
                            <span class="stat-label">Gratis</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">4</span>
                            <span class="stat-label">Formatos</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">∞</span>
                            <span class="stat-label">Carpetas</span>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: CTA y Features -->
                <div class="hero-right">
                    <div class="cta-card">
                        <h3 class="cta-title">Comienza ahora</h3>
                        <p class="cta-description">
                            Conecta tu cuenta de Google Drive para empezar
                        </p>

                        <button class="btn-primary" on:click={login}>
                            <Icon name="drive" size={24} />
                            <span>Conectar Google Drive</span>
                            <Icon name="chevronRight" size={20} />
                        </button>

                        <div class="trust-badge">
                            <Icon name="checkCircle" size={16} color="var(--success)" />
                            <span>Conexión segura y privada</span>
                        </div>
                    </div>

                    <div class="features-card">
                        <h4 class="features-title">¿Cómo funciona?</h4>

                        <div class="feature-list">
                            <div class="feature-item">
                                <div class="feature-number">1</div>
                                <div class="feature-content">
                                    <Icon name="search" size={24} color="var(--primary)" />
                                    <div>
                                        <strong>Navega</strong>
                                        <p>Explora tus carpetas de Drive de forma intuitiva</p>
                                    </div>
                                </div>
                            </div>

                            <div class="feature-item">
                                <div class="feature-number">2</div>
                                <div class="feature-content">
                                    <Icon name="checkCircle" size={24} color="var(--primary)" />
                                    <div>
                                        <strong>Selecciona</strong>
                                        <p>Marca las carpetas que necesitas exportar</p>
                                    </div>
                                </div>
                            </div>

                            <div class="feature-item">
                                <div class="feature-number">3</div>
                                <div class="feature-content">
                                    <Icon name="download" size={24} color="var(--primary)" />
                                    <div>
                                        <strong>Exporta</strong>
                                        <p>Descarga en CSV, JSON, TXT o Markdown</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <header>
            <div class="header-content">
                <Logo size="md" />
                <div class="header-stats">
                    {#if selectedFolderIds.length > 0}
                        <span class="stat-badge">
                            <Icon name="checkCircle" size={16} />
                            {selectedFolderIds.length} seleccionada{selectedFolderIds.length !== 1 ? 's' : ''}
                        </span>
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
                                <Icon name="refresh" size={20} />
                                Incluir subcarpetas
                            </span>
                        </label>

                        <label class="toggle-option">
                            <input type="checkbox" bind:checked={includeFiles} />
                            <span class="toggle-label">
                                <Icon name="file" size={20} />
                                Incluir archivos
                            </span>
                        </label>
                    </div>

                    <div class="format-selector">
                        <label class="format-label">
                            <Icon name="sliders" size={18} />
                            Formato de exportación
                        </label>
                        <div class="format-options">
                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="csv" />
                                <span class="format-card">
                                    <Icon name="database" size={24} />
                                    <span class="format-info">
                                        <strong>CSV</strong>
                                        <small>Excel compatible</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="json" />
                                <span class="format-card">
                                    <Icon name="code" size={24} />
                                    <span class="format-info">
                                        <strong>JSON</strong>
                                        <small>Desarrollo</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="txt" />
                                <span class="format-card">
                                    <Icon name="fileText" size={24} />
                                    <span class="format-info">
                                        <strong>TXT</strong>
                                        <small>Lectura fácil</small>
                                    </span>
                                </span>
                            </label>

                            <label class="format-option">
                                <input type="radio" bind:group={exportFormat} value="md" />
                                <span class="format-card">
                                    <Icon name="fileText" size={24} />
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
                        <Icon name="download" size={20} />
                        Exportar Links
                    {/if}
                </button>

                {#if exportResult}
                    <div class="result-card">
                        <Icon name="checkCircle" size={24} color="var(--success)" />
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
        background: var(--bg-body, #FAFAFA);
        color: var(--neutral-900, #171717);
        font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', sans-serif);
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
        border: 3px solid var(--neutral-200, #E5E5E5);
        border-top-color: var(--primary, #0066FF);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Hero Section */
    .hero-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: linear-gradient(135deg, #FAFAFA 0%, #F0F4FF 100%);
        position: relative;
        overflow: hidden;
    }

    .hero-container::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 800px;
        height: 800px;
        background: radial-gradient(circle, rgba(0, 102, 255, 0.08) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    }

    .hero-grid {
        max-width: 1200px;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
        position: relative;
        z-index: 1;
    }

    /* Hero Left */
    .hero-left {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .logo-section {
        animation: fadeInUp 0.6s ease-out;
    }

    .hero-title {
        font-family: var(--font-display, 'Georgia', serif);
        font-size: 3.5rem;
        font-weight: 600;
        line-height: 1.1;
        margin: 0;
        color: var(--neutral-900, #171717);
        letter-spacing: -0.02em;
        animation: fadeInUp 0.6s ease-out 0.1s backwards;
    }

    .highlight {
        color: var(--primary, #0066FF);
        position: relative;
    }

    .hero-description {
        font-size: 1.25rem;
        line-height: 1.6;
        color: var(--neutral-600, #525252);
        margin: 0;
        max-width: 540px;
        animation: fadeInUp 0.6s ease-out 0.2s backwards;
    }

    .hero-stats {
        display: flex;
        gap: 3rem;
        animation: fadeInUp 0.6s ease-out 0.3s backwards;
    }

    .stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary, #0066FF);
        font-family: var(--font-display);
        line-height: 1;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--neutral-600, #525252);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }

    /* Hero Right */
    .hero-right {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        animation: fadeInUp 0.6s ease-out 0.4s backwards;
    }

    .cta-card {
        background: white;
        border-radius: var(--radius-xl, 16px);
        padding: 2.5rem;
        box-shadow: var(--shadow-xl);
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .cta-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--neutral-900, #171717);
    }

    .cta-description {
        margin: 0;
        color: var(--neutral-600, #525252);
        line-height: 1.5;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.25rem 2rem;
        background: var(--primary, #0066FF);
        color: white;
        border: none;
        border-radius: var(--radius-lg, 12px);
        font-size: 1.125rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast, 150ms);
        box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
        font-family: var(--font-body);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
        background: var(--primary-dark, #0052CC);
    }

    .btn-primary:active {
        transform: translateY(0);
    }

    .trust-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
        font-size: 0.875rem;
        color: var(--neutral-600, #525252);
    }

    .features-card {
        background: white;
        border-radius: var(--radius-xl, 16px);
        padding: 2rem;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border-color);
    }

    .features-title {
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--neutral-900, #171717);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .feature-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .feature-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        align-items: start;
    }

    .feature-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-light, #E6F0FF);
        color: var(--primary, #0066FF);
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.875rem;
        flex-shrink: 0;
    }

    .feature-content {
        display: flex;
        gap: 1rem;
        align-items: start;
    }

    .feature-content > div {
        flex: 1;
    }

    .feature-content strong {
        display: block;
        color: var(--neutral-900, #171717);
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .feature-content p {
        margin: 0;
        color: var(--neutral-600, #525252);
        font-size: 0.9rem;
        line-height: 1.5;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Header */
    header {
        background: var(--bg-surface, white);
        border-bottom: 1px solid var(--border-color);
        padding: 1.5rem 2rem;
        position: sticky;
        top: 0;
        z-index: var(--z-sticky, 20);
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-stats {
        display: flex;
        gap: 1rem;
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--primary, #0066FF);
        color: white;
        border-radius: var(--radius-full, 9999px);
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
        background: var(--bg-surface, white);
        border-radius: var(--radius-xl, 16px);
        padding: 2rem;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
    }

    .actions-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .options-card {
        background: var(--bg-surface, white);
        border-radius: var(--radius-xl, 16px);
        padding: 2rem;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .options-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--neutral-900, #171717);
        font-family: var(--font-body);
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
        border-radius: var(--radius-md, 8px);
        transition: background var(--transition-fast);
    }

    .toggle-option:hover {
        background: var(--neutral-50, #FAFAFA);
    }

    .toggle-option input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: var(--primary, #0066FF);
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 500;
    }

    /* Format Selector */
    .format-selector {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .format-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--neutral-900, #171717);
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
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg, 12px);
        transition: all var(--transition-fast);
        background: var(--neutral-50, #FAFAFA);
    }

    .format-option:hover .format-card {
        border-color: var(--primary-light, #E6F0FF);
        background: var(--bg-surface, white);
    }

    .format-option input:checked ~ .format-card {
        border-color: var(--primary, #0066FF);
        background: var(--primary-light, #E6F0FF);
        box-shadow: var(--shadow-md);
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
        color: var(--neutral-900, #171717);
    }

    .format-info small {
        font-size: 0.75rem;
        color: var(--neutral-600, #525252);
    }

    .btn-export {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        width: 100%;
        padding: 1.25rem 2rem;
        background: var(--primary, #0066FF);
        color: white;
        border: none;
        border-radius: var(--radius-lg, 12px);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        box-shadow: var(--shadow-lg);
        font-family: var(--font-body);
    }

    .btn-export:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
        background: var(--primary-dark, #0052CC);
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
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    .result-card {
        background: var(--bg-surface, white);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg, 12px);
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        animation: slideIn 0.3s ease-out;
        box-shadow: var(--shadow-sm);
    }

    .result-card strong {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--neutral-900, #171717);
    }

    .result-card p {
        margin: 0;
        color: var(--neutral-600, #525252);
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
    @media (max-width: 1024px) {
        .hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
        }

        .hero-title {
            font-size: 2.5rem;
        }

        .hero-left {
            text-align: center;
            align-items: center;
        }

        .hero-description {
            max-width: 100%;
        }
    }

    @media (max-width: 768px) {
        .hero-container {
            padding: 2rem 1rem;
        }

        .hero-title {
            font-size: 2rem;
        }

        .hero-description {
            font-size: 1.125rem;
        }

        .hero-stats {
            justify-content: center;
            gap: 2rem;
        }

        .cta-card,
        .features-card {
            padding: 1.5rem;
        }

        .main-content {
            padding: 1rem;
        }

        .browser-section,
        .options-card {
            padding: 1rem;
        }

        .format-options {
            grid-template-columns: repeat(2, 1fr);
        }

        .options-grid {
            grid-template-columns: 1fr;
        }
    }
</style>