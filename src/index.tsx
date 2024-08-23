import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { Provider } from 'mobx-react';
import './index.scss';
import { ConfigProvider, theme } from 'antd';
import globalStore from './store/globalStore';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        components: {
          Message: {
            contentBg: '#151515',
          }
        },
        token: {
          colorText: '#bbbbbb',
          colorPrimaryHover: '#bbbbbb',
          colorPrimaryActive: '#bbbbbb',
          colorBgContainer: '#151515',
        },
      }}
    >
      <Provider globalStore={globalStore}>
        <RouterProvider router={router} />
      </Provider>
    </ConfigProvider>
  </React.StrictMode>
);