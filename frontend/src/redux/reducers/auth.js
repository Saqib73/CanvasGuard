import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  loader: true,
  artistSetupPending: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userExists: (state, action) => {
      state.user = action.payload;
      state.loader = false;
      state.artistSetupPending = false;
    },
    userNotExists: (state) => {
      (state.user = null), (state.loader = false);
      state.artistSetupPending = false;
    },
    setArtIspending: (state, action) => {
      state.artistSetupPending = action.payload;
      state.loader = false;
    },
  },
});

export default authSlice;

export const { userExists, userNotExists, setArtIspending } = authSlice.actions;
