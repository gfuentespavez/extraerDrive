<script>
    export let size = 'md'; // 'sm', 'md', 'lg'
    export let showText = true;
    export let variant = 'default'; // 'default', 'icon-only', 'minimal'

    const sizes = {
        sm: { icon: 32, text: '1rem' },
        md: { icon: 40, text: '1.25rem' },
        lg: { icon: 56, text: '1.75rem' }
    };

    const currentSize = sizes[size] || sizes.md;
</script>

<div class="logo" class:minimal={variant === 'minimal'} class:icon-only={!showText || variant === 'icon-only'}>
    <!-- Logo Icon -->
    <div class="logo-icon" style="width: {currentSize.icon}px; height: {currentSize.icon}px;">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Drive folder base -->
            <path
                d="M15 25L20 20H45L50 25H85C88.866 25 92 28.134 92 32V75C92 78.866 88.866 82 85 82H15C11.134 82 8 78.866 8 75V32C8 28.134 11.134 25 15 25Z"
                fill="url(#folderGradient)"
                stroke="#0052CC"
                stroke-width="2"
            />

            <!-- Link icon integrated -->
            <g opacity="0.9">
                <!-- Chain link -->
                <path
                    d="M40 48L32 56C29.791 58.209 29.791 61.791 32 64C34.209 66.209 37.791 66.209 40 64L48 56"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                />
                <path
                    d="M60 52L68 44C70.209 41.791 70.209 38.209 68 36C65.791 33.791 62.209 33.791 60 36L52 44"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                />
                <line
                    x1="46" y1="54"
                    x2="54" y2="46"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                />
            </g>

            <!-- Gradient definitions -->
            <defs>
                <linearGradient id="folderGradient" x1="8" y1="20" x2="92" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#0066FF"/>
                    <stop offset="100%" stop-color="#0052CC"/>
                </linearGradient>
            </defs>
        </svg>
    </div>

    <!-- Logo Text -->
    {#if showText && variant !== 'icon-only'}
        <div class="logo-text" style="font-size: {currentSize.text};">
            <span class="logo-title">Drive Links</span>
            {#if size !== 'sm'}
                <span class="logo-subtitle">Extractor</span>
            {/if}
        </div>
    {/if}
</div>

<style>
    .logo {
        display: inline-flex;
        align-items: center;
        gap: 0.875rem;
        cursor: pointer;
        user-select: none;
        transition: opacity var(--transition-fast, 150ms);
    }

    .logo:hover {
        opacity: 0.85;
    }

    .logo.icon-only {
        gap: 0;
    }

    .logo-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--transition-fast, 150ms);
    }

    .logo:hover .logo-icon {
        transform: scale(1.05);
    }

    .logo-icon svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 2px 4px rgba(0, 82, 204, 0.15));
    }

    .logo-text {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        line-height: 1.1;
    }

    .logo-title {
        font-family: var(--font-display, 'Georgia', serif);
        font-weight: 600;
        color: var(--neutral-900, #171717);
        letter-spacing: -0.02em;
    }

    .logo-subtitle {
        font-family: var(--font-body, sans-serif);
        font-size: 0.65em;
        font-weight: 500;
        color: var(--neutral-500, #737373);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .logo.minimal .logo-text {
        gap: 0;
    }

    .logo.minimal .logo-subtitle {
        display: none;
    }

    @media (max-width: 640px) {
        .logo {
            gap: 0.5rem;
        }

        .logo-subtitle {
            display: none;
        }
    }
</style>
