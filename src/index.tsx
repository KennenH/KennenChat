import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Provider } from 'mobx-react';
import './index.scss';
import { ConfigProvider } from 'antd';
import globalStore from './store/globalStore';
import messageStore from './store/MessageStore';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

/**
 * @param color index.scss 中定义的颜色名
 */
const getColor = (color: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(color);
}

const colors = {
  gray: getColor('--gray'),
  black: getColor('--black'),
}

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        components: {
          Message: {
            contentBg: colors.gray,
          }
        },
        token: {
          colorText: colors.black,
          colorPrimaryHover: colors.black,
          colorPrimaryActive: colors.black,
          colorBgContainer: colors.gray,
        },
      }}
    >
      <Provider globalStore={globalStore} messageStore={messageStore}>
        <RouterProvider router={router} />
      </Provider>
    </ConfigProvider>
  </React.StrictMode>
);