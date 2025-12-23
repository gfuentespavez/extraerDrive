<script>
    import Icon from '$lib/components/Icon.svelte';
    import { onMount } from 'svelte';

    export let onFoldersSelected;

    let folders = [];
    let allFolders = [];
    let displayedFolders = [];
    let selectedFolders = new Set();
    let currentPath = [];
    let loading = false;
    let searchQuery = '';
    let viewMode = 'grid';
    let gridSize = 180;
    let itemsPerPage = 25;
    let currentPage = 1;
    let totalPages = 1;
    let loadingProgress = 0;

    $: {
        if (searchQuery.trim()) {
            displayedFolders = allFolders.filter(folder =>
                folder.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            displayedFolders = allFolders;
        }

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

    onMount(() => {
        loadFolders();
    });
</script>

<div class="folder-browser">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="controls-section">
            <h3 class="section-title">
                <Icon name="sliders" size={16} />
                Vista
            </h3>
            <div class="view-toggle">
                <button
                    class="view-btn"
                    class:active={viewMode === 'list'}
                    on:click={() => viewMode = 'list'}
                    title="Vista de lista"
                    aria-label="Vista de lista"
                >
                    <Icon name="list" size={20} />
                    Lista
                </button>
                <button
                    class="view-btn"
                    class:active={viewMode === 'grid'}
                    on:click={() => viewMode = 'grid'}
                    title="Vista de cuadrícula"
                    aria-label="Vista de cuadrícula"
                >
                    <Icon name="grid" size={20} />
                    Cuadrícula
                </button>
            </div>

            {#if viewMode === 'grid'}
                <div class="grid-size-control">
                    <label class="control-label" for="grid-size-slider">
                        <span>Tamaño</span>
                        <span class="size-value">{gridSize}px</span>
                    </label>
                    <input
                        id="grid-size-slider"
                        type="range"
                        min="120"
                        max="300"
                        step="20"
                        bind:value={gridSize}
                        class="slider"
                        aria-label="Ajustar tamaño de cuadrícula"
                    />
                    <div class="slider-labels">
                        <span>Pequeño</span>
                        <span>Grande</span>
                    </div>
                </div>
            {/if}
        </div>

        <div class="controls-section">
            <h3 class="section-title">
                <Icon name="search" size={16} />
                Búsqueda
            </h3>
            <div class="search-box">
                <Icon name="search" size={18} />
                <input
                    type="text"
                    placeholder="Buscar carpetas..."
                    bind:value={searchQuery}
                    aria-label="Buscar carpetas"
                />
                {#if searchQuery}
                    <button
                        class="clear-search"
                        on:click={() => searchQuery = ''}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda"
                    >
                        <Icon name="x" size={16} />
                    </button>
                {/if}
            </div>
            {#if searchQuery && displayedFolders.length > 0}
                <p class="search-results">
                    <Icon name="info" size={14} />
                    {displayedFolders.length} resultado{displayedFolders.length !== 1 ? 's' : ''}
                </p>
            {/if}
        </div>

        {#if selectedFolders.size > 0}
            <div class="controls-section selection-section">
                <h3 class="section-title">
                    <Icon name="checkCircle" size={16} />
                    Selección
                </h3>
                <div class="selection-info">
                    <Icon name="folder" size={20} />
                    <span>{selectedFolders.size} seleccionada{selectedFolders.size !== 1 ? 's' : ''}</span>
                </div>
                <button class="btn-clear" on:click={clearSelection}>
                    <Icon name="x" size={16} />
                    Limpiar selección
                </button>
            </div>
        {/if}

        <div class="controls-section stats-section">
            <h3 class="section-title">
                <Icon name="info" size={16} />
                Estadísticas
            </h3>
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

    <!-- Main Area -->
    <main class="main-area">
        <div class="breadcrumb">
            <button
                class="breadcrumb-item"
                class:active={currentPath.length === 0}
                on:click={goToRoot}
                aria-label="Ir a Mi Drive"
            >
                <Icon name="home" size={16} />
                Mi Drive
            </button>
            {#each currentPath as folder, i}
                <Icon name="chevronRight" size={14} color="var(--neutral-400)" />
                <button
                    class="breadcrumb-item"
                    class:active={i === currentPath.length - 1}
                    on:click={() => navigateToPath(i)}
                    aria-label="Ir a {folder.name}"
                >
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
                <Icon name="folder" size={64} color="var(--neutral-300)" />
                <p>{searchQuery ? 'No se encontraron carpetas' : 'No hay carpetas en esta ubicación'}</p>
            </div>
        {:else}
            <div
                class="folder-container"
                class:list-view={viewMode === 'list'}
                class:grid-view={viewMode === 'grid'}
                style={viewMode === 'grid' ? `--grid-size: ${gridSize}px` : ''}
            >
                {#each folders as folder}
                    <div
                        class="folder-item"
                        class:selected={selectedFolders.has(folder.id)}
                        class:shared={folder.isShared}
                        class:shortcut={folder.isShortcut}
                    >
                        <label class="folder-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedFolders.has(folder.id)}
                                on:change={() => toggleFolder(folder)}
                                aria-label="Seleccionar {folder.name}"
                            />
                            <span class="checkmark"></span>
                        </label>

                        <button
                            class="folder-content"
                            on:click={() => openFolder(folder)}
                            aria-label="Abrir carpeta {folder.name}"
                        >
                            <div class="folder-icon">
                                <Icon name="folder" size={viewMode === 'grid' ? 48 : 24} />
                            </div>
                            <span class="folder-name">{folder.name}</span>
                            {#if viewMode === 'list'}
                                <Icon name="chevronRight" size={16} class="folder-arrow" />
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>

            {#if currentPage < totalPages}
                <div class="load-more-container">
                    <button class="btn-load-more" on:click={loadMore}>
                        <Icon name="chevronDown" size={20} />
                        Cargar más ({displayedFolders.length - folders.length} restantes)
                    </button>
                    <p class="pagination-info">
                        Mostrando {folders.length} de {displayedFolders.length}
                    </p>
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
        grid-template-columns: var(--sidebar-width, 280px) 1fr;
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
        background: var(--neutral-50, #FAFAFA);
        border-radius: var(--radius-lg, 12px);
        padding: 1.25rem;
        border: 1px solid var(--border-color);
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        font-size: var(--text-xs, 0.75rem);
        font-weight: 600;
        color: var(--neutral-900, #171717);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wider, 0.05em);
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
        background: var(--bg-surface, white);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md, 8px);
        cursor: pointer;
        transition: all var(--transition-fast);
        color: var(--neutral-600, #525252);
        font-size: var(--text-xs, 0.75rem);
        font-weight: 500;
        font-family: var(--font-body);
    }

    .view-btn:hover {
        border-color: var(--primary-light, #E6F0FF);
        color: var(--neutral-900, #171717);
    }

    .view-btn.active {
        border-color: var(--primary, #0066FF);
        background: var(--primary-light, #E6F0FF);
        color: var(--primary, #0066FF);
    }

    /* Grid Size Control */
    .grid-size-control {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    .control-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: var(--text-sm, 0.875rem);
        font-weight: 500;
        color: var(--neutral-900, #171717);
    }

    .size-value {
        color: var(--neutral-600, #525252);
        font-size: var(--text-xs, 0.75rem);
        font-family: var(--font-mono);
    }

    .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--neutral-200, #E5E5E5);
        outline: none;
        -webkit-appearance: none;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary, #0066FF);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary, #0066FF);
        cursor: pointer;
        border: none;
        transition: all var(--transition-fast);
    }

    .slider::-moz-range-thumb:hover {
        transform: scale(1.2);
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        font-size: var(--text-xs, 0.7rem);
        color: var(--neutral-500, #737373);
    }

    /* Search Box */
    .search-box {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: var(--bg-surface, white);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md, 8px);
        transition: border-color var(--transition-fast);
    }

    .search-box:focus-within {
        border-color: var(--primary, #0066FF);
    }

    .search-box input {
        flex: 1;
        border: none;
        outline: none;
        background: none;
        font-size: var(--text-sm, 0.875rem);
        color: var(--neutral-900, #171717);
        font-family: var(--font-body);
    }

    .search-box input::placeholder {
        color: var(--neutral-400, #A3A3A3);
    }

    .clear-search {
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--neutral-400, #A3A3A3);
        display: flex;
        align-items: center;
        transition: color var(--transition-fast);
    }

    .clear-search:hover {
        color: var(--neutral-900, #171717);
    }

    .search-results {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0 0 0;
        font-size: var(--text-xs, 0.8rem);
        color: var(--neutral-600, #525252);
    }

    /* Selection Section */
    .selection-section {
        background: var(--primary, #0066FF);
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
        font-size: var(--text-sm, 0.9rem);
    }

    .btn-clear {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-sm, 6px);
        color: white;
        cursor: pointer;
        font-size: var(--text-sm, 0.875rem);
        font-weight: 500;
        transition: all var(--transition-fast);
        font-family: var(--font-body);
    }

    .btn-clear:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    /* Stats Section */
    .stats-section {
        background: var(--bg-surface, white);
        border: 1px solid var(--border-color);
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .stat-item:not(:last-child) {
        border-bottom: 1px solid var(--border-color);
    }

    .stat-label {
        font-size: var(--text-sm, 0.85rem);
        color: var(--neutral-600, #525252);
    }

    .stat-value {
        font-size: var(--text-sm, 0.9rem);
        font-weight: 600;
        color: var(--neutral-900, #171717);
        font-family: var(--font-mono);
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
        background: var(--neutral-50, #FAFAFA);
        border-radius: var(--radius-md, 8px);
        border: 1px solid var(--border-color);
    }

    .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: none;
        border: none;
        border-radius: var(--radius-sm, 6px);
        color: var(--neutral-600, #525252);
        font-size: var(--text-sm, 0.9rem);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-weight: 500;
        font-family: var(--font-body);
    }

    .breadcrumb-item:hover {
        background: rgba(0, 102, 255, 0.05);
        color: var(--primary, #0066FF);
    }

    .breadcrumb-item.active {
        color: var(--neutral-900, #171717);
        font-weight: 600;
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
        color: var(--neutral-500, #737373);
    }

    .spinner-small {
        width: 32px;
        height: 32px;
        border: 3px solid var(--neutral-200, #E5E5E5);
        border-top-color: var(--primary, #0066FF);
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
        background: var(--neutral-50, #FAFAFA);
        border: 2px solid transparent;
        border-radius: var(--radius-md, 8px);
        transition: all var(--transition-fast);
    }

    .list-view .folder-item:hover {
        background: var(--bg-surface, white);
        border-color: var(--border-color);
    }

    .list-view .folder-item.selected {
        background: var(--bg-surface, white);
        border-color: var(--primary, #0066FF);
        box-shadow: var(--shadow-md);
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
        background: var(--neutral-50, #FAFAFA);
        border: 2px solid transparent;
        border-radius: var(--radius-lg, 12px);
        transition: all var(--transition-fast);
        height: var(--grid-size, 180px);
        position: relative;
        overflow: hidden;
    }

    .grid-view .folder-item:hover {
        background: var(--bg-surface, white);
        border-color: var(--border-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .grid-view .folder-item.selected {
        background: var(--bg-surface, white);
        border-color: var(--primary, #0066FF);
        box-shadow: var(--shadow-lg);
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
        min-width: 0;
    }

    .grid-view .folder-icon {
        color: var(--primary, #0066FF);
    }

    .grid-view .folder-name {
        font-size: var(--text-sm, 0.85rem);
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
        border-left: 3px solid var(--info, #3B82F6);
    }

    .folder-item.shared {
        border-left: 3px solid var(--warning, #F59E0B);
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
        z-index: 10;
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
        border: 2px solid var(--neutral-300, #D4D4D4);
        border-radius: var(--radius-xs, 4px);
        transition: all var(--transition-fast);
        background: var(--bg-surface, white);
    }

    .folder-checkbox:hover .checkmark {
        border-color: var(--primary, #0066FF);
    }

    .folder-checkbox input:checked ~ .checkmark {
        background: var(--primary, #0066FF);
        border-color: var(--primary, #0066FF);
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
        color: var(--neutral-600, #525252);
        display: flex;
        align-items: center;
        transition: color var(--transition-fast);
    }

    .folder-item:hover .folder-icon {
        color: var(--primary, #0066FF);
    }

    .folder-name {
        flex: 1;
        font-size: var(--text-base, 0.95rem);
        font-weight: 500;
        color: var(--neutral-900, #171717);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        background: var(--primary, #0066FF);
        color: white;
        border: none;
        border-radius: var(--radius-md, 8px);
        font-size: var(--text-sm, 0.9rem);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-family: var(--font-body);
    }

    .btn-load-more:hover {
        background: var(--primary-dark, #0052CC);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }

    .pagination-info {
        margin: 0;
        font-size: var(--text-sm, 0.85rem);
        color: var(--neutral-600, #525252);
    }

    /* Progress Bar */
    .progress-bar-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--neutral-200, #E5E5E5);
        z-index: var(--z-fixed, 30);
    }

    .progress-bar {
        height: 100%;
        background: var(--primary, #0066FF);
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