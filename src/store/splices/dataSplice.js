// store/slices/dataSlice.js
import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
    name: 'data',
    initialState: {
        sharedData: '',
        items: [],
        lastUpdated: null,
    },
    reducers: {
        setSharedData: (state, action) => {
            state.sharedData = action.payload;
        },
        addItem: (state, action) => {
            state.items.push(action.payload);
        },
        clearData: (state) => {
            state.sharedData = '';
            state.items = [];
        },
        updateTimestamp: (state) => {
            state.lastUpdated = new Date().toISOString();
        },
    },
});

export const { setSharedData, addItem, clearData, updateTimestamp } = dataSlice.actions;
export default dataSlice.reducer;