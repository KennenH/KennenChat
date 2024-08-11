import { createBrowserRouter } from 'react-router-dom';

import NotFound from '@/pages/NotFound';
import HomeContainer from '@/pages/HomeContainer';
import Chat from '@/pages/Window/Chat';
import Setting from '@/pages/Window/Setting';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <HomeContainer />
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