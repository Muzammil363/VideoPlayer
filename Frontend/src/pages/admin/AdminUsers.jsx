import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch, buildQuery } from '../../Utils/adminApi';
import { formatDateTime, formatNumber } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, PageHeader, Pagination, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        setResult(await adminFetch(`/admin/users${buildQuery({ page, limit: 20, search })}`));
        setError(null);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, search]);

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="Directory" title="Users" description="Inspect accounts, channels, and uploaded video footprint." />
      <div className={styles.filterBar}>
        <input className={styles.input} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search users..." />
      </div>
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Channel</th>
                  <th>Videos</th>
                  <th>Total views</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(result?.items || []).map((user) => (
                  <tr key={user._id} onClick={() => navigate(`/admin/users/${user._id}`)}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td><StatusBadge status={user.role} /></td>
                    <td>{user.channel?.name || '-'}</td>
                    <td>{formatNumber(user.videoCount)}</td>
                    <td>{formatNumber(user.totalViews)}</td>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={result?.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AdminUsers;
