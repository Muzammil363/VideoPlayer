import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminFetch } from '../../Utils/adminApi';
import { formatNumber } from '../../Utils/adminFormat';
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeader, Panel, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const AdminOverview = () => {
  const [overview, setOverview] = useState(null);
  const [failedVideos, setFailedVideos] = useState([]);
  const [failedJobs, setFailedJobs] = useState([]);
  const [failedSessions, setFailedSessions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewData, videosData, jobsData, sessionsData] = await Promise.all([
          adminFetch('/admin/overview'),
          adminFetch('/admin/videos?status=failed&limit=5'),
          adminFetch('/admin/jobs?state=failed&limit=5'),
          adminFetch('/admin/upload-sessions?status=failed&limit=5'),
        ]);

        setOverview(overviewData);
        setFailedVideos(videosData.items || []);
        setFailedJobs(jobsData.items || []);
        setFailedSessions(sessionsData.items || []);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const videoStatus = overview?.videos?.byStatus || {};
  const queue = overview?.queue || {};

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Operations"
        title="Pipeline Overview"
        description="A compact view of users, uploads, transcoding jobs, and failure signals."
      />

      <div className={styles.metricGrid}>
        <MetricCard label="Users" value={formatNumber(overview.users.total)} />
        <MetricCard label="Videos" value={formatNumber(overview.videos.total)} />
        <MetricCard label="Total Views" value={formatNumber(overview.videos.totalViews)} />
        <MetricCard label="Total Likes" value={formatNumber(overview.videos.totalLikes)} />
      </div>

      <div className={styles.metricGrid}>
        {['queued', 'processing', 'ready', 'failed'].map((status) => (
          <MetricCard
            key={status}
            label={`${status.charAt(0).toUpperCase()}${status.slice(1)} videos`}
            value={formatNumber(videoStatus[status] || 0)}
            tone={status}
          />
        ))}
      </div>

      <Panel title="Queue Health">
        <div className={styles.queueStrip}>
          {['waiting', 'active', 'failed', 'delayed', 'completed'].map((key) => (
            <div key={key} className={styles.queueItem}>
              <span>{key}</span>
              <strong>{formatNumber(queue[key] || 0)}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recent Problems">
        {failedVideos.length === 0 && failedJobs.length === 0 && failedSessions.length === 0 ? (
          <EmptyState message="No failed videos, jobs, or upload sessions right now." />
        ) : (
          <div className={styles.problemGrid}>
            {failedVideos.map((video) => (
              <Link key={video._id} to={`/admin/videos/${video._id}`} className={styles.problemItem}>
                <StatusBadge status={video.status} />
                <span>{video.title}</span>
              </Link>
            ))}
            {failedJobs.map((job) => (
              <Link key={job.id} to="/admin/jobs" className={styles.problemItem}>
                <StatusBadge status="failed" />
                <span>Job {job.id}</span>
              </Link>
            ))}
            {failedSessions.map((session) => (
              <Link key={session._id} to="/admin/uploads" className={styles.problemItem}>
                <StatusBadge status={session.status} />
                <span>{session.user?.email || session.idempotencyKey}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default AdminOverview;
