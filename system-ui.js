const History = require('./database/history');
const Bookmark = require('./database/bookmark');

// -- UI UTILITIES --

function closeAllMenus() {
    const launcher = document.getElementById('launcher-menu');
    const actionCenter = document.getElementById('action-center');
    if (launcher) launcher.classList.add('hidden');
    if (actionCenter) actionCenter.classList.add('hidden');
}

// Global Click Listener to Close Launcher & Action Center
document.addEventListener('click', (e) => {
    const launcher = document.getElementById('launcher-menu');
    const actionCenter = document.getElementById('action-center');
    const startBtn = document.querySelector('.ri-command-fill')?.closest('button'); // Heuristic if ID unknown
    const actionBtn = document.querySelector('.ri-wifi-line')?.closest('div'); // Heuristic for action center trigger

    // Close Launcher
    if (launcher && !launcher.classList.contains('hidden')) {
        if (!launcher.contains(e.target) && (!startBtn || !startBtn.contains(e.target))) {
            launcher.classList.add('hidden');
        }
    }

    // Close Action Center
    if (actionCenter && !actionCenter.classList.contains('hidden')) {
        // Check if click is inside action center or on the trigger
        if (!actionCenter.contains(e.target) && (!actionBtn || !actionBtn.contains(e.target))) {
            actionCenter.classList.add('hidden');
            actionCenter.classList.remove('flex');
        }
    }
});

// -- CUSTOM ALERTS / CONFIRMS --

function triggerCustomModal(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const panel = document.getElementById('custom-modal-panel');
        const titleEl = document.getElementById('custom-modal-title');
        const messageEl = document.getElementById('custom-modal-message');
        const cancelBtn = document.getElementById('custom-modal-cancel');
        const confirmBtn = document.getElementById('custom-modal-confirm');

        if (!modal || !panel) {
            // Fallback if modal not present
            if (isConfirm) {
                resolve(confirm(message));
            } else {
                alert(message);
                resolve(true);
            }
            return;
        }

        titleEl.innerText = title;
        messageEl.innerText = message;

        // Setup Buttons
        if (isConfirm) {
            cancelBtn.classList.remove('hidden');
            confirmBtn.innerText = 'Confirm'; // Or custom text
        } else {
            cancelBtn.classList.add('hidden');
            confirmBtn.innerText = 'OK';
        }

        // Show Modal
        modal.classList.remove('hidden');
        // Trigger reflow for transition
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        panel.classList.remove('scale-95', 'opacity-0');

        const cleanup = () => {
            modal.classList.add('opacity-0');
            panel.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 200);
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        confirmBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

window.showConfirm = async (message, title = 'Confirmation') => {
    return await triggerCustomModal(title, message, true);
};

window.showAlert = async (message, title = 'Notification') => {
    return await triggerCustomModal(title, message, false);
};


// -- CLOCK --

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    // Update Start Page Clock
    const startClock = document.getElementById('clock-time');
    const startDate = document.getElementById('clock-date');
    if (startClock) startClock.innerText = timeString;
    if (startDate) startDate.innerText = dateString;

    // Update Taskbar Clock
    const taskbarClock = document.getElementById('taskbar-clock');
    if (taskbarClock) taskbarClock.innerText = timeString;
}

// -- LAUNCHER --

function toggleLauncher(event) {
    if (event) event.stopPropagation();
    const launcher = document.getElementById('launcher-menu');
    const actionCenter = document.getElementById('action-center');

    if (actionCenter) {
        actionCenter.classList.add('hidden');
        actionCenter.classList.remove('flex');
    }

    if (launcher) {
        launcher.classList.toggle('hidden');
        launcher.classList.toggle('flex');
    }
}

function switchLauncherTab(tabName) {
    // Hide all contents
    document.querySelectorAll('.launcher-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });
    // Show target content
    const content = document.getElementById('launcher-content-' + tabName);
    if (content) {
        content.classList.remove('hidden');
        content.classList.add('flex');
    }

    // Update sidebar buttons
    document.querySelectorAll('.launcher-tab').forEach(el => {
        el.classList.remove('active', 'bg-white/10', 'text-white');
        el.classList.add('text-white/70');
        if (el.getAttribute('onclick').includes(tabName)) {
            el.classList.add('active', 'bg-white/10', 'text-white');
            el.classList.remove('text-white/70');
        }
    });

    // Load History if tab is history
    if (tabName === 'history') {
        loadHistory();
    }
}

// -- ACTION CENTER --

function toggleActionCenter(event) {
    const ac = document.getElementById('action-center');
    const launcher = document.getElementById('launcher-menu');

    if (launcher) launcher.classList.add('hidden');

    if (ac) {
        ac.classList.toggle('hidden');
        ac.classList.toggle('flex');
    }
    if (event) event.stopPropagation();
}

// Sliders Logic
function setupSliders() {
    const sliders = document.querySelectorAll('.action-slider');
    sliders.forEach(slider => {
        // Input event for value update
        slider.addEventListener('input', function () {
            this.style.setProperty('--value', this.value + '%');
        });

        // Wheel event for scrolling
        slider.addEventListener('wheel', function (event) {
            event.preventDefault();
            const delta = event.deltaY < 0 ? 5 : -5;
            let newValue = parseInt(this.value) + delta;
            newValue = Math.min(100, Math.max(0, newValue));
            this.value = newValue;
            this.style.setProperty('--value', this.value + '%');
        });
    });
}

// -- DATA LOADING (History & Bookmarks) --

async function loadHistory() {
    const listContainer = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty');
    if (!listContainer) return;

    // Clear current list
    listContainer.innerHTML = '';

    try {
        const items = await History.findAll({
            order: [['timestamp', 'DESC']],
            limit: 100
        });

        if (items.length === 0) {
            if (emptyState) {
                listContainer.appendChild(emptyState);
                emptyState.classList.remove('hidden');
                emptyState.classList.add('flex');
            }
        } else {
            let lastLabel = '';

            const getDateLabel = (date) => {
                const d = new Date(date);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const dateStr = `${day}/${month}`;

                const now = new Date();
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                if (d.toDateString() === now.toDateString()) return `Today - ${dateStr}`;
                if (d.toDateString() === yesterday.toDateString()) return `Yesterday - ${dateStr}`;

                return d.toLocaleDateString([], { weekday: 'long' }) + `, ${dateStr}`;
            };

            items.forEach(item => {
                const currentLabel = getDateLabel(item.timestamp);

                if (currentLabel !== lastLabel) {
                    const header = document.createElement('div');
                    header.className = 'text-xs font-bold text-white/40 uppercase tracking-wider mt-6 mb-2 pl-2';
                    header.innerText = currentLabel;
                    listContainer.appendChild(header);
                    lastLabel = currentLabel;
                }

                const div = document.createElement('div');
                div.className = 'group w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-all active:scale-[0.98]';
                // Note: createWebTab is in renderer.js but this function needs to call it.
                // Since this is a script file, it assumes createWebTab is available globally.
                div.onclick = () => {
                    if (window.createWebTab) {
                        window.createWebTab(item.url);
                    } else {
                        console.error('createWebTab not found');
                    }
                };

                let iconHtml = '<i class="ri-global-line"></i>';
                if (item.favicon) {
                    iconHtml = `<img src="${item.favicon}" class="w-full h-full object-contain">`;
                }

                const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                div.innerHTML = `
                    <div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white text-lg shadow-sm overflow-hidden shrink-0">
                        ${iconHtml}
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden min-w-0 w-0">
                        <span class="text-xs text-white/90 font-medium truncate group-hover:text-blue-400 transition-colors">${item.title || 'Untitled'}</span>
                        <span class="text-[10px] text-white/50 truncate">${item.url}</span>
                    </div>
                    <span class="text-[10px] text-white/30 group-hover:text-white/70 transition-colors whitespace-nowrap">${time}</span>
                `;
                listContainer.appendChild(div);
            });
        }

    } catch (error) {
        console.error("Failed to load history", error);
    }
}

async function clearHistory() {
    if (await showConfirm('Are you sure you want to clear all history?', 'Clear History')) {
        try {
            await History.destroy({ where: {}, truncate: true });
            loadHistory();
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    }
}

async function loadBookmarks() {
    const listContainer = document.getElementById('launcher-content-bookmarks')?.querySelector('.custom-scrollbar');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    try {
        const bookmarks = await Bookmark.findAll({ order: [['folder', 'ASC'], ['createdAt', 'DESC']] });

        if (bookmarks.length === 0) {
            listContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 opacity-50">
                    <i class="ri-star-line text-6xl mb-4"></i>
                    <p>No bookmarks saved</p>
                </div>
                `;
        } else {
            const groups = {};
            bookmarks.forEach(bm => {
                if (!groups[bm.folder]) groups[bm.folder] = [];
                groups[bm.folder].push(bm);
            });

            for (const [folder, items] of Object.entries(groups)) {
                const folderDiv = document.createElement('div');
                folderDiv.className = 'mb-4';
                folderDiv.innerHTML = `<div class="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 pl-2">${folder}</div>`;

                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'group w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-all active:scale-[0.98]';
                    itemDiv.onclick = () => {
                        if (window.createWebTab) {
                            window.createWebTab(item.url);
                        }
                    };

                    let iconHtml = '<i class="ri-global-line"></i>';
                    if (item.favicon && !item.favicon.startsWith('http')) {
                        // Default icon logic
                    } else if (item.favicon) {
                        iconHtml = `<img src="${item.favicon}" class="w-full h-full object-contain">`;
                    }

                    itemDiv.innerHTML = `
                        <div class="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-white text-lg shadow-sm overflow-hidden shrink-0">
                            ${iconHtml}
                        </div>
                        <div class="flex flex-col flex-1 overflow-hidden min-w-0 w-0">
                            <span class="text-xs text-white/90 font-medium truncate group-hover:text-blue-400 transition-colors">${item.title}</span>
                            <span class="text-[10px] text-white/50 truncate">${item.url}</span>
                        </div>
                        `;
                    folderDiv.appendChild(itemDiv);
                });
                listContainer.appendChild(folderDiv);
            }
        }
    } catch (e) {
        console.error("Failed to load bookmarks", e);
    }
}


// Initialization
window.addEventListener('DOMContentLoaded', () => {
    setInterval(updateClock, 1000);
    updateClock();
    setupSliders();

    // Initial Data Load
    loadHistory();
    loadBookmarks();
});
