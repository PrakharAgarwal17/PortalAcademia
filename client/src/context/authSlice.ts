import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { API_BASE } from "@/lib/api";

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  _id?: string;
  id?: string;
  email: string;
  role?: string;
  isVerified: boolean;
  isOnboarded: boolean;
  isEmailVerified?: boolean;
  githubId?: string | null;
  githubUsername?: string | null;
  githubAvatarUrl?: string | null;
  githubProfileUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  /** Always null — auth is managed via httpOnly cookies set by the server */
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface CheckAuthResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role?: string;
    isVerified: boolean;
    isOnboarded: boolean;
    isEmailVerified?: boolean;
    githubId?: string | null;
    githubUsername?: string | null;
    githubAvatarUrl?: string | null;
    githubProfileUrl?: string | null;
  };
}

// ============================================================
// Async Thunks
// ============================================================

/**
 * @description Validates the current session by calling the server's checkAuth
 *              endpoint. The server reads the httpOnly "accesstoken" cookie
 *              automatically — no manual token forwarding needed.
 * @param {void} _ - No parameters required
 * @returns {Promise<CheckAuthResponse>} Whether the session is valid plus user data
 * @throws {Error} Network errors or non-2xx responses
 */
export const checkAuthThunk = createAsyncThunk<
  CheckAuthResponse,
  string | void,
  { rejectValue: string }
>("auth/checkAuth", async (token, { rejectWithValue }) => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token && typeof token === "string") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/api/auth/checkAuth`,
      {
        method: "POST",
        credentials: "include", // send httpOnly cookie
        headers,
      }
    );

    if (!response.ok) {
      return rejectWithValue("Session check failed");
    }

    const data = (await response.json()) as CheckAuthResponse;

    if (data.valid && data.user) {
      if (data.user.isOnboarded && !data.user.role) {
        try {
          const profileHeaders: Record<string, string> = {};
          if (token && typeof token === "string") {
            profileHeaders["Authorization"] = `Bearer ${token}`;
          }
          const profileRes = await fetch(`${API_BASE}/api/profile/me`, {
            method: "GET",
            credentials: "include",
            headers: profileHeaders,
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success && profileData.profile?.accountType) {
              data.user.role = profileData.profile.accountType;
            }
          }
        } catch {
          // Fallback gracefully if profile lookup encounters network blip
        }
        if (!data.user.role) {
          data.user.role = "student";
        }
      }
    }

    return data;
  } catch (err) {
    return rejectWithValue("Network error during session check");
  }
});

/**
 * @description Signs out the current user by clearing cookies on the server
 *              and wiping state locally.
 */
export const signOutThunk = createAsyncThunk<void, void>(
  "auth/signOut",
  async () => {
    try {
      await fetch(`${API_BASE}/api/auth/SignOut`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue clearing local state even if network fails
    }
  }
);

// ============================================================
// Initial State
// ============================================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // starts loading while initial session telemetry is checked
  isInitialized: false,
  error: null,
};

// ============================================================
// Slice
// ============================================================

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload.valid && action.payload.user) {
          state.isAuthenticated = true;
          state.user = {
            id: action.payload.user.id,
            _id: action.payload.user.id,
            email: action.payload.user.email,
            isVerified: action.payload.user.isVerified,
            isOnboarded: action.payload.user.isOnboarded,
            isEmailVerified: action.payload.user.isEmailVerified,
            role: action.payload.user.role,
            githubId: action.payload.user.githubId,
            githubUsername: action.payload.user.githubUsername,
            githubAvatarUrl: action.payload.user.githubAvatarUrl,
            githubProfileUrl: action.payload.user.githubProfileUrl,
          };
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(signOutThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setCredentials, clearAuth, setError, setLoading } =
  authSlice.actions;

export default authSlice.reducer;
