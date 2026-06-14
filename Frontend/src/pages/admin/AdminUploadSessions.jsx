import React, { useEffect, useState } from 'react';
import { adminFetch, buildQuery } from '../../Utils/adminApi';
import { formatDateTime, truncateMiddle } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, PageHeader, Pagination, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const statuses = ['', 'initiated', 'uploading', 'finalizing', 'completed', 'failed', 'aborted'];

const AdminUploadSessions = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setResult(await adminFetch(`/admin/upload-sessions${buildQuery({ status, page, limit: 20 })}`));
        setError(null);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [status, page]);

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="Uploads" title="Upload Sessions" description="Inspect idempotent upload attempts and linked video jobs." />
      <div className={styles.filterBar}>
        <select className={styles.select} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          {statuses.map((item) => <option key={item || 'all'} value={item}>{item || 'All statuses'}</option>)}
        </select>
      </div>
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>User</th><th>Status</th><th>Video key</th><th>Thumbnail key</th><th>Upload id</th><th>Video</th><th>Created</th><th>Expires</th></tr></thead>
              <tbody>
                {(result?.items || []).map((session) => (
                  <tr key={session._id}>
                    <td>{session.user?.email || '-'}</td>
                    <td><StatusBadge status={session.status} /></td>
                    <td title={session.videoKey}><code>{truncateMiddle(session.videoKey)}</code></td>
                    <td title={session.thumbnailKey}><code>{truncateMiddle(session.thumbnailKey)}</code></td>
                    <td title={session.s3MultipartUploadId}><code>{truncateMiddle(session.s3MultipartUploadId)}</code></td>
                    <td>{session.videoId?.title || session.videoId?._id || '-'}</td>
                    <td>{formatDateTime(session.createdAt)}</td>
                    <td>{formatDateTime(session.expiresAt)}</td>
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

export default AdminUploadSessions;
