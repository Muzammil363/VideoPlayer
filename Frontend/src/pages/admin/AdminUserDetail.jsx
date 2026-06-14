import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminFetch } from '../../Utils/adminApi';
import { formatDateTime, formatNumber } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, MetricCard, PageHeader, Panel, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const AdminUserDetail = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/admin/users/${userId}`)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const counts = Object.fromEntries((data.statusBreakdown || []).map((item) => [item._id, item.count]));

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="User Detail" title={data.user.username} description={data.user.email} actions={<Link className={styles.secondaryButton} to="/admin/users">Back</Link>} />
      <div className={styles.metricGrid}>
        <MetricCard label="Role" value={data.user.role} />
        <MetricCard label="Videos" value={formatNumber(data.videos.length)} />
        <MetricCard label="Ready" value={formatNumber(counts.ready || 0)} />
        <MetricCard label="Failed" value={formatNumber(counts.failed || 0)} tone="failed" />
      </div>
      <Panel title="Account and Channel">
        <div className={styles.detailGrid}>
          <div><span>Joined</span><strong>{formatDateTime(data.user.createdAt)}</strong></div>
          <div><span>Channel</span><strong>{data.channel?.name || '-'}</strong></div>
          <div><span>Description</span><strong>{data.channel?.description || '-'}</strong></div>
        </div>
      </Panel>
      <Panel title="Uploaded Videos">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Title</th><th>Status</th><th>Views</th><th>Likes</th><th>Uploaded</th></tr></thead>
            <tbody>
              {data.videos.map((video) => (
                <tr key={video._id}>
                  <td><Link to={`/admin/videos/${video._id}`}>{video.title}</Link></td>
                  <td><StatusBadge status={video.status} /></td>
                  <td>{formatNumber(video.views)}</td>
                  <td>{formatNumber(video.likesCount)}</td>
                  <td>{formatDateTime(video.uploadTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default AdminUserDetail;
