// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './splices/settingsSlice';

// Функции для работы с LocalStorage
export const loadState = () => {
    try {
        const serializedState = localStorage.getItem('reduxState');
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        console.error('Ошибка загрузки из LocalStorage:', err);
        return undefined;
    }
};

export const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('reduxState', serializedState);
    } catch (err) {
        console.error('Ошибка сохранения в LocalStorage:', err);
    }
};

// Создаем store с предзагруженным состоянием
const preloadedState = loadState();

export const store = configureStore({
    reducer: {
        settings: settingsReducer,
    },
    preloadedState,
});

// Автосохранение при изменении состояния
store.subscribe(() => {
    saveState(store.getState());
});

// Если нужны типы для использования в компонентах, можно создать хелперы:
export const getState = () => store.getState();
export const dispatch = (action) => store.dispatch(action);