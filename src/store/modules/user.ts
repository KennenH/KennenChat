import { createSlice } from '@reduxjs/toolkit';

const userStore = createSlice({
  name: "user",
  // 数据状态
  initialState: {
    token: '',
  },
  // 同步修改方法
  reducers: {
    setToken (state, action) {
      state.token = action.payload
    },
  }
});


const { setToken } = userStore.actions;
const userReducer = userStore.reducer;


export default userReducer;