// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { opendir } = require('original-fs');

contextBridge.exposeInMainWorld('electronAPI', {
    executeCommand: (file, filePath, region, merged, personaChoose, openFolder) => ipcRenderer.invoke('execute-command', file, filePath, region, merged, personaChoose, openFolder),

    // Новый метод для диалога выбора файла
    selectFile: () => ipcRenderer.invoke('select-file'),

    // Метод для получения информации о файле
    getFileInfo: (file) => ipcRenderer.invoke('get-file-info', file),

    getHexParams: (region) => ipcRenderer.invoke('get-hex-params', region),

    openResultDir: () => ipcRenderer.invoke('open-result-dir'),

    openExternal: (url) => ipcRenderer.invoke('open-url-browser', url),

    onProgress: (cb) => {
        const handler = (_e, data) => cb?.(data);
        ipcRenderer.on('task-progress', handler);
        // вернуть функцию отписки — красиво и безопасно
        return () => ipcRenderer.removeListener('task-progress', handler);
    },

    platform: process.platform,
    versions: process.versions,
});