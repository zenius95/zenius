const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true, // Chạy Full màn hình Kiosk
        frame: false,     // Bỏ thanh tiêu đề mặc định (để Openbox lo hoặc tự vẽ)
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true, // QUAN TRỌNG: Kích hoạt thẻ <webview>
            contextIsolation: false
        }
    });

    win.loadFile('index.html');

    //win.maximize();
}

// Bắt buộc thêm cờ này để chạy được trên root (Linux)
app.commandLine.appendSwitch('no-sandbox');
// app.commandLine.appendSwitch('disable-gpu-compositing');
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// Enable GPU for WebGL/Video performance in webviews, but we will reduce CSS blur to avoid lag

app.whenReady().then(createWindow);