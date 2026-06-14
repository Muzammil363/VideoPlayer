import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { adminFetch } from '../../Utils/adminApi';
import AdminRouteGuard from './AdminRouteGuard';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import styles from '../../styles/Admin.module.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    adminFetch('/admin/overview')
      .then(() => setAccessError(null))
      .catch(setAccessError)
      .finally(() => setIsCheckingAccess(false));
  }, []);

  if (isCheckingAccess) {
    return <div className={styles.accessPage}><div className={styles.stateBox}>Checking admin access...</div></div>;
  }

  return (
    <AdminRouteGuard error={accessError}>
    <div className={styles.shell}>
      <div className={`${styles.sidebarWrap} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <AdminSidebar />
      </div>
      {isSidebarOpen && (
        <button
          type="button"
          className={styles.mobileOverlay}
          aria-label="Close admin menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={styles.workspace}>
        <AdminTopBar onMenuClick={() => setIsSidebarOpen((value) => !value)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
    </AdminRouteGuard>
  );
};

export default AdminLayout;
