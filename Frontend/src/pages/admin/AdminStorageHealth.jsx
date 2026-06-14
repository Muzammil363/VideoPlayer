import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../Utils/adminApi';
import { formatNumber } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, MetricCard, PageHeader, Panel } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const AdminStorageHealth = () => {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminFetch('/admin/storage/health')
      .then(setHealth)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="Storage" title="Storage Health" description="DB-level checks for stale uploads and missing storage references." />
      <div className={styles.metricGrid}>
        <MetricCard label="Failed upload sessions" value={formatNumber(health.failedUploadSessions)} tone="failed" />
        <MetricCard label="Stale raw uploads" value={formatNumber(health.staleRawUploads)} />
        <MetricCard label="Ready missing processed prefix" value={formatNumber(health.readyMissingProcessedPrefix)} />
        <MetricCard label="Videos missing thumbnail key" value={formatNumber(health.videosMissingThumbnailKey)} />
        <MetricCard label="Failed videos" value={formatNumber(health.failedVideos)} tone="failed" />
      </div>
      <Panel title="Scope">
        <p className={styles.note}>{health.note}</p>
      </Panel>
    </div>
  );
};

export default AdminStorageHealth;
