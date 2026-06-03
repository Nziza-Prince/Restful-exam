import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  complianceService,
  type CreateCompliancePayload,
  type UpdateCompliancePayload,
} from '@/services/complianceService';
import type { ComplianceCase, ComplianceFilters, PaginatedResult } from '@/types';

interface ComplianceState {
  items: ComplianceCase[];
  meta: PaginatedResult<ComplianceCase>['meta'] | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ComplianceState = {
  items: [],
  meta: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchComplianceCases = createAsyncThunk(
  'compliance/fetchAll',
  async (params: ComplianceFilters, { rejectWithValue }) => {
    try {
      return await complianceService.list(params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createComplianceCase = createAsyncThunk(
  'compliance/create',
  async (payload: CreateCompliancePayload, { rejectWithValue }) => {
    try {
      return await complianceService.create(payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateComplianceCase = createAsyncThunk(
  'compliance/update',
  async (
    { id, payload }: { id: string; payload: UpdateCompliancePayload },
    { rejectWithValue },
  ) => {
    try {
      return await complianceService.update(id, payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const closeComplianceCase = createAsyncThunk(
  'compliance/close',
  async ({ id, notes }: { id: string; notes?: string }, { rejectWithValue }) => {
    try {
      return await complianceService.close(id, notes);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const deleteComplianceCase = createAsyncThunk(
  'compliance/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await complianceService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    clearComplianceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplianceCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceCases.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchComplianceCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createComplianceCase.pending, (state) => {
        state.saving = true;
      })
      .addCase(createComplianceCase.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateComplianceCase.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(closeComplianceCase.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(deleteComplianceCase.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearComplianceError } = complianceSlice.actions;
export default complianceSlice.reducer;
