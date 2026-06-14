import { lazy, Suspense } from 'react'
import './App.css'
import { createBrowserRouter ,RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import RootLayout from './Components/RootLayout/RootLayout.jsx'

import Home from './pages/Home'

const MyChannelPage = lazy(() => import('./pages/MyChannel.jsx'));
const LibraryPage = lazy(() => import('./pages/Library.jsx'));
const HistoryPage = lazy(() => import('./pages/History.jsx'));
const ProfilePage = lazy(() => import('./pages/Profile.jsx'));
const AuthPage = lazy(() => import('./pages/Auth.jsx'));
const VideoPlayerPage = lazy(() => import('./pages/VideoPlayer.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const AdminLayout = lazy(() => import('./Components/Admin/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail.jsx'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos.jsx'));
const AdminVideoDetail = lazy(() => import('./pages/admin/AdminVideoDetail.jsx'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs.jsx'));
const AdminUploadSessions = lazy(() => import('./pages/admin/AdminUploadSessions.jsx'));
const AdminStorageHealth = lazy(() => import('./pages/admin/AdminStorageHealth.jsx'));

const RouteFallback = () => (
  <div style={{
    minHeight: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#606060',
    background: '#f9f9f9',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 600,
  }}>
    Loading...
  </div>
);

const lazyRoute = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'video/:videoId', element: lazyRoute(VideoPlayerPage) },
        { path: 'search/:searchQuery', element: lazyRoute(SearchPage) },
        {
          path: 'u',
          children: [
            { path: 'myChannel', element: lazyRoute(MyChannelPage) },
            { path: 'library', element: lazyRoute(LibraryPage) },
            { path: 'history', element: lazyRoute(HistoryPage) },
            { path: 'profile', element: lazyRoute(ProfilePage) }
          ]
        }
      ]
    },
    {
      path: '/auth',
      element: lazyRoute(AuthPage)
    },
    {
      path: '/admin',
      element: lazyRoute(AdminLayout),
      children: [
        { index: true, element: lazyRoute(AdminOverview) },
        { path: 'users', element: lazyRoute(AdminUsers) },
        { path: 'users/:userId', element: lazyRoute(AdminUserDetail) },
        { path: 'videos', element: lazyRoute(AdminVideos) },
        { path: 'videos/:videoId', element: lazyRoute(AdminVideoDetail) },
        { path: 'jobs', element: lazyRoute(AdminJobs) },
        { path: 'uploads', element: lazyRoute(AdminUploadSessions) },
        { path: 'storage', element: lazyRoute(AdminStorageHealth) }
      ]
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
