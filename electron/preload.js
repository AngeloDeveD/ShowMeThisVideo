// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    executeCommand: (filePath, region) => ipcRenderer.invoke('execute-command', filePath, region),

    // Новый метод для диалога выбора файла
    selectFile: () => ipcRenderer.invoke('select-file'),

    // Метод для получения информации о файле
    getFileInfo: (file) => ipcRenderer.invoke('get-file-info', file),

    getHexParams: (region) => ipcRenderer.invoke('get-hex-params', region),


    platform: process.platform,
    versions: process.versions,
});