const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Load biến môi trường theo nền tảng
const envFile = process.platform === 'linux' ? '.env.linux' : '.env.windows';
require('dotenv').config({ path: path.join(__dirname, envFile) });

// Chỉ Linux mới dùng USER_DATA_DIR tùy chỉnh
if (process.platform === 'linux' && process.env.USER_DATA_DIR) {
    app.setPath('userData', process.env.USER_DATA_DIR);
    console.log(`[ENV] userData path set to: ${process.env.USER_DATA_DIR}`);
}

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