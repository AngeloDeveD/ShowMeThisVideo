// electron/ipcHandlers.js
const { ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

function setupIpcHandlers() {
    // Обработчик выполнения команды
    ipcMain.handle('execute-command', async (event, file, filePath, region, merged) => {
        try {
            const fileName = file.name.toString().slice(0, -4);

            const decExePath = path.join(__dirname, '../tools/crid/crid_mod.exe');
            const convExePath = path.join(__dirname, '../tools/ffmpeg/bin/ffmpeg.exe');
            const resultDir = path.join(__dirname, '../result');
            const resultFile = path.join(resultDir, fileName);
            const resultAudio = path.join(resultDir, `${fileName}.adx${merged ? '.wav' : ''}`);
            const resultVideo = path.join(resultDir, `${fileName}.m2v`);
            const mp4ResultFile = path.join(resultDir, `${fileName}.mp4`);

            console.log('Executing command with:');
            console.log('Decoder EXE path:', decExePath);
            console.log('Converter EXE path:', convExePath);
            console.log('File path:', filePath);
            console.log('Region:', region);
            console.log('Merge Video with Audio', merged);
            console.log(`File name: ${fileName}`);

            // Проверяем существование исполняемого файла
            if (!fs.existsSync(decExePath)) {
                throw new Error(`Исполняемый файл не найден: ${decExePath}`);
            }

            // Проверяем существование входного файла
            if (!fs.existsSync(filePath)) {
                throw new Error(`Входной файл не найден: ${filePath}`);
            }

            // Создаем папку result если ее нет
            await fsPromises.mkdir(resultDir, { recursive: true });

            console.log('Оба файла существуют, запускаем процесс...');

            const hexParams = getHexParamsForRegion(region);

            if (hexParams.length < 2) {
                throw new Error(`Недостаточно HEX параметров для региона ${region}. Нужно 2, получено ${hexParams.length}`);
            }

            const firstHex = hexParams[0];
            const secondHex = hexParams[1];

            let resultMessage = '';
            let success = false;

            console.log('File:', file);

            // ВЫПОЛНЯЕМ КОМАНДУ С РАЗНЫМИ ЗНАЧЕНИЯМИ ПАРАМЕТРА -s
            const sValues = [-1, 0, 1];

            for (const sValue of sValues) {
                console.log(`\n=== Попытка с параметром -s ${sValue} ===`);

                try {
                    const first_commandArgs = [
                        '-b', firstHex,
                        '-a', secondHex,
                        '-v', '-x', '-i', '-s', sValue.toString(),
                        ...(merged ? ['-c'] : []), filePath,
                        '-o', resultFile,
                    ];

                    console.log(`Command: ${decExePath} ${first_commandArgs.join(' ')}`);

                    // ЗАПУСКАЕМ CRID_MOD.EXE С ТЕКУЩИМ ЗНАЧЕНИЕМ -s
                    await new Promise((resolve, reject) => {
                        const first_process = spawn(decExePath, first_commandArgs, {
                            cwd: resultDir
                        });

                        let output = '';
                        let errorOutput = '';

                        first_process.stdout.on('data', (data) => {
                            output += data.toString();
                            console.log('crid stdout:', data.toString());
                        });

                        first_process.stderr.on('data', (data) => {
                            errorOutput += data.toString();
                            console.log('crid stderr:', data.toString());
                        });

                        first_process.on('close', (code) => {
                            console.log(`crid процесс завершен с кодом: ${code} (параметр -s ${sValue})`);
                            if (code === 0) {
                                resultMessage += `✅ Декодирование успешно с параметром -s ${sValue}\n`;
                                resolve(output);
                            } else {
                                reject(new Error(`❌ crid процесс завершился с кодом ${code} (параметр -s ${sValue})\n${errorOutput}`));
                            }
                        });

                        first_process.on('error', (error) => {
                            console.error('Ошибка crid процесса:', error);
                            reject(new Error(`Ошибка запуска crid процесса (параметр -s ${sValue}): ${error.message}`));
                        });
                    });

                    // ПРОВЕРЯЕМ ЧТО ФАЙЛЫ СОЗДАЛИСЬ
                    console.log(`Проверяем создание файлов для параметра -s ${sValue}...`);

                    try {
                        await waitForFile(resultVideo);
                        await waitForFile(resultAudio);

                        // Если файлы создались успешно, выходим из цикла
                        console.log(`✅ Успех! Файлы созданы с параметром -s ${sValue}`);
                        success = true;
                        resultMessage += `✅ Использован параметр: -s ${sValue}\n`;
                        break; // ВЫХОДИМ ИЗ ЦИКЛА ПРИ УСПЕХЕ

                    } catch (fileError) {
                        console.log(`❌ Файлы не созданы с параметром -s ${sValue}, пробуем следующее значение...`);
                        resultMessage += `❌ Параметр -s ${sValue} не сработал\n`;

                        // ОЧИЩАЕМ НЕПОЛНЫЕ ФАЙЛЫ ПЕРЕД СЛЕДУЮЩЕЙ ПОПЫТКОЙ
                        await cleanupFiles(resultVideo, resultAudio);
                    }

                } catch (processError) {
                    console.log(`❌ Ошибка процесса с параметром -s ${sValue}:`, processError.message);
                    resultMessage += `❌ Ошибка с параметром -s ${sValue}: ${processError.message}\n`;

                    // ОЧИЩАЕМ НЕПОЛНЫЕ ФАЙЛЫ ПЕРЕД СЛЕДУЮЩЕЙ ПОПЫТКОЙ
                    await cleanupFiles(resultVideo, resultAudio);

                    // Продолжаем со следующим значением
                    continue;
                }
            }

            // ПРОВЕРЯЕМ УСПЕШНОСТЬ ВЫПОЛНЕНИЯ
            if (!success) {
                throw new Error(`Все попытки декодирования не удались. Проверьте ключи для региона ${region}\n${resultMessage}`);
            }

            // ШАГ 2: Если нужно объединить, запускаем FFmpeg
            if (merged) {
                console.log('\n=== Запуск FFmpeg для объединения ===');

                const second_commandArgs = [
                    '-i', resultVideo,
                    '-i', resultAudio,
                    '-c', 'copy', '-y',
                    mp4ResultFile
                ];

                console.log(`FFmpeg command: ${convExePath} ${second_commandArgs.join(' ')}`);

                // ЗАПУСКАЕМ FFMPEG
                await new Promise((resolve, reject) => {
                    const second_process = spawn(convExePath, second_commandArgs, {
                        cwd: resultDir
                    });

                    let output = '';
                    let errorOutput = '';

                    second_process.stdout.on('data', (data) => {
                        output += data.toString();
                        console.log('ffmpeg stdout:', data.toString());
                    });

                    second_process.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                        console.log('ffmpeg stderr:', data.toString());
                    });

                    second_process.on('close', (code) => {
                        console.log('ffmpeg процесс завершен с кодом:', code);
                        if (code === 0) {
                            resultMessage += `✅ Видео успешно объединено: ${mp4ResultFile}\n`;
                            resolve(output);
                        } else {
                            reject(new Error(`❌ ffmpeg процесс завершился с кодом ${code}\n${errorOutput}`));
                        }
                    });

                    second_process.on('error', (error) => {
                        console.error('Ошибка ffmpeg процесса:', error);
                        reject(new Error(`Ошибка запуска ffmpeg процесса: ${error.message}`));
                    });
                });

                // ПРОВЕРЯЕМ ЧТО MP4 ФАЙЛ СОЗДАЛСЯ
                await waitForFile(mp4ResultFile);

                // ОЧИЩАЕМ ВРЕМЕННЫЕ ФАЙЛЫ ПОСЛЕ УСПЕШНОГО ОБЪЕДИНЕНИЯ
                await cleanupFiles(resultVideo, resultAudio);
            }

            // Открываем папку с результатами
            console.log(`Открываем папку: ${resultDir}`);
            await shell.openPath(resultDir);

            return resultMessage;

        } catch (error) {
            console.error('Общая ошибка:', error);
            throw error;
        }
    });

    // ФУНКЦИЯ ДЛЯ ОЖИДАНИЯ СОЗДАНИЯ ФАЙЛА
    async function waitForFile(filePath, maxAttempts = 10, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await fsPromises.access(filePath);
                const stats = await fsPromises.stat(filePath);
                if (stats.size > 0) {
                    console.log(`✅ Файл создан: ${path.basename(filePath)} (${stats.size} байт)`);
                    return true;
                } else {
                    console.log(`⚠️ Файл существует но пуст: ${path.basename(filePath)}`);
                }
            } catch (error) {
                console.log(`⏳ Попытка ${attempt}/${maxAttempts}: ${path.basename(filePath)} не найден`);
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error(`Файл ${path.basename(filePath)} не создан после ${maxAttempts} попыток`);
    }

    // ФУНКЦИЯ ДЛЯ ОЧИСТКИ ФАЙЛОВ
    async function cleanupFiles(...filePaths) {
        for (const filePath of filePaths) {
            try {
                await fsPromises.unlink(filePath);
                console.log(`🧹 Очищен файл: ${path.basename(filePath)}`);
            } catch (error) {
                // Игнорируем ошибки если файл не существует
                if (error.code !== 'ENOENT') {
                    console.log(`⚠️ Не удалось очистить файл ${path.basename(filePath)}: ${error.message}`);
                }
            }
        }
    }

    // Функция для получения HEX параметров из JSON
    function getHexParamsForRegion(region) {
        try {
            const jsonPath = path.join(__dirname, '../tools/keys/video_keys.json');

            if (!fs.existsSync(jsonPath)) {
                throw new Error(`JSON файл не найден: ${jsonPath}`);
            }

            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            if (!jsonData[region]) {
                throw new Error(`Регион '${region}' не найден в JSON файле`);
            }

            const hexParams = jsonData[region].HEX;
            console.log('HEX параметры:', hexParams);

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
            return result.filePaths[0];
        }
        return null;
    });

    // Обработчик получения информации о файле
    ipcMain.handle('get-file-info', async (event, fileData) => {
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