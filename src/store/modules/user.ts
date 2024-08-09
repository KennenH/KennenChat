import { ILogin } from '@/pages/Login';
import { getTokenLocal, request, setTokenLocal as _setToken, setTokenLocal } from '@/utils';
import { createSlice, Dispatch, UnknownAction } from '@reduxjs/toolkit';

const userStore = createSlice({
  name: "user",
  // 数据状态
  initialState: {
    token: getTokenLocal() || '',
  },
  // 同步修改方法
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      setTokenLocal(action.payload);
    },
  }
});

const { setToken } = userStore.actions;
const userReducer = userStore.reducer;

const fetchLogin = (params: ILogin) => {
  return async (dispatch: any) => {
    const res = await request.post('/authorizations', params);
    dispatch(setToken(res.data.token));
  }
}

export { setToken, fetchLogin };
export default userReducer;