// electron/ipcHandlers.js
const { ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function setupIpcHandlers() {
    // Обработчик выполнения команды
    ipcMain.handle('execute-command', async (event, filePath, region) => {
        return new Promise((resolve, reject) => {
            try {
                const exePath = path.join(__dirname, '../tools/crid/crid_mod.exe');

                console.log('Executing command with:');
                console.log('EXE path:', exePath);
                console.log('File path:', filePath);
                console.log('Region:', region);

                // Проверяем существование исполняемого файла
                if (!fs.existsSync(exePath)) {
                    reject(new Error(`Исполняемый файл не найден: ${exePath}`));
                    return;
                }

                // Проверяем существование входного файла
                if (!fs.existsSync(filePath)) {
                    reject(new Error(`Входной файл не найден: ${filePath}`));
                    return;
                }

                console.log('Оба файла существуют, запускаем процесс...');

                const hexParams = getHexParamsForRegion(region);

                if (hexParams.length < 2) {
                    reject(new Error(`Недостаточно HEX параметров для региона ${region}. Нужно 2, получено ${hexParams.length}`));
                    return;
                }

                const firstHex = hexParams[0];  // Первое значение массива HEX
                const secondHex = hexParams[1]; // Второе значение массива HEX

                console.log(firstHex, secondHex);

                const commandArgs = [
                    '-b', firstHex,
                    '-a', secondHex,
                    '-v', '-x', '-i', '-s', '-1', '-c',
                    filePath
                ];

                const process = spawn(exePath, commandArgs, {
                    cwd: path.dirname(exePath)
                });

                let output = '';
                let errorOutput = '';

                process.stdout.on('data', (data) => {
                    output += data.toString();
                    console.log('stdout:', data.toString());
                });

                process.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                    console.log('stderr:', data.toString());
                });

                process.on('close', (code) => {
                    console.log('Процесс завершен с кодом:', code);
                    if (code === 0) {
                        // Открываем папку с исходным файлом
                        const fileDir = path.dirname(filePath);
                        shell.openPath(fileDir).then(() => {
                            console.log(`Папка открыта: ${fileDir}`);
                        }).catch(err => {
                            console.error('Ошибка открытия папки:', err);
                        });
                        const resultMessage = `✅ Команда выполнена успешно для региона ${region}\nПараметры: -b ${firstHex} -a ${secondHex}\nКод завершения: ${code}\n${output}`;
                        resolve(resultMessage);
                    } else {
                        // Если код завершения не 0 - ошибка
                        reject(new Error(`❌ Процесс завершился с кодом ${code}\n${errorOutput}`));
                    }
                });

                process.on('error', (error) => {
                    console.error('Ошибка процесса:', error);
                    reject(new Error(`Ошибка запуска процесса: ${error.message}`));
                });

            } catch (error) {
                console.error('Общая ошибка:', error);
                reject(error);
            }
        });
    });

    ipcMain.handle('get-hex-params', async (event, region) => {
        try {
            const hexParams = getHexParamsForRegion(region);
            return hexParams;
        } catch (error) {
            throw new Error(`Ошибка получения HEX параметров для региона ${region}: ${error.message}`);
        }
    });

    // Функция для получения HEX параметров из JSON
    function getHexParamsForRegion(region) {
        try {
            // Путь к JSON файлу
            const jsonPath = path.join(__dirname, '../src/keys/video_keys.json');

            if (!fs.existsSync(jsonPath)) {
                throw new Error(`JSON файл не найден: ${jsonPath}`);
            }

            // Читаем и парсим JSON файл
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // Проверяем существование региона
            if (!jsonData[region]) {
                throw new Error(`Регион '${region}' не найден в JSON файле`);
            }

            // Получаем HEX параметры
            const hexParams = jsonData[region].HEX;
            console.log(hexParams);

            if (!hexParams || !Array.isArray(hexParams)) {
                throw new Error(`HEX параметры для региона '${region}' не найдены или имеют неверный формат`);
            }

            return hexParams;
        } catch (error) {
            throw error;
        }
    }

    // Обработчик выбора файла через диалог
    ipcMain.handle('select-file', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'USM Files', extensions: ['usm', 'USM'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0]; // Абсолютный путь
        }
        return null;
    });

    // Обработчик получения информации о файле
    ipcMain.handle('get-file-info', async (event, fileData) => {
        // Если файл передан через drag&drop, получаем абсолютный путь
        if (fileData && fileData.path) {
            return {
                name: fileData.name,
                path: fileData.path,
                size: fileData.size
            };
        }
        return null;
    });
}

module.exports = { setupIpcHandlers };