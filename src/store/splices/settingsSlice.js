// store/slices/settingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// 🔥 ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
const initialState = {
    language: 'ru',
    region: 'jp',
    merged: false,
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
        resetSettings: () => initialState,
    },
});

export const {
    setLanguage,
    setRegion,
    setMerged,
    resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;