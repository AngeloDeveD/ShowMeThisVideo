import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import RegionChoosingComponent from "../regionChosingComponent/regionChoosingComponent";
import MergeComponent from "../mergeComponent/mergeComponent";
import PersonaChoosing from "../personaChoosing/personaChoosing";
import OpenFolderComponent from "../openFolderComponent/openFolderComponent";
import "./videoImportComponent.scss";

const STALL_MS = 3000;       // считаем, что застрял, если нет реального апдейта ≥ 3с
const STEP_MIN_MS = 3000;    // шаг авто-накрутки: 3–4с
const STEP_MAX_MS = 4000;

const VideoConverterImport = () => {
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState('');

  const links = useRef({
    "P5R": "https://amicitia.miraheze.org/wiki/Persona_5_Royal/ps4_movieR.cpk",
    "P5": "https://amicitia.miraheze.org/wiki/Persona_5/ps3.cpk/movie",
    "P4G": '',
    "P3R": "https://amicitia.miraheze.org/wiki/Persona_3_Reload/Anim"
  })

  const [progress, setProgressRef] = useState(0);
  const [status, setStatus] = useState('');

  const realPercentRef = useRef(0);            // последний реальный % от Electron
  const lastRealChangeAtRef = useRef(0);       // когда последний раз менялся реальный %
  const stallTimerRef = useRef(null);          // таймер «сторожа» зависания
  const tickTimerRef = useRef(null);           // таймер авто-накрутки
  const smoothingActiveRef = useRef(false);    // сейчас идёт авто-накрутка?
  const stallBaseRef = useRef(0);              // X% — значение, на котором зависли
  const stallCapRef = useRef(0);               // динамический потолок X+9 (но не выше 99)
  const uiPercentRef = useRef(0); // что сейчас реально показывает UI (progress)

  const settings = useSelector((state) => state.settings);
  const region = settings.region;
  const merged = settings.merged;
  const personaChoose = settings.personaChoose;
  const openFolder = settings.openFolder;

  const navigate = useNavigate();

  const { t } = useTranslation();

  const getFileName = (filePath) => filePath.split(/[\\/]/).pop();

  const [urlInfo, setUrlInfo] = useState(personaChoose);

  const clearTimers = useCallback(() => {
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
    if (tickTimerRef.current) { clearTimeout(tickTimerRef.current); tickTimerRef.current = null; }
    smoothingActiveRef.current = false;
  }, []);

  const resetProgressState = useCallback(() => {
    clearTimers();
    setProgressRef(0);
    setStatus('');
    realPercentRef.current = 0;
    lastRealChangeAtRef.current = 0;
    stallBaseRef.current = 0;
    stallCapRef.current = 0;
  }, [clearTimers]);

  const setProgressRefSafe = useCallback((next) => {
    // функция принимает либо число, либо (prev) => число
    if (typeof next === 'function') {
      setProgressRef(prev => {
        const val = next(prev);
        uiPercentRef.current = val;
        return val;
      });
    } else {
      uiPercentRef.current = next;
      setProgressRef(next);
    }
  }, []);


  const handleFileSelect = useCallback(async () => {
    try {
      const selectedPath = await window.electronAPI.selectFile();
      if (selectedPath) {
        const fileName = getFileName(selectedPath);
        processFile({ name: fileName, path: selectedPath, size: 0 }, selectedPath);
      }
    } catch (error) {
      setOutput(`❌ ${t("ErrorChoosingFile")}: ${error.message}`);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      if (fileName.endsWith('.usm')) {
        try {
          const fileInfo = await window.electronAPI.getFileInfo({
            name: droppedFile.name,
            path: droppedFile.path,
            size: droppedFile.size
          });

          if (fileInfo && fileInfo.path) {
            processFile(fileInfo, fileInfo.path);
          } else {
            setOutput(`❌ ${t("ErrorFindFilePath")}`);
          }
        } catch (error) {
          setOutput(`❌ ${t("ErrorProcessingFile")}: ${error.message}`);
        }
      } else {
        setOutput(`❌ ${t("ChooseUsmFile")}`);
      }
    } else {
      setOutput(`❌ ${t("FileNotChoosed")}`);
    }
  }, []);

  const processFile = useCallback((fileInfo, path) => {
    setFile(fileInfo);
    setFilePath(path);
    setOutput(`✅ ${t("FileChoosed")}: ${fileInfo.name}\n📁 ${t("Path")}: ${path}`);
    setProgressRef(0);
    setStatus('');
  }, [region]);

  const executeCommand = useCallback(async () => {
    if (!filePath) {
      setOutput(`❌ ${t("FirstSelectYourFile")}`);
      return;
    }
    if (!region) {
      setOutput(`❌ ${t("FirstSelectYourRegion")}`);
      return;
    }

    console.log(`Version Choosed: ${personaChoose}`);

    setIsProcessing(true);
    setOutput(`🔄 ${t("ExecutingACommand")}...`);
    resetProgressState();
    setProgressRef(1);
    setStatus(`${t("StatusStart")}...`);

    try {
      const result = await window.electronAPI.executeCommand(file, filePath, region, merged, personaChoose, openFolder);
      setStatus(`${t("StatusDone")}`);
      setProgressRef(100);
      setOutput(`✅ ${t("CommandCompletedSuccessfully")}`);
      console.log(`${t("Success")} ${result}`);
    } catch (error) {
      setOutput(`❌ ${t("CommandExecutionError")}`);
      setStatus(`${t("Error")}: ${error.message}`);
      setProgressRef(100);
      console.error(`${t("Error!")} ${error.message}`);
    } finally {
      setIsProcessing(false);
      clearTimers();
    }
  }, [filePath, region, merged, personaChoose, resetProgressState, clearTimers]);

  const openResultFolder = useCallback(async () => {
    try {
      const result = await window.electronAPI.openResultDir();
      console.log(`${t("Successfully")} ${result}`);
    }
    catch (error) {
      console.error(`${t("ErrorOpeningFolder!")}`, error);
    }
  });

  const openLinkInBrowser = useCallback(async () => {
    try {
      const result = await window.electronAPI.openExternal(links.current[urlInfo]);
      console.log(`${t("Successfully")} ${result}`);
    }
    catch (error) {
      console.error(`Error`, error);
    }
  });

  const handleReset = useCallback(() => {
    setFile(null);
    setFilePath('');
    setOutput('');
    setProgressRef(0);
    setStatus('');
    resetProgressState();
  }, [resetProgressState]);

  const scheduleStallWatcher = useCallback(() => {
    // если уже идёт накрутка — не ставим сторож; если завершено — тоже
    if (smoothingActiveRef.current || realPercentRef.current >= 100) return;

    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);

    // запланировать проверку через STALL_MS от последнего реального изменения
    const remaining = Math.max(0, STALL_MS - (Date.now() - lastRealChangeAtRef.current));
    stallTimerRef.current = setTimeout(() => {
      // условия старта имитации
      if (realPercentRef.current >= 100 || !isProcessing) return;

      // зафиксировать «базу» и потолок (X -> X+9, но не больше 99)
      stallBaseRef.current = realPercentRef.current;
      stallCapRef.current = Math.min(stallBaseRef.current + 9, 99);

      // если текущий показанный уже >= потолка — ничего не делаем
      if (realPercentRef.current >= stallCapRef.current) {
        // но продолжаем сторожить следующее возможное зависание
        scheduleStallWatcher();
        return;
      }

      // запускаем авто-накрутку
      smoothingActiveRef.current = true;

      const tick = () => {
        // стоп-условия
        if (!isProcessing || realPercentRef.current >= 100) { clearTimers(); return; }

        // если пришёл реальный апдейт выше текущего отображаемого — показать его и пересчитать сторож
        if (realPercentRef.current > realPercentRef) {
          setProgressRef(p => Math.max(p, realPercentRef.current));
          smoothingActiveRef.current = false;
          scheduleStallWatcher();
          return;
        }

        // если добрались до динамического потолка — остановить накрутку и снова ждать реального апдейта/следующего зависания
        if (realPercentRef.current >= stallCapRef.current) {
          smoothingActiveRef.current = false;
          scheduleStallWatcher();
          return;
        }

        // иначе аккуратно накручиваем +1%
        setProgressRef(p => Math.min(stallCapRef.current, p + 1));

        // следующий тик через 3–4 сек
        const delay = Math.floor(STEP_MIN_MS + Math.random() * (STEP_MAX_MS - STEP_MIN_MS));
        tickTimerRef.current = setTimeout(tick, delay);
      };

      // первый шаг сразу
      tick();
    }, remaining);
  }, [clearTimers, isProcessing, realPercentRef.current]);

  useEffect(() => {
    file && console.log(`Имя файла: ${file.name}\nПуть файла: ${filePath}`);
  }, [file, filePath]);

  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.onProgress) return;

    const off = window.electronAPI.onProgress(({ percent, message }) => {
      if (typeof message === 'string') setStatus(message);

      const safe = Math.max(0, Math.min(100, Number(percent) || 0));
      const was = realPercentRef.current;

      // зафиксировать новые реальные данные
      realPercentRef.current = safe;

      // если реальный % изменился — сбросить таймер «зависания» и пересчитать
      if (safe !== was) {
        lastRealChangeAtRef.current = Date.now();
        // если шла накрутка — остановим её (реальный апдейт — главнее)
        if (smoothingActiveRef.current) {
          clearTimers(); // очищает tick и помечает smoothingActive=false
        }
      }

      // Показать пользователю максимум из текущего отображаемого и реального (не откатываем назад)
      setProgressRef(prev => Math.max(prev, safe));

      // 100% — всё, ничего больше не делаем
      if (safe >= 100) {
        clearTimers();
        return;
      }

      // заново запланировать сторож (пересчитает оставшееся до STALL_MS)
      scheduleStallWatcher();
    });

    return () => { if (typeof off === 'function') off(); };
  }, [scheduleStallWatcher, clearTimers]);

  // Cleanup при размонтировании
  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => setUrlInfo(personaChoose), [personaChoose]);

  return (
    <>
      <RegionChoosingComponent />
      <PersonaChoosing />
      <MergeComponent />
      <OpenFolderComponent />

      <div className="video-import">
        <h1 className="video-import__title">{t("UsmFilesConverter")}</h1>

        {(isProcessing || progress > 0) && (
          <div className="video-import__progress">
            <div className="video-import__progress-row">
              <span className="video-import__progress-label">{`${t("Status")}:`}</span>
              <span className="video-import__progress-value">{progress}%</span>
            </div>
            <progress id="progress" max="100" value={progress} className="video-import__progress-bar" />
            <div id="status" className="video-import__progress-status">
              {status || `${t("wait")}...`}
            </div>
          </div>
        )}

        {/* Drag & Drop область */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
          className={`video-import__dropzone ${isDragging ? 'is-dragging' : ''}`}
        >
          <div className="video-import__dropzone-icon">📁</div>
          <p className="video-import__dropzone-title">
            {t("DragUsmFile")}
          </p>
          <p className="video-import__dropzone-subtitle">
            {t("OnlySupportUsm")}
          </p>
        </div>

        {/* Информация о выбранном файле */}
        {file && (
          <div className="video-import__file-card">
            {output === '' ? <h3>{`✅ ${t("FileSelected")}:`}</h3> : <h3>{output}</h3>}
            <p><strong>{`${t("Name")}:`}</strong> {file.name}</p>

            <div className="video-import__actions">
              <button
                onClick={executeCommand}
                disabled={isProcessing}
                className={`btn btn--primary ${isProcessing ? 'is-disabled' : ''}`}
              >
                {isProcessing ? `🔄 ${t("Processing")}...` : `🚀 ${t("RunCommand")}`}
              </button>

              <button
                onClick={handleReset}
                className="btn btn--secondary"
              >
                {`❌ ${t("Reset")}`}
              </button>
              <button
                onClick={openResultFolder}
                disabled={isProcessing}
                className={`btn btn--primary ${isProcessing ? 'is-disabled' : ''} `}
              >
                {`📁 ${t("OpenFolder")}`}
              </button>
              <button
                onClick={openLinkInBrowser}
                className={`btn btn--primary ${!links.current[urlInfo] ? 'is-disabled' : ''}`}
                disabled={!links.current[urlInfo]}
              >
                {t("InfoAboutUsmFiles")}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="btn btn--secondary video-import__back"
        >
          {`← ${t("Back")}`}
        </button>
      </div>
    </>
  );
};

export default VideoConverterImport;
