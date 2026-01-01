import { createSlice,configureStore } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { isAuthenticated: true }, 
  reducers: {
    login(state) {
      state.isAuthenticated = true;
    },
    logout(state) {
      state.isAuthenticated = false;
    }   
    }
});

const ProfileSlice = createSlice({
  name: "profile",
  initialState: { profileData: {username:"Muzammil"} },
  reducers: {
    setProfileData(state, action) {
      state.profileData = action.payload;
    }
  }
});

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    profile: ProfileSlice.reducer
  }
});

export default store;
export const authActions = authSlice.actions;
export const profileActions = ProfileSlice.actions;