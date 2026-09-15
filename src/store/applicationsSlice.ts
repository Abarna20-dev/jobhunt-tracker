import {
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import {
  Application,
  ApplicationStatus,
  NoteEntry,
} from "../types/application";

interface ApplicationsState {
  items: Application[];
}

const initialState: ApplicationsState = {
  items: [],
};

const applicationsSlice = createSlice({
  name: "applications",

  initialState,

  reducers: {
    addApplication: (
      state,
      action: PayloadAction<Application>
    ) => {
      state.items.unshift(action.payload);
    },

    updateStatus: (
      state,
      action: PayloadAction<{
        id: string;
        status: ApplicationStatus;
      }>
    ) => {
      const application = state.items.find(
        (item) =>
          item.id === action.payload.id
      );

      if (application) {
        application.status =
          action.payload.status;
      }
    },

    deleteApplication: (
      state,
      action: PayloadAction<{ id: string }>
    ) => {
      state.items = state.items.filter(
        (item) =>
          item.id !== action.payload.id
      );
    },

    addNote: (
      state,
      action: PayloadAction<{
        id: string;
        note: NoteEntry;
      }>
    ) => {
      const application = state.items.find(
        (item) =>
          item.id === action.payload.id
      );

      if (application) {
        application.notes.push(
          action.payload.note
        );
      }
    },

    loadApplications: (
      state,
      action: PayloadAction<Application[]>
    ) => {
      state.items = action.payload;
    },
  },
});

export const {
  addApplication,
  updateStatus,
  deleteApplication,
  addNote,
  loadApplications,
} = applicationsSlice.actions;

export default applicationsSlice.reducer;
