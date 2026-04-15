import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createBrowserRouter ,RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import RootLayout from './Components/RootLayout/RootLayout.jsx'

import Home from './pages/Home'
import MyChannelPage from './pages/MyChannel.jsx'
import LibraryPage from './pages/Library.jsx'
import HistoryPage from './pages/History.jsx'
import ProfilePage from './pages/Profile.jsx'
import AuthPage from './pages/Auth.jsx'
import VideoPlayerPage from './pages/VideoPlayer.jsx'
import SearchPage from './pages/SearchPage.jsx'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'video/:videoId', element: <VideoPlayerPage /> },
        { path: 'search/:searchQuery', element: <SearchPage /> },
        {
          path: 'u',
          children: [
            { path: 'myChannel', element: <MyChannelPage /> },
            { path: 'library', element: <LibraryPage /> },
            { path: 'history', element: <HistoryPage /> },
            { path: 'profile', element: <ProfilePage /> }
          ]
        }
      ]
    },
    {
      path: '/auth',
      element: <AuthPage />
    }
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  )
}

export default App
