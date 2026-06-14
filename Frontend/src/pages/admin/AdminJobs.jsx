import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminFetch, buildQuery } from '../../Utils/adminApi';
import { formatDateTime, formatNumber, truncateMiddle } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, MetricCard, PageHeader, Pagination, StatusBadge } from '../../Components/Admin/AdminShared';
import styles from '../../styles/Admin.module.css';

const states = ['waiting', 'active', 'failed', 'completed', 'delayed'];

const AdminJobs = () => {
  const [summary, setSummary] = useState(null);
  const [state, setState] = useState('failed');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const [summaryData, jobsData] = await Promise.all([
        adminFetch('/admin/jobs/summary'),
        adminFetch(`/admin/jobs${buildQuery({ state, page, limit: 20 })}`),
      ]);
      setSummary(summaryData);
      setResult(jobsData);
      setError(null);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [state, page]);

  const retryJob = async (jobId) => {
    try {
      await adminFetch(`/admin/jobs/${jobId}/retry`, { method: 'POST' });
      toast.success('Retry requested');
      loadJobs();
    } catch (retryError) {
      toast.error(retryError.message);
    }
  };

  return (
    <div className={styles.pageStack}>
      <PageHeader eyebrow="Queue" title="Jobs" description="Inspect BullMQ transcode jobs and retry failures." />
      {summary && (
        <div className={styles.metricGrid}>
          {states.map((item) => (
            <MetricCard key={item} label={item} value={formatNumber(summary.counts?.[item] || 0)} tone={item === 'failed' ? 'failed' : 'default'} />
          ))}
        </div>
      )}
      <div className={styles.segmented}>
        {states.map((item) => (
          <button key={item} type="button" className={state === item ? styles.segmentActive : ''} onClick={() => { setState(item); setPage(1); }}>
            {item}
          </button>
        ))}
      </div>
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Job</th><th>State</th><th>Attempts</th><th>Video</th><th>Reason</th><th>Processed</th><th>Finished</th><th>Action</th></tr></thead>
              <tbody>
                {(result?.items || []).map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td><StatusBadge status={job.state} /></td>
                    <td>{job.attemptsMade}</td>
                    <td>{job.data?.dbVideoId || '-'}</td>
                    <td title={job.failedReason || ''}>{truncateMiddle(job.failedReason, 48)}</td>
                    <td>{formatDateTime(job.processedOn)}</td>
                    <td>{formatDateTime(job.finishedOn)}</td>
                    <td>
                      {job.state === 'failed' ? (
                        <button className={styles.secondaryButton} type="button" onClick={() => retryJob(job.id)}>Retry</button>
                      ) : '-'}
                    </td>
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

export default AdminJobs;
