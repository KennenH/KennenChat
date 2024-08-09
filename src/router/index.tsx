import { createBrowserRouter } from 'react-router-dom';

import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import HomeContainer from '@/pages/HomeContainer';
import AuthRoute from '@/components/AuthRoute';
import Chat from '@/pages/Chat';
import Setting from '@/pages/Setting';

const router = createBrowserRouter([
  {
    index: true,
    element: <Login />,
  },
  {
    path: '/home',
    element: (
    // <AuthRoute>
      <HomeContainer />
    // </AuthRoute>
    ),
    children: [
      {
        path: 'chat',
        element: <Chat />
      },
      {
        path: 'setting',
        element: <Setting />
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;