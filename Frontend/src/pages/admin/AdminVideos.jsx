import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch, buildQuery } from '../../Utils/adminApi';
import { formatBytes, formatDateTime, formatNumber } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, PageHeader, Pagination, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const statuses = ['', 'queued', 'processing', 'ready', 'failed', 'deleting'];

const AdminVideos = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        setResult(await adminFetch(`/admin/videos${buildQuery({ page, limit: 20, status, search })}`));
        setError(null);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, search, status]);

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="Catalog" title="Videos" description="Monitor video state, ownership, engagement, and storage references." />
      <div className={styles.filterBar}>
        <input className={styles.input} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search videos..." />
        <select className={styles.select} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {statuses.map((item) => <option key={item || 'all'} value={item}>{item || 'All statuses'}</option>)}
        </select>
      </div>
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Title</th><th>Owner</th><th>Status</th><th>Views</th><th>Likes</th><th>Size</th><th>Uploaded</th></tr></thead>
              <tbody>
                {(result?.items || []).map((video) => (
                  <tr key={video._id} onClick={() => navigate(`/admin/videos/${video._id}`)}>
                    <td>{video.title}</td>
                    <td>{video.uploadedBy?.username || '-'}</td>
                    <td><StatusBadge status={video.status} /></td>
                    <td>{formatNumber(video.views)}</td>
                    <td>{formatNumber(video.likesCount)}</td>
                    <td>{formatBytes(video.size)}</td>
                    <td>{formatDateTime(video.uploadTime)}</td>
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

export default AdminVideos;
