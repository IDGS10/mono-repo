// shared/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import { analyticsSlice } from '../../modules/analytics/store/analyticsSlice.js';
// import { deviceSlice } from '../../modules/device-manager/store/deviceSlice.js';
// import { projectSlice } from '../../modules/projects/store/projectSlice.js';

export const store = configureStore({
  reducer: {
    analytics: analyticsSlice.reducer,
    // devices: deviceSlice.reducer,
    // projects: projectSlice.reducer,
  },
});