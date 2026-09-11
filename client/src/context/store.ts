import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";

// ============================================================
// Store
// ============================================================

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
  },
});

// ============================================================
// Typed hooks
// ============================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Typed dispatch hook — use instead of plain `useDispatch` */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Typed selector hook — use instead of plain `useSelector` */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
