import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  customerService,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
} from '@/services/customerService';
import type { Customer, ListQuery, PaginatedResult } from '@/types';

interface CustomerState {
  items: Customer[];
  meta: PaginatedResult<Customer>['meta'] | null;
  selected: Customer | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  items: [],
  meta: null,
  selected: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (params: ListQuery, { rejectWithValue }) => {
    try {
      return await customerService.list(params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (payload: CreateCustomerPayload, { rejectWithValue }) => {
    try {
      return await customerService.create(payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async (
    { id, payload }: { id: string; payload: UpdateCustomerPayload },
    { rejectWithValue },
  ) => {
    try {
      return await customerService.update(id, payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await customerService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearCustomerError } = customerSlice.actions;
export default customerSlice.reducer;
