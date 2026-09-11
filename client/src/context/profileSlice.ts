import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type ProfileEditSection =
  | "headline"
  | "bio"
  | "skills"
  | "education"
  | "experience"
  | "certifications"
  | "roleParams"
  | "visuals"
  | null;

interface ProfileEditState {
  activeSection: ProfileEditSection;
  editingIndex: number | null;
  isModalOpen: boolean;
}

const initialState: ProfileEditState = {
  activeSection: null,
  editingIndex: null,
  isModalOpen: false,
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    openEditModal: (
      state,
      action: PayloadAction<{ section: ProfileEditSection; index?: number | null }>
    ) => {
      state.activeSection = action.payload.section;
      state.editingIndex = action.payload.index ?? null;
      state.isModalOpen = true;
    },
    closeEditModal: (state) => {
      state.activeSection = null;
      state.editingIndex = null;
      state.isModalOpen = false;
    },
  },
});

export const { openEditModal, closeEditModal } = profileSlice.actions;
export default profileSlice.reducer;
