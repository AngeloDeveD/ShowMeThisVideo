const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipcHandlers');
const fs = require('fs');
//const { mainModule } = require('process');
const { pathToFileURL } = require('url');
const isDev = !app.isPackaged;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Show Me This Video",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
            sandbox: false,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
        mainWindow.webContents.openDevTools();
    } else {
        // ВАРИАНТ 1 (каноничный): путь внутри app.asar относительно __dirname
        const fromAsar = path.resolve(__dirname, '..', 'dist', 'index.html');

        // ВАРИАНТ 2 (альтернативный): путь через process.resourcesPath + app.asar
        const fromResources = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');

        // Выбираем существующий
        const indexHtml = fs.existsSync(fromAsar) ? fromAsar : fromResources;

        // Логи — чтобы увидеть, что именно мы грузим
        console.log('[BOOT] __dirname =', __dirname);
        console.log('[BOOT] try indexHtml =', indexHtml, 'exists =', fs.existsSync(indexHtml));

        // Грузим ИМЕННО ФАЙЛ, а не папку
        mainWindow.loadFile(indexHtml);
    }

    // // Логи консоли рендера:
    // mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    //     console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`)
    // })

    // // Краш процесса рендера:
    // mainWindow.webContents.on('render-process-gone', (_e, details) => {
    //     console.error('[renderer gone]', details)
    // })

    // // На время отладки — открыть DevTools в проде:
    // mainWindow.webContents.openDevTools({ mode: 'detach' })

    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
        console.error('did-fail-load', code, desc, url);
    });

    mainWindow.setMenuBarVisibility(false);
    //mainWindow.setMenu(null); -> MacOS
}
app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});