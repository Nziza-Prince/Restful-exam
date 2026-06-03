import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import extinguisherReducer from './slices/extinguisherSlice';
import notificationReducer from './slices/notificationSlice';
import renewalReducer from './slices/renewalSlice';
import complianceReducer from './slices/complianceSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    extinguishers: extinguisherReducer,
    notifications: notificationReducer,
    renewals: renewalReducer,
    compliance: complianceReducer,
    reports: reportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
