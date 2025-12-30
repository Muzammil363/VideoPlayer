import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createBrowserRouter ,RouterProvider } from 'react-router-dom'

import Home from './pages/Home'
import MyChannelPage from './pages/MyChannel.jsx'
import LibraryPage from './pages/Library.jsx'
import HistoryPage from './pages/History.jsx'
import ProfilePage from './pages/Profile.jsx'
import AuthPage from './pages/Auth.jsx'
import VideoPlayerPage from './pages/VideoPlayer.jsx'


function App() {
  const [count, setCount] = useState(0)

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path:"/auth",
      element: <AuthPage />
    },
    {
      path:'/video/:videoId',
      element:<VideoPlayerPage />
    },
    {
      path:"/u",
      children:[
        {
          path:"myChannel",
          element: <MyChannelPage />
        },
        {
          path:"library",
          element: <LibraryPage />
        },
        {
          path:"history",
          element: <HistoryPage />
        },
        {
          path:'profile',
          element:<ProfilePage />
        }
      ]
    }

  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
