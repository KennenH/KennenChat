import { createBrowserRouter } from 'react-router-dom';

import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Board from '../pages/Board';

const router = createBrowserRouter([
  {
    index: true,
    element: <Login />,
  },
  {
    path: '/layout',
    element: <Board />,
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;