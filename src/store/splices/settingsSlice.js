// store/slices/settingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// 🔥 ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
const initialState = {
    language: 'ru',
    region: 'jp',
    merged: false,
    personaChoose: 'P5R',
    openFolder: true,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setLanguage: (state, action) => {
            state.language = action.payload;
        },
        setRegion: (state, action) => {
            state.region = action.payload;
        },
        setMerged: (state, action) => {
            state.merged = action.payload;
        },
        setPersonaGame: (state, action) => {
            state.personaChoose = action.payload;
        },
        setOpenFolder: (state, action) => {
            state.openFolder = action.payload;
        },
        resetSettings: () => initialState,
    },
});

export const {
    setLanguage,
    setRegion,
    setMerged,
    setPersonaGame,
    setOpenFolder,
    resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;