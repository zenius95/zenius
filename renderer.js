const { ipcRenderer } = require('electron');
const startMenu = document.getElementById('start-menu');

// Tab Switching Logic
function switchTab(tabName) {
    const activeTabContent = document.getElementById('tab-' + tabName);

    // Toggle Logic: If clicking active tab, minimize it
    if (!activeTabContent.classList.contains('hidden')) {
        minimizeTab(tabName);
        return;
    }

    // Ensure Tab is visible (if it was closed)
    const tabs = document.querySelectorAll('.chrome-tab');
    tabs.forEach(el => {
        if (el.getAttribute('onclick').includes(tabName)) {
            el.classList.remove('hidden'); // Show tab if hidden
            el.classList.add('flex'); // Restore flex layout
        }
    });

    // Update Tabs Active State
    tabs.forEach(el => {
        el.classList.remove('active');
        // el.classList.add('bg-white/10', 'text-white/70'); // Handled by CSS not(.active)
        if (el.getAttribute('onclick').includes(tabName)) {
            el.classList.add('active');
            // el.classList.remove('bg-white/10', 'text-white/70'); // Handled by CSS active
        }
    });

    // Update Content Areas
    document.querySelectorAll('.content-pane').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex'); // Ensure flex is removed when hidden
    });

    // Hide Start Page
    const startPage = document.getElementById('start-page');
    if (startPage) {
        startPage.classList.add('hidden');
        startPage.classList.remove('flex');
    }
    // Reload if it was unloaded (Memory Optimization)
    const webview = activeTabContent.querySelector('webview');
    if (webview && webview.getAttribute('src') === 'about:blank' && initialUrls[tabName]) {
        webview.src = initialUrls[tabName];
    }

    activeTabContent.classList.remove('hidden');
    activeTabContent.classList.add('flex'); // Ensure flex is added when shown

    // SHOW New Tab Button & Separator
    const newTabBtn = document.getElementById('new-tab-btn');
    const separator = document.getElementById('tab-separator');

    if (newTabBtn) {
        newTabBtn.classList.remove('hidden');
        newTabBtn.classList.add('flex');
    }
}

// Global variables to store initial URLs
const initialUrls = {};

// Minimize logic (Hide Tab, Keep Bubble Active)
function minimizeTab(tabName) {
    // Hide Content
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('hidden');
    activeTab.classList.remove('flex');

    // Deactivate Tab
    document.querySelectorAll('.chrome-tab').forEach(el => {
        if (el.getAttribute('onclick').includes(tabName)) {
            el.classList.remove('active');
            // Styling handled by CSS not(.active)
        }
    });

    // SHOW START PAGE
    showStartPage();
}

// Show Start Page Logic
function showStartPage() {
    // Hide all tabs
    document.querySelectorAll('.content-pane').forEach(el => {
        if (el.id !== 'start-page') {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    // Deactivate all chrome tabs
    document.querySelectorAll('.chrome-tab').forEach(el => {
        el.classList.remove('active');
    });

    // Show Start Page
    const startPage = document.getElementById('start-page');
    startPage.classList.remove('hidden');
    startPage.classList.add('flex');

    // Thoát Fullscreen (Zen Mode) khi quay về Màn hình chính
    document.body.classList.remove('fullscreen-mode');
    document.querySelectorAll('.btn-fullscreen i').forEach(icon => {
        icon.classList.remove('ri-fullscreen-exit-line');
        icon.classList.add('ri-fullscreen-line');
    });

    // Focus Input
    const input = document.getElementById('start-page-input');
    if (input) {
        input.value = '';
        input.focus();
    }
    // HIDE New Tab Button & Separator
    // HIDE New Tab Button & Separator
    const newTabBtn = document.getElementById('new-tab-btn');
    const separator = document.getElementById('tab-separator');

    if (newTabBtn) {
        newTabBtn.classList.add('hidden');
        newTabBtn.classList.remove('flex');
    }
    if (separator) {
        separator.classList.add('hidden');
    }
}

// Close logic (Hide & Unload to save memory & Remove Tab)
function closeTab(tabName) {
    // Remove the tab content pane
    const tabContent = document.getElementById('tab-' + tabName);
    if (tabContent) {
        tabContent.remove();
    }

    // Remove the tab button from the tab bar
    const tabButton = document.getElementById(`bubble-${tabName}`);
    if (tabButton) {
        tabButton.remove();
    }

    // Unload Webview to about:blank to free up memory (if it still exists)
    // This part might be redundant if tabContent.remove() handles it, but good for safety
    setTimeout(() => {
        const webview = tabContent ? tabContent.querySelector('webview') : null;
        if (webview) {
            webview.src = 'about:blank';
        }
    }, 300);

    // Check if there are any active tabs left
    const remainingTabs = document.querySelectorAll('.chrome-tab:not(.hidden)');
    if (remainingTabs.length > 0) {
        // If there are, activate the last one
        const lastTab = remainingTabs[remainingTabs.length - 1];
        const lastTabName = lastTab.id.replace('bubble-', '');
        switchTab(lastTabName);
    } else {
        // If no tabs left, show the start page
        showStartPage();
    }
}

// Fullscreen toggle logic
function toggleFullscreen(tabName) {
    // Toggle CSS class on body for UI adjustments
    document.body.classList.toggle('fullscreen-mode');

    // Optional: Update icon
    const btnIcon = document.querySelector(`#btn-fullscreen-${tabName} i`);
    if (btnIcon) {
        if (document.body.classList.contains('fullscreen-mode')) {
            btnIcon.classList.remove('ri-fullscreen-line');
            btnIcon.classList.add('ri-fullscreen-exit-line');
        } else {
            btnIcon.classList.remove('ri-fullscreen-exit-line');
            btnIcon.classList.add('ri-fullscreen-line');
        }
    }
}


// Create New Tab (Button Click) -> Just Show Start Page
function createNewTab() {
    showStartPage();
}

// Handle Search from Static Start Page
function handleStartPageSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (!query) return;

        // Create actual tab
        createWebTab(query);

        // Clear input
        event.target.value = '';
    }
}

// Create ACTUAL Web Tab functioning
function createWebTab(query) {
    const tabId = 'tab-' + Date.now(); // Unique ID
    const tabName = tabId;

    let url = query;
    // Simple URL detection
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
        } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        }
    }

    // 1. Create Tab In Top Bar
    const tabBar = document.getElementById('tab-bar');
    const newTabBtn = document.getElementById('new-tab-btn');

    const tabBtn = document.createElement('div');
    tabBtn.id = `bubble-${tabName}`; // Keeping bubble- prefix for consistency with JS logic
    // Initial State: Spinner + Title "Loading..."
    // Classes for Taskbar Style (button-like)
    tabBtn.className = 'chrome-tab group flex items-center gap-2 px-3 min-w-[140px] max-w-[220px] cursor-pointer select-none text-xs';
    tabBtn.setAttribute('onclick', `switchTab('${tabName}')`);

    tabBtn.innerHTML = `
        <div class="relative w-4 h-4 flex items-center justify-center pointer-events-none">
                <i class="ri-loader-4-line animate-spin"></i>
        </div>
        <span class="truncate flex-1 pointer-events-none font-medium">Loading...</span>
        <button onclick="closeTab('${tabName}'); event.stopPropagation();" class="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-current">
            <i class="ri-close-line"></i>
        </button>
    `;

    if (tabBar && newTabBtn) {
        tabBar.insertBefore(tabBtn, newTabBtn);
    } else {
        // Fallback
        if (tabBar) tabBar.appendChild(tabBtn);
    }

    // 2. Create Content Pane
    const contentArea = document.querySelector('#start-menu > .flex-1.w-full.relative.overflow-hidden');
    const newPane = document.createElement('div');
    newPane.id = 'tab-' + tabName;
    newPane.className = 'content-pane w-full h-full glass-panel rounded-xl overflow-hidden shadow-2xl hidden flex-col transition-all duration-300 origin-left';

    newPane.innerHTML = `
        <div class="h-10 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-2 text-gray-700">
                <!-- Navigation Controls -->
                <div class="flex items-center gap-1 mr-2">
                    <button id="back-${tabName}" class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" disabled>
                        <i class="ri-arrow-left-line"></i>
                    </button>
                    <button id="forward-${tabName}" class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" disabled>
                        <i class="ri-arrow-right-line"></i>
                    </button>
                    <button id="reload-${tabName}" class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors">
                        <i class="ri-refresh-line"></i>
                    </button>
                    <button id="bookmark-${tabName}" onclick="openBookmarkModal('${tabName}')" class="w-6 h-6 rounded-full hover:bg-yellow-100 flex items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors ml-1">
                        <i id="star-${tabName}" class="ri-star-line"></i>
                    </button>
                </div>
                <div class="w-[1px] h-4 bg-gray-300 mx-1"></div>

                <!-- Icon Container -->
                <div class="relative w-4 h-4 flex items-center justify-center">
                    <i id="spinner-${tabName}" class="ri-loader-4-line animate-spin text-blue-500 text-sm absolute"></i>
                    <img id="favicon-${tabName}" src="" class="hidden w-full h-full object-contain absolute">
                    <i id="default-icon-${tabName}" class="ri-global-line text-blue-500 text-sm absolute hidden"></i>
                </div>
                <!-- Editable URL Bar (Looks like title normally) -->
                <input type="text" id="title-${tabName}" value="${query}" readonly data-url="${url}" data-title="${query}"
                    class="text-xs font-bold tracking-wide truncate max-w-[500px] bg-transparent border-none outline-none focus:ring-0 focus:border-b focus:border-blue-400 focus:bg-gray-100/50 rounded px-1 py-0.5 transition-colors cursor-default focus:cursor-text"
                    ondblclick="this.removeAttribute('readonly'); this.value = this.dataset.url || this.value; this.select();"
                    onblur="this.setAttribute('readonly', true); this.value = this.dataset.title || this.value; window.getSelection().removeAllRanges();"
                    onkeydown="if(event.key === 'Enter') { this.blur(); document.querySelector('#tab-${tabName} webview').loadURL(this.value.startsWith('http') ? this.value : 'https://' + this.value); }">
            </div>
            <div class="flex gap-2">
                <button onclick="minimizeTab('${tabName}')" class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                    <i class="ri-subtract-line"></i>
                </button>
                <button id="btn-fullscreen-${tabName}" onclick="toggleFullscreen('${tabName}')" class="btn-fullscreen w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                    <i class="ri-fullscreen-line"></i>
                </button>
                <button onclick="closeTab('${tabName}')" class="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors">
                    <i class="ri-close-line"></i>
                </button>
            </div>
        </div>
        <webview src="${url}" class="flex-1 w-full bg-white"
                    partition="persist:zenius" allowpopups webpreferences="nativeWindowOpen=yes"></webview>
    `;

    contentArea.appendChild(newPane);

    // Hide Menus when opening new tab (using system-ui.js if available, else manual?)
    // In renderer.js old code: closeAllMenus(). 
    // Now closeAllMenus is in system-ui.js. 
    // Since system-ui.js is loaded, closeAllMenus() IS available globally.
    if (typeof closeAllMenus === 'function') {
        closeAllMenus();
    }

    // 3. Register URL
    initialUrls[tabName] = url;

    // 4. Initialize Scrollbar and Title Update
    const newWebview = newPane.querySelector('webview');
    newWebview.addEventListener('dom-ready', () => {
        newWebview.insertCSS(customScrollbarCSS);
        // Inject click/focus listener
        newWebview.executeJavaScript(`
            document.addEventListener('click', () => { console.log('__WEBVIEW_INTERACT__'); });
            document.addEventListener('focus', () => { console.log('__WEBVIEW_INTERACT__'); });
        `, false).catch(() => { });
    });

    newWebview.addEventListener('console-message', (e) => {
        if (e.message === '__WEBVIEW_INTERACT__') {
            if (typeof closeAllMenus === 'function') {
                closeAllMenus();
            }
        }
    });

    // Loading & Favicon Logic
    let currentFavicon = null;
    const spinner = document.getElementById(`spinner-${tabName}`);
    const favicon = document.getElementById(`favicon-${tabName}`);
    const defaultIcon = document.getElementById(`default-icon-${tabName}`);
    const tabEl = document.getElementById(`bubble-${tabName}`); // This is now the chrome-tab div

    // Update Tab UI Helper
    const updateTabUI = (faIconContent) => {
        if (!tabEl) return;
        // Structure: [IconContainer] [TitleSpan] [CloseBtn]
        // IconContainer is first child
        const iconContainer = tabEl.firstElementChild;
        if (iconContainer) iconContainer.innerHTML = faIconContent;
    };

    const showSpinner = () => {
        if (spinner) spinner.classList.remove('hidden');
        if (favicon) favicon.classList.add('hidden');
        if (defaultIcon) defaultIcon.classList.add('hidden');
        updateTabUI('<i class="ri-loader-4-line animate-spin"></i>');
    };

    const showFavicon = (url) => {
        currentFavicon = url;
        if (spinner) spinner.classList.add('hidden');
        if (favicon) {
            favicon.src = url;
            favicon.classList.remove('hidden');
        }
        if (defaultIcon) defaultIcon.classList.add('hidden');
        updateTabUI(`<img src="${url}" class="w-4 h-4 object-contain">`);
    };

    const showDefault = () => {
        if (spinner) spinner.classList.add('hidden');
        if (favicon) favicon.classList.add('hidden');
        if (defaultIcon) defaultIcon.classList.remove('hidden');
        updateTabUI('<i class="ri-global-line"></i>');
    };

    // Handle Title Bar Favicon Error
    if (favicon) {
        favicon.addEventListener('error', () => {
            showDefault();
            currentFavicon = null;
        });
    }

    // Enhanced Title Update Logic
    const updateTitle = () => {
        const title = newWebview.getTitle();
        if (title) {
            const titleEl = document.getElementById('title-' + tabName);
            if (titleEl) {
                titleEl.dataset.title = title;
                // Chỉ cập nhật hiển thị nếu người dùng không đang sửa URL
                if (titleEl.hasAttribute('readonly')) {
                    titleEl.value = title;
                }
            }

            // Update Tab Strip Title
            if (tabEl) {
                const span = tabEl.querySelector('span');
                if (span) span.innerText = title;
            }
        }
    };

    newWebview.addEventListener('page-title-updated', updateTitle);
    newWebview.addEventListener('did-stop-loading', updateTitle);
    newWebview.addEventListener('dom-ready', updateTitle);

    const extractFavicon = async () => {
        try {
            const favicons = await newWebview.executeJavaScript(`
                    Array.from(document.querySelectorAll('link[rel*="icon"]')).map(el => el.href)
                `);
            if (favicons && favicons.length > 0) {
                showFavicon(favicons[0]);
                return favicons[0];
            }
        } catch (e) {
            // Ignore
        }
        return null;
    };

    newWebview.addEventListener('did-start-loading', showSpinner);

    newWebview.addEventListener('did-stop-loading', async () => {
        // Try manual extraction first (for SPAs, history nav, etc.)
        const foundUrl = await extractFavicon();

        // If no favicon found via extraction, but we have a cached one, restore it
        if (!foundUrl && currentFavicon) {
            showFavicon(currentFavicon);
        }
        // If absolutely no favicon, show default. 
        // Only if spinner is still visible (meaning we were trying to load something)
        else if (!foundUrl && spinner && !spinner.classList.contains('hidden')) {
            showDefault();
        }

        // Save History
        saveHistory(newWebview.getTitle(), newWebview.getURL(), currentFavicon);
    });

    const updateUrlData = (currentUrl) => {
        const titleEl = document.getElementById('title-' + tabName);
        if (titleEl) {
            titleEl.dataset.url = currentUrl;
        }
    };

    newWebview.addEventListener('did-navigate', (e) => {
        currentFavicon = null; // Clear on main frame navigation
        updateNavButtons();
        checkIfBookmarked(e.url, tabName);
        updateUrlData(e.url || newWebview.getURL());
    });
    newWebview.addEventListener('did-navigate-in-page', (e) => {
        extractFavicon();
        updateNavButtons();
        // Check bookmark state
        const currentUrl = e.url || newWebview.getURL();
        checkIfBookmarked(currentUrl, tabName);
        updateUrlData(currentUrl);
    });

    // dom-ready is covered by did-stop-loading usually, but let's keep it safe
    newWebview.addEventListener('dom-ready', extractFavicon);

    newWebview.addEventListener('page-favicon-updated', (e) => {
        if (e.favicons && e.favicons.length > 0) {
            showFavicon(e.favicons[0]);
        }
    });

    // Navigation Logic
    const backBtn = document.getElementById(`back-${tabName}`);
    const forwardBtn = document.getElementById(`forward-${tabName}`);
    const reloadBtn = document.getElementById(`reload-${tabName}`);

    backBtn.addEventListener('click', () => {
        if (newWebview.canGoBack()) newWebview.goBack();
    });
    forwardBtn.addEventListener('click', () => {
        if (newWebview.canGoForward()) newWebview.goForward();
    });
    reloadBtn.addEventListener('click', () => {
        if (newWebview.isLoading()) {
            newWebview.stop();
        } else {
            newWebview.reload();
        }
    });

    // Update Navigation State
    const updateNavButtons = () => {
        if (backBtn) {
            backBtn.disabled = !newWebview.canGoBack();
            backBtn.classList.toggle('text-gray-800', newWebview.canGoBack());
            backBtn.classList.toggle('text-gray-400', !newWebview.canGoBack());
        }
        if (forwardBtn) {
            forwardBtn.disabled = !newWebview.canGoForward();
            forwardBtn.classList.toggle('text-gray-800', newWebview.canGoForward());
            forwardBtn.classList.toggle('text-gray-400', !newWebview.canGoForward());
        }
    };

    // Allow Reload to act as Stop when loading (handled in click)
    // But visually updating icon? Maybe later if user asks. Current is just refresh icon.

    // 5. Switch to it (Use timeout to allow DOM to settle)
    setTimeout(() => switchTab(tabName), 50);

    // Manual Favicon Extraction (Already attached above)
}

// Custom Scrollbar for Webviews (Matches OS Style)
const customScrollbarCSS = `
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1); 
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(100, 100, 100, 0.4); 
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 100, 100, 0.7);
    }
`;

document.querySelectorAll('webview').forEach(webview => {
    webview.addEventListener('dom-ready', () => {
        webview.insertCSS(customScrollbarCSS);
    });
});
// History Functions
async function saveHistory(title, url, favicon) {
    if (!url || url === 'about:blank' || url.startsWith('file://')) return;
    try {
        await History.create({
            title: title || url,
            url: url,
            favicon: favicon
        });
        console.log('History saved:', url);
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

// --- BOOKMARK LOGIC ---

function openBookmarkModal(tabName) {
    const modal = document.getElementById('bookmark-modal');
    const newWebview = document.getElementById(`tab-${tabName}`).querySelector('webview');
    if (!newWebview) return;

    document.getElementById('bm-tab-id').value = tabName;
    document.getElementById('bm-title').value = newWebview.getTitle();
    document.getElementById('bm-url').value = newWebview.getURL();

    // Capture Favicon
    const faviconImg = document.getElementById(`favicon-${tabName}`);
    const currentFavicon = (faviconImg && !faviconImg.classList.contains('hidden')) ? faviconImg.src : null;
    document.getElementById('bm-favicon').value = currentFavicon || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Check if already bookmarked to pre-fill/update
    checkIfBookmarked(newWebview.getURL(), tabName);
}

function closeBookmarkModal() {
    const modal = document.getElementById('bookmark-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function checkIfBookmarked(url, tabName) {
    const existing = await Bookmark.findOne({ where: { url } });

    // Update Modal Inputs
    const deleteBtn = document.getElementById('btn-delete-bm');
    if (existing) {
        const titleInput = document.getElementById('bm-title');
        if (titleInput) titleInput.value = existing.title;
        const folderInput = document.getElementById('bm-folder');
        if (folderInput) folderInput.value = existing.folder;
        if (deleteBtn) deleteBtn.classList.remove('hidden');
    } else {
        if (deleteBtn) deleteBtn.classList.add('hidden');
    }

    // Update Button State
    if (tabName) {
        updateBookmarkButtonState(tabName, !!existing);
    }
}

async function saveCurrentBookmark() {
    const tabName = document.getElementById('bm-tab-id').value;
    const title = document.getElementById('bm-title').value;
    const url = document.getElementById('bm-url').value;
    const folder = document.getElementById('bm-folder').value;

    const capturedFavicon = document.getElementById('bm-favicon').value;
    let favicon = capturedFavicon;

    if (!favicon) {
        // High-res fallback
        try {
            favicon = 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=64';
        } catch (e) {
            favicon = '';
        }
    }

    try {
        // Check if exists
        const existing = await Bookmark.findOne({ where: { url } });
        if (existing) {
            await existing.update({ title, folder, favicon });
        } else {
            await Bookmark.create({ title, url, folder, favicon });
        }

        closeBookmarkModal();
        updateBookmarkButtonState(tabName, true);
        if (typeof loadBookmarks === 'function') {
            loadBookmarks(); // Refresh menu if open
        }
    } catch (e) {
        console.error("Failed to save bookmark", e);
    }
}

async function deleteCurrentBookmark() {
    const url = document.getElementById('bm-url').value;
    const tabName = document.getElementById('bm-tab-id').value;

    if (await showConfirm('Delete this bookmark?', 'Delete Bookmark')) {
        try {
            const existing = await Bookmark.findOne({ where: { url } });
            if (existing) {
                await existing.destroy();
            }
            closeBookmarkModal();
            updateBookmarkButtonState(tabName, false);
            if (typeof loadBookmarks === 'function') {
                loadBookmarks();
            }
        } catch (e) {
            console.error("Failed to delete bookmark", e);
        }
    }
}

function updateBookmarkButtonState(tabName, isBookmarked) {
    const btn = document.getElementById(`bookmark-${tabName}`);
    const star = document.getElementById(`star-${tabName}`);
    if (btn && star) {
        if (isBookmarked) {
            star.classList.replace('ri-star-line', 'ri-star-fill');
            star.classList.add('text-yellow-500');
        } else {
            star.classList.replace('ri-star-fill', 'ri-star-line');
            star.classList.remove('text-yellow-500');
        }
    }
}
