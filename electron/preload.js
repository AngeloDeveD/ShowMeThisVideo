const { contextBridge } = require('electron');

// Экспонируйте безопасные API для React приложения
contextBridge.exposeInMainWorld('electronAPI', {
    // Здесь вы можете добавить функции для взаимодействия с Electron
    platform: process.platform,
    versions: process.versions,
});