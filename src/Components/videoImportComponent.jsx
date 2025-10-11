import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const VideoConverterImport = () => {
    const [file, setFile] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState('');
    const [region, setRegion] = useState('JP');
    const navigate = useNavigate();

    const getFileName = (filePath) => {
        // Разделяем путь по / или \ и берем последнюю часть
        return filePath.split(/[\\/]/).pop();
    };

    // Обработчик выбора файла через системный диалог
    const handleFileSelect = useCallback(async () => {
        try {
            const selectedPath = await window.electronAPI.selectFile();
            if (selectedPath) {
                const fileName = getFileName(selectedPath);
                processFile({
                    name: fileName,
                    path: selectedPath,
                    size: 0
                }, selectedPath);
            }
        } catch (error) {
            setOutput(`❌ Ошибка выбора файла: ${error.message}`);
        }
    }, []);

    // Обработчик drag and drop
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
                    // Получаем информацию о файле через electronAPI
                    const fileInfo = await window.electronAPI.getFileInfo({
                        name: droppedFile.name,
                        path: droppedFile.path,
                        size: droppedFile.size
                    });

                    if (fileInfo && fileInfo.path) {
                        processFile(fileInfo, fileInfo.path);
                    } else {
                        setOutput('❌ Не удалось получить путь к файлу');
                    }
                } catch (error) {
                    setOutput(`❌ Ошибка обработки файла: ${error.message}`);
                }
            } else {
                setOutput('❌ Пожалуйста, выберите файл с расширением .usm');
            }
        } else {
            setOutput('❌ Файл не выбран');
        }
    }, []);

    // Обработка выбранного файла
    const processFile = useCallback((fileInfo, path) => {
        setFile(fileInfo);
        setFilePath(path);
        setOutput(`✅ Файл выбран: ${fileInfo.name}\n📁 Путь: ${path}`);
    }, [region]);

    // Выполнение команды
    const executeCommand = useCallback(async () => {
        if (!filePath) {
            setOutput('❌ Сначала выберите файл');
            return;
        }

        if (!region) {
            setOutput('❌ Сначала выберите регион');
            return;
        }

        setIsProcessing(true);
        setOutput('🔄 Выполнение команды...');
        console.log(`Регион: ${region}`);

        try {
            const result = await window.electronAPI.executeCommand(filePath, region);

            setOutput(`✅ Команда выполнена успешно:\n${result}`);
        } catch (error) {
            setOutput(`❌ Ошибка выполнения команды:\n${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [filePath, region]);

    const handleReset = useCallback(() => {
        setFile(null);
        setFilePath('');
        setOutput('');
    }, []);

    const HandleRegionSelector = useCallback((e) => {
        setRegion(e.target.value);
        console.log(e.target.value);
    });


    return (
        <>
            <div className="">
                <form>
                    <label htmlFor="region-selector">Выбранный регион: </label>
                    <select
                        name="reg"
                        id="reg-select"
                        value={region}
                        onChange={HandleRegionSelector}
                    >
                        <option value="JP">Япония</option>
                        <option value="CN">Китай</option>
                        <option value="EFIGS">Европа/США PS4</option>
                        <option value="Steam">Европа/США Steam</option>
                    </select>
                </form>
            </div>

            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Конвертер .usm файлов</h1>

                {/* Drag & Drop область */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
                        borderRadius: '10px',
                        padding: '40px',
                        textAlign: 'center',
                        backgroundColor: isDragging ? '#f8f9fa' : '#fff',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onClick={handleFileSelect} // Используем системный диалог
                >
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                    <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                        Перетащите .usm файл сюда или нажмите для выбора
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Поддерживаются файлы .usm, .USM, .Usm и т.д.
                    </p>
                </div>

                {/* Информация о выбранном файле */}
                {file && (
                    <div style={{
                        backgroundColor: '#e8f5e8',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #4caf50'
                    }}>
                        <h3>✅ Файл выбран:</h3>
                        <p><strong>Имя:</strong> {file.name}</p>
                        <p><strong>Полный путь:</strong> {filePath}</p>

                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={executeCommand}
                                disabled={isProcessing}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: isProcessing ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isProcessing ? '🔄 Обработка...' : '🚀 Выполнить команду'}
                            </button>

                            <button
                                onClick={handleReset}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                ❌ Сбросить
                            </button>
                        </div>
                    </div>

                )}

                {/* Вывод результата */}
                {output && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '8px',
                        marginTop: '20px',
                        border: '1px solid #dee2e6',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                    }}>
                        <h4>Результат:</h4>
                        {output}
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    ← Назад
                </button>
            </div >
        </>
    );
};

export default VideoConverterImport;