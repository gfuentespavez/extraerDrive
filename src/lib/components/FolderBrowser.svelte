<script>
    export let onFoldersSelected;

    let folders = [];
    let allFolders = []; // Todas las carpetas cargadas
    let displayedFolders = []; // Carpetas mostradas actualmente
    let selectedFolders = new Set();
    let currentPath = [];
    let loading = false;
    let searchQuery = '';
    let viewMode = 'grid'; // 'list' o 'grid'
    let gridSize = 180; // Tamaño de las tarjetas en modo cuadrícula
    let itemsPerPage = 25;
    let currentPage = 1;
    let totalPages = 1;
    let loadingProgress = 0;

    $: {
        // Filtrar carpetas según búsqueda
        if (searchQuery.trim()) {
            displayedFolders = allFolders.filter(folder =>
                folder.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            displayedFolders = allFolders;
        }

        // Calcular paginación
        totalPages = Math.ceil(displayedFolders.length / itemsPerPage);
        folders = displayedFolders.slice(0, currentPage * itemsPerPage);
    }

    async function loadFolders(folderId = null) {
        loading = true;
        loadingProgress = 0;
        currentPage = 1;

        const progressInterval = setInterval(() => {
            if (loadingProgress < 90) {
                loadingProgress += 10;
            }
        }, 100);

        const params = folderId ? `?folderId=${folderId}` : '';
        const response = await fetch(`/api/folders${params}`);
        const data = await response.json();

        clearInterval(progressInterval);
        loadingProgress = 100;

        if (data.folders) {
            allFolders = data.folders;
        }

        setTimeout(() => {
            loading = false;
            loadingProgress = 0;
        }, 300);
    }

    function toggleFolder(folder) {
        if (selectedFolders.has(folder.id)) {
            selectedFolders.delete(folder.id);
        } else {
            selectedFolders.add(folder.id);
        }
        selectedFolders = selectedFolders;
        onFoldersSelected(Array.from(selectedFolders));
    }

    function openFolder(folder) {
        currentPath = [...currentPath, folder];
        searchQuery = '';
        loadFolders(folder.id);
    }

    function goBack() {
        currentPath.pop();
        const parent = currentPath[currentPath.length - 1];
        searchQuery = '';
        loadFolders(parent ? parent.id : null);
        currentPath = currentPath;
    }

    function goToRoot() {
        currentPath = [];
        searchQuery = '';
        loadFolders();
    }

    function navigateToPath(index) {
        currentPath = currentPath.slice(0, index + 1);
        const folder = currentPath[index];
        searchQuery = '';
        loadFolders(folder.id);
    }

    function loadMore() {
        if (currentPage < totalPages) {
            currentPage++;
        }
    }

    function clearSelection() {
        selectedFolders.clear();
        selectedFolders = selectedFolders;
        onFoldersSelected([]);
    }

    import { onMount } from 'svelte';
    onMount(() => {
        loadFolders();
    });
</script>

<div class="folder-browser">
    <!-- Sidebar izquierda -->
    <aside class="sidebar">
        <div class="controls-section">
            <h3 class="section-title">Vista</h3>
            <div class="view-toggle">
                <button
                    class="view-btn"
                    class:active={viewMode === 'list'}
                    on:click={() => viewMode = 'list'}
                    title="Vista de lista"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Lista
                </button>
                <button
                    class="view-btn"
                    class:active={viewMode === 'grid'}
                    on:click={() => viewMode = 'grid'}
                    title="Vista de cuadrícula"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Cuadrícula
                </button>
            </div>

            {#if viewMode === 'grid'}
                <div class="grid-size-control">
                    <label class="control-label">
                        <span>Tamaño</span>
                        <span class="size-value">{gridSize}px</span>
                    </label>
                    <input
                        type="range"
                        min="120"
                        max="300"
                        step="20"
                        bind:value={gridSize}
                        class="slider"
                    />
                    <div class="slider-labels">
                        <span>Pequeño</span>
                        <span>Grande</span>
                    </div>
                </div>
            {/if}
        </div>

        <div class="controls-section">
            <h3 class="section-title">Búsqueda</h3>
            <div class="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input
                    type="text"
                    placeholder="Buscar carpetas..."
                    bind:value={searchQuery}
                />
                {#if searchQuery}
                    <button class="clear-search" on:click={() => searchQuery = ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                {/if}
            </div>
            {#if searchQuery && displayedFolders.length > 0}
                <p class="search-results">{displayedFolders.length} resultado{displayedFolders.length !== 1 ? 's' : ''}</p>
            {/if}
        </div>

        {#if selectedFolders.size > 0}
            <div class="controls-section selection-section">
                <h3 class="section-title">Selección</h3>
                <div class="selection-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>{selectedFolders.size} seleccionada{selectedFolders.size !== 1 ? 's' : ''}</span>
                </div>
                <button class="btn-clear" on:click={clearSelection}>
                    Limpiar selección
                </button>
            </div>
        {/if}

        <div class="controls-section stats-section">
            <h3 class="section-title">Estadísticas</h3>
            <div class="stat-item">
                <span class="stat-label">Carpetas totales</span>
                <span class="stat-value">{allFolders.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Mostrando</span>
                <span class="stat-value">{folders.length}</span>
            </div>
            {#if searchQuery}
                <div class="stat-item">
                    <span class="stat-label">Resultados</span>
                    <span class="stat-value">{displayedFolders.length}</span>
                </div>
            {/if}
        </div>
    </aside>

    <!-- Contenido principal -->
    <main class="main-area">
        <div class="breadcrumb">
            <button class="breadcrumb-item" class:active={currentPath.length === 0} on:click={goToRoot}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Mi Drive
            </button>
            {#each currentPath as folder, i}
                <span class="breadcrumb-separator">/</span>
                <button class="breadcrumb-item" class:active={i === currentPath.length - 1} on:click={() => navigateToPath(i)}>
                    {folder.name}
                </button>
            {/each}
        </div>

        {#if loading}
            <div class="loading-state">
                <div class="spinner-small"></div>
                <p>Cargando carpetas...</p>
            </div>
        {:else if folders.length === 0}
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>{searchQuery ? 'No se encontraron carpetas' : 'No hay carpetas en esta ubicación'}</p>
            </div>
        {:else}
            <div class="folder-container" class:list-view={viewMode === 'list'} class:grid-view={viewMode === 'grid'} style={viewMode === 'grid' ? `--grid-size: ${gridSize}px` : ''}>
                {#each folders as folder}
                    <div class="folder-item" class:selected={selectedFolders.has(folder.id)} class:shared={folder.isShared} class:shortcut={folder.isShortcut}>
                        <label class="folder-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedFolders.has(folder.id)}
                                on:change={() => toggleFolder(folder)}
                            />
                            <span class="checkmark"></span>
                        </label>

                        <button class="folder-content" on:click={() => openFolder(folder)}>
                            <div class="folder-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <span class="folder-name">{folder.name}</span>
                            {#if viewMode === 'list'}
                                <svg class="folder-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>

            {#if currentPage < totalPages}
                <div class="load-more-container">
                    <button class="btn-load-more" on:click={loadMore}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="17 13 12 18 7 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="17 6 12 11 7 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Cargar más ({displayedFolders.length - folders.length} restantes)
                    </button>
                    <p class="pagination-info">Mostrando {folders.length} de {displayedFolders.length}</p>
                </div>
            {/if}
        {/if}

        <!-- Progress bar -->
        {#if loading && loadingProgress > 0}
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: {loadingProgress}%"></div>
            </div>
        {/if}
    </main>
</div>

<style>
    .folder-browser {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 2rem;
        min-height: 500px;
    }

    /* Sidebar */
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .controls-section {
        background: #fafafa;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid rgba(26, 26, 26, 0.06);
    }

    .section-title {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #1a1a1a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* View Toggle */
    .view-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .view-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: white;
        border: 2px solid rgba(26, 26, 26, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        color: #666;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .view-btn:hover {
        border-color: rgba(26, 26, 26, 0.3);
        color: #1a1a1a;
    }

    .view-btn.active {
        border-color: #1a1a1a;
        background: #1a1a1a;
        color: white;
    }

    /* Grid Size Control */
    .grid-size-control {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(26, 26, 26, 0.06);
    }

    .control-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #1a1a1a;
    }

    .size-value {
        color: #666;
        font-size: 0.8rem;
    }

    .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(26, 26, 26, 0.1);
        outline: none;
        -webkit-appearance: none;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #1a1a1a;
        cursor: pointer;
        transition: all 0.2s;
    }

    .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #1a1a1a;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
    }

    .slider::-moz-range-thumb:hover {
        transform: scale(1.2);
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        font-size: 0.7rem;
        color: #999;
    }

    /* Search Box */
    .search-box {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: white;
        border: 2px solid rgba(26, 26, 26, 0.1);
        border-radius: 8px;
        transition: border-color 0.2s;
    }

    .search-box:focus-within {
        border-color: #1a1a1a;
    }

    .search-box svg {
        color: #999;
        flex-shrink: 0;
    }

    .search-box input {
        flex: 1;
        border: none;
        outline: none;
        background: none;
        font-size: 0.875rem;
        color: #1a1a1a;
    }

    .search-box input::placeholder {
        color: #999;
    }

    .clear-search {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: #999;
        display: flex;
        align-items: center;
        transition: color 0.2s;
    }

    .clear-search:hover {
        color: #1a1a1a;
    }

    .search-results {
        margin: 0.5rem 0 0 0;
        font-size: 0.8rem;
        color: #666;
    }

    /* Selection Section */
    .selection-section {
        background: #1a1a1a;
        color: white;
    }

    .selection-section .section-title {
        color: white;
    }

    .selection-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .btn-clear {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .btn-clear:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    /* Stats Section */
    .stats-section {
        background: white;
        border: 1px solid rgba(26, 26, 26, 0.08);
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .stat-item:not(:last-child) {
        border-bottom: 1px solid rgba(26, 26, 26, 0.06);
    }

    .stat-label {
        font-size: 0.85rem;
        color: #666;
    }

    .stat-value {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    /* Main Area */
    .main-area {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        position: relative;
    }

    /* Breadcrumb */
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding: 1rem;
        background: #fafafa;
        border-radius: 8px;
        border: 1px solid rgba(26, 26, 26, 0.06);
    }

    .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: none;
        border: none;
        border-radius: 6px;
        color: #666;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .breadcrumb-item:hover {
        background: rgba(26, 26, 26, 0.05);
        color: #1a1a1a;
    }

    .breadcrumb-item.active {
        color: #1a1a1a;
        font-weight: 600;
    }

    .breadcrumb-separator {
        color: #ccc;
        user-select: none;
    }

    /* Loading and Empty States */
    .loading-state,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        gap: 1rem;
        color: #999;
    }

    .spinner-small {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(26, 26, 26, 0.1);
        border-top-color: #1a1a1a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Folder Container */
    .folder-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .folder-container.grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--grid-size, 180px), 1fr));
        gap: 1rem;
    }

    /* Folder Items - List View */
    .list-view .folder-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #fafafa;
        border: 2px solid transparent;
        border-radius: 8px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .list-view .folder-item:hover {
        background: #f5f5f5;
        border-color: rgba(26, 26, 26, 0.1);
    }

    .list-view .folder-item.selected {
        background: #fff;
        border-color: #1a1a1a;
        box-shadow: 0 2px 8px rgba(26, 26, 26, 0.08);
    }

    .list-view .folder-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-align: left;
        min-width: 0;
    }

    /* Folder Items - Grid View */
.grid-view .folder-item {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    background: #fafafa;
    border: 2px solid transparent;
    border-radius: 12px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    height: var(--grid-size, 180px);
    position: relative;
    overflow: hidden; /* Importante para evitar desbordamiento */
}

    .grid-view .folder-item:hover {
        background: #f5f5f5;
        border-color: rgba(26, 26, 26, 0.1);
        transform: translateY(-2px);
    }

    .grid-view .folder-item.selected {
        background: #fff;
        border-color: #1a1a1a;
        box-shadow: 0 4px 12px rgba(26, 26, 26, 0.12);
    }

.grid-view .folder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex: 1;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: center;
    width: 100%;
    min-width: 0; /* Esto es clave para que funcione el overflow */
}

    .grid-view .folder-icon {
        font-size: 2rem;
    }

    .grid-view .folder-icon svg {
        width: 48px;
        height: 48px;
    }

.grid-view .folder-name {
    font-size: 0.85rem;
    line-height: 1.3;
    max-height: 2.6em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
    width: 100%;
}

    /* Common folder styles */
    .folder-item.shortcut {
        border-left: 3px solid #03a9f4;
    }

    .folder-item.shared {
        border-left: 3px solid #ff9800;
    }

    .folder-checkbox {
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
    }

    .grid-view .folder-checkbox {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
    }

    .folder-checkbox input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
    }

    .checkmark {
        display: block;
        width: 20px;
        height: 20px;
        border: 2px solid #ccc;
        border-radius: 4px;
        transition: all 0.2s;
        background: white;
    }

    .folder-checkbox:hover .checkmark {
        border-color: #1a1a1a;
    }

    .folder-checkbox input:checked ~ .checkmark {
        background: #1a1a1a;
        border-color: #1a1a1a;
    }

    .folder-checkbox input:checked ~ .checkmark::after {
        content: '';
        position: absolute;
        left: 7px;
        top: 3px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }

    .folder-icon {
        flex-shrink: 0;
        color: #666;
        display: flex;
        align-items: center;
        transition: color 0.2s;
    }

    .folder-item:hover .folder-icon {
        color: #1a1a1a;
    }

    .folder-name {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 500;
        color: #1a1a1a;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .folder-arrow {
        flex-shrink: 0;
        color: #ccc;
        transition: all 0.2s;
    }

    .folder-item:hover .folder-arrow {
        color: #1a1a1a;
        transform: translateX(2px);
    }

    /* Load More */
    .load-more-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2rem 0;
    }

    .btn-load-more {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        background: #1a1a1a;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-load-more:hover {
        background: #2a2a2a;
        transform: translateY(-1px);
    }

    .pagination-info {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
    }

    /* Progress Bar */
    .progress-bar-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(26, 26, 26, 0.1);
        z-index: 100;
    }

    .progress-bar {
        height: 100%;
        background: #1a1a1a;
        transition: width 0.3s ease;
    }

    /* Responsive */
    @media (max-width: 1024px) {
        .folder-browser {
            grid-template-columns: 1fr;
        }

        .sidebar {
            order: 2;
        }

        .main-area {
            order: 1;
        }
    }

    @media (max-width: 768px) {
        .folder-container.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        }

        .view-toggle {
            grid-template-columns: 1fr;
        }
    }
</style>