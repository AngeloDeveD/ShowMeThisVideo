// electron/ipcHandlers.js
const { ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

function setupIpcHandlers() {
    // Обработчик выполнения команды
    ipcMain.handle('execute-command', async (event, file, filePath, region, merged, personaChoose, openFolder) => {
        // helper: отправка прогресса
        const sendProgress = (percent, message) => {
            try { event.sender.send('task-progress', { percent, message }); } catch { }
        };
        try {
            const fileName = file.name.toString().replace(/\.[^.]+$/, ''); // USMXXX
            const tooldir = path.join(__dirname, '../tools');
            const resultDir = path.join(__dirname, '../result');

            const decExePath = path.join(tooldir, './crid/crid_mod.exe');                 // видео из .usm
            const convExePath = path.join(tooldir, './ffmpeg/bin/ffmpeg.exe');             // ffmpeg
            const usmAudioCli = path.join(tooldir, './UsmAudioCli/UsmAudioCli.exe');       // .hca из .usm
            const hca2wav = path.join(tooldir, './deretore-toolkit/hca2wav.exe');      // .hca -> .wav

            const resultFile = path.join(resultDir, fileName);           // базовый префикс для crid_mod
            const resultVideo = path.join(resultDir, `${fileName}.m2v`);  // видео от crid_mod

            // HCA цели после переименования (расширение сохраняем .hca)
            const euHca = path.join(resultDir, `${fileName}_EU.hca`);
            const jpHca = path.join(resultDir, `${fileName}_JP.hca`);
            // WAV, которые мы хотим получить (в идеале hca2wav делает именно так)
            const euWavWanted = path.join(resultDir, `${fileName}_EU.wav`);
            const jpWavWanted = path.join(resultDir, `${fileName}_JP.wav`);

            const euMp4 = path.join(resultDir, `${fileName}_EU.mp4`);
            const jpMp4 = path.join(resultDir, `${fileName}_JP.mp4`);

            const isP5R = personaChoose === 'P5R';

            let logMsg = '';

            const deleteIfExists = async (p) => {
                try { await fsPromises.unlink(p); console.log('Удалён:', path.basename(p)); }
                catch (e) { if (e.code !== 'ENOENT') console.warn('Не удалось удалить', p, e.message); }
            };

            sendProgress(2, 'Подготовка...');
            // --- проверки
            if (!fs.existsSync(decExePath)) throw new Error(`Не найден crid_mod: ${decExePath}`);
            if (!fs.existsSync(filePath)) throw new Error(`Входной файл не найден: ${filePath}`);
            await fsPromises.mkdir(resultDir, { recursive: true });

            console.log('Executing command with:');
            console.log('Decoder EXE path:', decExePath);
            console.log('Converter EXE path:', convExePath);
            console.log('File path:', filePath);
            console.log('Region:', region);
            console.log('Merge Video with Audio', merged);
            console.log(`File name: ${fileName}`);
            console.log(`Choosed game: ${personaChoose}`);
            console.log(`Is P5R? : ${isP5R}`);

            // --- 1) P5R: ВИДЕО -> crid_mod (только .m2v)
            let videoOk = false;
            const [hexA, hexB] = getHexParamsForRegion(region);
            if (personaChoose === "P5R") {
                const cridArgs = ['-b', hexA, '-a', hexB, '-v', filePath, '-o', resultFile];
                console.log(`Command: ${decExePath} ${cridArgs.join(' ')}`);
                sendProgress(8, 'Декодируем видео...');
                try {
                    await new Promise((resolve, reject) => {
                        const p = spawn(decExePath, cridArgs, { cwd: resultDir });
                        let out = '', err = '';
                        p.stdout.on('data', d => { out += d.toString(); console.log('crid stdout:', d.toString()); });
                        p.stderr.on('data', d => { err += d.toString(); console.log('crid stderr:', d.toString()); });
                        p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`crid_mod код ${code}\n${err || out}`)));
                        p.on('error', e => reject(new Error(`Ошибка запуска crid_mod: ${e.message}`)));
                    });

                    await waitForFile(resultVideo);
                    console.log(`Файл создан: ${path.basename(resultVideo)}`);
                    logMsg += 'Видео успешно декодировано\n';
                    videoOk = true;
                } catch (e) {
                    await cleanupFiles(resultVideo);
                    throw e;
                }
                sendProgress(25, 'Видео готово');
            }


            // --- 1) Другие части Persona: Аудио и видео UsmAudioCli -> получаем 1-2 .hca и 1 .m2v, затем переименовываем в USMXXX_EU/JP(.hca/.m2v)
            // --- 2) АУДИО: UsmAudioCli -> получаем 1-2 .hca, затем переименовываем в USMXXX_EU/JP.hca
            if (fs.existsSync(usmAudioCli)) {

                const audioArgs = [
                    filePath,
                    '--out', resultDir,
                    '--audio', !isP5R ? '--video' : '',
                    '--split'
                ]

                console.log(`UsmAudioCli: ${usmAudioCli} ${audioArgs.join(' ')}`);

                sendProgress(28, 'Извлекаем аудио...');
                await new Promise((resolve, reject) => {
                    const p = spawn(usmAudioCli, audioArgs, { cwd: resultDir });
                    let out = '', err = '';
                    p.stdout.on('data', d => { out += d.toString(); console.log('UsmAudioCli stdout:', d.toString()); });
                    p.stderr.on('data', d => { err += d.toString(); console.log('UsmAudioCli stderr:', d.toString()); });
                    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`UsmAudioCli код ${code}\n${err || out}`)));
                    p.on('error', e => reject(new Error(`Ошибка запуска UsmAudioCli: ${e.message}`)));
                });

                sendProgress(32, 'Определяем дорожки EU/JP...');
                // Переименовываем .hca (оставляем .hca)
                const entries = await fsPromises.readdir(resultDir, { withFileTypes: true });
                const hcaFiles = entries
                    .filter(e => e.isFile())
                    .map(e => e.name)
                    .filter(n => n.toLowerCase().endsWith('.hca'));

                let renamed = 0;
                for (const name of hcaFiles) {
                    // MOV004_40534641.hca — берём вторую цифру после "_"
                    const m = /^(.+?)_(\d{2,})\.hca$/i.exec(name);
                    if (!m) continue;
                    const digits = m[2];
                    const secondChar = digits.charAt(1); // '0' | '1'
                    let tag = null;
                    if (secondChar === '0') tag = 'EU';
                    else if (secondChar === '1') tag = 'JP';
                    if (!tag) continue;

                    const oldPath = path.join(resultDir, name);
                    const newPath = path.join(resultDir, `${fileName}_${tag}.hca`);
                    if (fs.existsSync(newPath)) await fsPromises.unlink(newPath);
                    await fsPromises.rename(oldPath, newPath);
                    console.log(`Переименован: ${name} -> ${path.basename(newPath)}`);
                    renamed++;
                }
                logMsg += `Переименовано .hca: ${renamed}\n`;

                if (!isP5R) {
                    sendProgress(34, 'Приводим имя видео к базовому...');

                    const entries = await fsPromises.readdir(resultDir, { withFileTypes: true });
                    const m2vFiles = entries
                        .filter(e => e.isFile())
                        .map(e => e.name)
                        .filter(n => n.toLowerCase().endsWith('.m2v'));

                    // Цель: fileName.m2v
                    const targetName = `${fileName}.m2v`;
                    const targetPath = path.join(resultDir, targetName);

                    if (!fs.existsSync(targetPath)) {
                        const candidate =
                            m2vFiles.find(n => n.startsWith(`${fileName}_`)) || // предпочитаем совпадение по префиксу
                            m2vFiles.find(n => n.toLowerCase() === targetName.toLowerCase()) ||
                            m2vFiles[0];

                        if (candidate && candidate !== targetName) {
                            await fsPromises.rename(path.join(resultDir, candidate), targetPath);
                            console.log(`Переименован: ${candidate} -> ${targetName}`);
                            logMsg += `Видео переименовано: ${candidate} -> ${targetName}\n`;
                        }
                    }
                }
            } else {
                console.warn(`UsmAudioCli не найден: ${usmAudioCli} — извлечение аудио пропущено`);
            }

            // --- 3) .hca → .wav: hca2wav -b hexA -a hexB <HCA>
            // функция возвращает фактический путь к WAV, который появился
            async function hcaToWav(hcaPath, wantedWavPath, label) {
                if (isP5R) {
                    if (!fs.existsSync(hcaPath)) return null;
                    if (!fs.existsSync(hca2wav)) throw new Error(`Не найден hca2wav: ${hca2wav}`);

                    sendProgress(label === 'EU' ? 50 : 60, `Расшифровываем ${label} аудио...`);
                    const args = ['-b', hexA, '-a', hexB, hcaPath];
                    console.log(`hca2wav: ${hca2wav} ${args.join(' ')}`);

                    // время запуска — чтобы потом найти «свежий» WAV, если имя отличается
                    const startTs = Date.now();

                    await new Promise((resolve, reject) => {
                        const p = spawn(hca2wav, args, { cwd: resultDir });
                        let out = '', err = '';
                        p.stdout.on('data', d => { out += d.toString(); console.log('hca2wav stdout:', d.toString()); });
                        p.stderr.on('data', d => { err += d.toString(); console.log('hca2wav stderr:', d.toString()); });
                        p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`hca2wav код ${code}\n${err || out}`)));
                        p.on('error', e => reject(new Error(`Ошибка запуска hca2wav: ${e.message}`)));
                    });

                    // 1) ожидаем «хотелку»
                    try {
                        await waitForFile(wantedWavPath, 5, 400);
                        return wantedWavPath;
                    } catch { }

                    // 2) часто тулза пишет рядом с .hca, просто заменяя расширение
                    const expectedByReplace = hcaPath.replace(/\.hca$/i, '.wav');
                    if (fs.existsSync(expectedByReplace)) {
                        return expectedByReplace;
                    }

                    // 3) иной тулзы добавляют ".wav" к исходному имени
                    const expectedByAppend = `${hcaPath}.wav`;
                    if (fs.existsSync(expectedByAppend)) {
                        return expectedByAppend;
                    }

                    // 4) как последний шанс — возьмём самый свежий .wav в resultDir после старта
                    const files = await fsPromises.readdir(resultDir);
                    let latest = null; let latestMtime = 0;
                    for (const n of files.filter(n => n.toLowerCase().endsWith('.wav'))) {
                        const p = path.join(resultDir, n);
                        const st = await fsPromises.stat(p);
                        if (st.mtimeMs >= startTs && st.size > 0 && st.mtimeMs > latestMtime) {
                            latest = p; latestMtime = st.mtimeMs;
                        }
                    }
                    if (latest) return latest;

                    throw new Error(`WAV не найден после hca2wav для ${path.basename(hcaPath)}`);
                }

                else {
                    if (!fs.existsSync(hcaPath)) {
                        console.warn(`HCA для ${label} не найден: ${hcaPath}`);
                        return null;
                    }
                    sendProgress(label === 'EU' ? 50 : 60, `Используем ${label} аудио (.hca) без расшифровки`);
                    console.log(`Пропускаем hca2wav (${label}), отдаём в ffmpeg: ${hcaPath}`);
                    return hcaPath;
                }

            }

            const euWavPath = await hcaToWav(euHca, euWavWanted, 'EU').catch(e => { console.warn(e.message); return null; });
            const jpWavPath = await hcaToWav(jpHca, jpWavWanted, 'JP').catch(e => { console.warn(e.message); return null; });

            if (merged === true) {
                async function muxToMp4(audioWavPath, outMp4, label) {
                    if (!audioWavPath || !fs.existsSync(audioWavPath)) return false;
                    sendProgress(label === 'EU' ? 70 : 80, `Собираем ${label}.mp4...`);

                    // Базовые аргументы с «безопасными» настройками по памяти.
                    const makeArgs = (opts = {}) => {
                        const {
                            preset = 'medium',     // было 'medium' — потребляет больше RAM
                            crf = '18',
                            threads = '6',         // ограничиваем, иначе x264 сам возьмёт 24
                            rcLookahead = '30',    // меньше буфера — меньше RAM
                        } = opts;

                        return [
                            '-y',
                            '-i', resultVideo,          // видео (у вас .m2v, но по факту IVF/VP9 — ffmpeg корректно пробует)
                            '-i', audioWavPath,         // аудио WAV

                            // маппинг дорожек
                            '-map', '0:v:0',
                            '-map', '1:a:0',

                            // видео → H.264
                            '-c:v', 'libx264',
                            '-preset', preset,
                            '-crf', crf,
                            '-pix_fmt', 'yuv420p',
                            //'-threads:v', threads,                  // ограничиваем потоки у кодера
                            //'-x264-params', `rc-lookahead=${rcLookahead}:sync-lookahead=0`,

                            // аудио → AAC
                            '-c:a', 'aac',
                            '-b:a', '192k',

                            // контейнер и удобство проигрывания
                            '-movflags', '+faststart',
                            '-shortest',

                            outMp4,
                        ];
                    };

                    // Вспомогательная обёртка запуска
                    const runFfmpeg = (args) => new Promise((resolve, reject) => {
                        console.log(`FFmpeg: ${path.basename(resultVideo)} + ${path.basename(audioWavPath)} -> ${path.basename(outMp4)}`);
                        const p = spawn(convExePath, args, { cwd: resultDir });
                        let out = '', err = '';
                        p.stdout.on('data', d => { out += d.toString(); console.log('ffmpeg stdout:', d.toString()); });
                        p.stderr.on('data', d => { err += d.toString(); console.log('ffmpeg stderr:', d.toString()); });
                        p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`ffmpeg код ${code}\n${err || out}`)));
                        p.on('error', e => reject(new Error(`Ошибка запуска ffmpeg: ${e.message}`)));
                    });

                    try {
                        // 1-я попытка: «умеренно экономный» профиль
                        await runFfmpeg(makeArgs({ preset: 'faster', crf: '18', threads: '4', rcLookahead: '16' }));
                        await waitForFile(outMp4, 10, 400);
                        console.log('Готово:', path.basename(outMp4));
                        return true;
                    } catch (e1) {
                        console.warn('FFmpeg упал на первом профиле, пробуем ещё раз с сильно урезанными требованиями...', e1.message);
                        // 2-я попытка: ещё более лёгкий профиль
                        await runFfmpeg(makeArgs({ preset: 'veryfast', crf: '20', threads: '2', rcLookahead: '10' }));
                        await waitForFile(outMp4, 10, 400);
                        console.log('Готово (fallback):', path.basename(outMp4));
                        return true;
                    }
                }

                const madeEUmp4 = await muxToMp4(euWavPath, euMp4, 'EU'); // 1) EU
                const madeJPmp4 = await muxToMp4(jpWavPath, jpMp4, 'JP'); // 2) JP

                if (madeEUmp4) logMsg += `Собрано: ${path.basename(euMp4)}\n`;
                if (madeJPmp4) logMsg += `Собрано: ${path.basename(jpMp4)}\n`;
                if (!madeEUmp4 && !madeJPmp4) logMsg += 'EU/JP дорожки не найдены — mp4 не собраны\n';

                sendProgress(92, 'Очистка временных файлов...');
                // --- ЧИСТКА: только файлы с этим же базовым именем
                await deleteIfExists(resultVideo);     // USMXXX.m2v
                await deleteIfExists(euHca);           // USMXXX_EU.hca
                await deleteIfExists(jpHca);           // USMXXX_JP.hca
                await deleteIfExists(euWavWanted);     // USMXXX_EU.wav (если именно так назван)
                await deleteIfExists(jpWavWanted);     // USMXXX_JP.wav
                // на случай альтернативного имени от hca2wav:
                await deleteIfExists(euHca.replace(/\.hca$/i, '.wav'));
                await deleteIfExists(jpHca.replace(/\.hca$/i, '.wav'));
                await deleteIfExists(`${euHca}.wav`);
                await deleteIfExists(`${jpHca}.wav`);

            } else {
                if (isP5R) {
                    // --- merged === false: МЕРЖА НЕТ, чистим только .hca с текущим именем
                    sendProgress(45, `Очистка${isP5R ? ' .hca (merged=false)' : ''}...`);
                    await deleteIfExists(euHca);
                    await deleteIfExists(jpHca);
                }

                logMsg += `Собранный mp4 не требуется (merged=false).${isP5R ? "Удалены только .hca" : ''}\n`;
            }
            sendProgress(100, 'Готово');

            if (openFolder) await shell.openPath(resultDir);
            return logMsg.trim();

        } catch (err) {
            console.error('Общая ошибка:', err);
            throw err;
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

    ipcMain.handle('open-result-dir', async () => {
        const resultPath = path.join(__dirname, '../result');
        await shell.openPath(resultPath).catch((e) => console.error("Директория не найдена", e));
        console.log("Директория открыта")
        return null;
    })

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

    ipcMain.handle('open-url-browser', async (event, url) => {
        await shell.openExternal(url);
    });
}

module.exports = { setupIpcHandlers };