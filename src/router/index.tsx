import { createBrowserRouter } from 'react-router-dom';

import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import HomeContainer from '@/pages/HomeContainer';
import AuthRoute from '@/components/AuthRoute';
import Chat from '@/pages/Chat';
import Setting from '@/pages/Setting';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
    // <AuthRoute>
      <HomeContainer />
    // </AuthRoute>
    ),
    children: [
      {
        index: true,
        element: <Chat />
      },
      {
        path: 'setting',
        element: <Setting />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ],
  },
]);

export default router;