import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reportService, type ReportQuery } from '@/services/reportService';
import type { DashboardSummary, ReportFormat, ReportType } from '@/types';

interface ReportState {
  dashboard: DashboardSummary | null;
  totalCustomers: number;
  totalExtinguishers: number;
  loading: boolean;
  downloading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  dashboard: null,
  totalCustomers: 0,
  totalExtinguishers: 0,
  loading: false,
  downloading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'reports/fetchDashboard',
  async (params: ReportQuery | undefined, { rejectWithValue }) => {
    try {
      return await reportService.getDashboardSummary(params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const downloadReport = createAsyncThunk(
  'reports/download',
  async (
    { type, params }: { type: ReportType; params: ReportQuery },
    { rejectWithValue },
  ) => {
    try {
      return await reportService.downloadReport(type, params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const setDashboardCounts = createAsyncThunk(
  'reports/setCounts',
  async (counts: { totalCustomers: number; totalExtinguishers: number }) => counts,
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(downloadReport.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadReport.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload as string;
      })
      .addCase(setDashboardCounts.fulfilled, (state, action) => {
        state.totalCustomers = action.payload.totalCustomers;
        state.totalExtinguishers = action.payload.totalExtinguishers;
      });
  },
});

export const { clearReportError } = reportSlice.actions;
export default reportSlice.reducer;

export type { ReportFormat, ReportType };
