import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminFetch } from '../../Utils/adminApi';
import { formatBytes, formatDateTime, formatNumber, truncateMiddle } from '../../Utils/adminFormat';
import { ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from '../../Components/Admin/AdminShared';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';
import styles from '../../styles/Admin.module.css';

const AdminVideoDetail = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    adminFetch(`/admin/videos/${videoId}`)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [videoId]);

  const deleteVideo = async () => {
    setIsDeleting(true);
    try {
      await adminFetch(`/admin/videos/${videoId}`, { method: 'DELETE' });
      toast.success('Video deleted');
      navigate('/admin/videos');
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const { video, engagement, job } = data;

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="Video Detail"
        title={video.title}
        description={video.description || 'No description'}
        actions={(
          <>
            <Link className={styles.secondaryButton} to="/admin/videos">Back</Link>
            <button className={styles.dangerButton} type="button" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>Delete</button>
          </>
        )}
      />

      <div className={styles.twoColumn}>
        <Panel title="Metadata">
          <div className={styles.detailGrid}>
            <div><span>Status</span><strong><StatusBadge status={video.status} /></strong></div>
            <div><span>Views</span><strong>{formatNumber(video.views)}</strong></div>
            <div><span>Likes</span><strong>{formatNumber(video.likesCount)}</strong></div>
            <div><span>Size</span><strong>{formatBytes(video.size)}</strong></div>
            <div><span>Uploaded</span><strong>{formatDateTime(video.uploadTime)}</strong></div>
            <div><span>Mime type</span><strong>{video.mimeType || '-'}</strong></div>
          </div>
        </Panel>
        <Panel title="Owner and Engagement">
          <div className={styles.detailGrid}>
            <div><span>Owner</span><strong>{video.uploadedBy?.username || '-'}</strong></div>
            <div><span>Email</span><strong>{video.uploadedBy?.email || '-'}</strong></div>
            <div><span>Channel</span><strong>{video.channel?.name || '-'}</strong></div>
            <div><span>History rows</span><strong>{formatNumber(engagement.historyCount)}</strong></div>
            <div><span>Liked rows</span><strong>{formatNumber(engagement.likedCount)}</strong></div>
            <div><span>Saved rows</span><strong>{formatNumber(engagement.watchLaterCount)}</strong></div>
          </div>
        </Panel>
      </div>

      <Panel title="S3 and Pipeline Debug">
        <div className={styles.debugGrid}>
          <div><span>Raw key</span><code>{truncateMiddle(video.rawS3Key, 60)}</code></div>
          <div><span>Thumbnail key</span><code>{truncateMiddle(video.thumbnailS3Key, 60)}</code></div>
          <div><span>Processed prefix</span><code>{truncateMiddle(video.processedS3Prefix, 60)}</code></div>
          <div><span>Transcode job</span><code>{video.transcodeJobId || '-'}</code></div>
          <div><span>Upload session</span><code>{video.uploadSessionId?._id || video.uploadSessionId || '-'}</code></div>
          <div><span>Processing error</span><code>{video.processingError || '-'}</code></div>
        </div>
      </Panel>

      <Panel title="Processing Timeline">
        <div className={styles.timeline}>
          <div><span>Uploaded</span><strong>{formatDateTime(video.uploadTime)}</strong></div>
          <div><span>Started</span><strong>{formatDateTime(video.processingStartedAt)}</strong></div>
          <div><span>Completed</span><strong>{formatDateTime(video.processingCompletedAt)}</strong></div>
          <div><span>Failed</span><strong>{formatDateTime(video.processingFailedAt)}</strong></div>
        </div>
      </Panel>

      {job && (
        <Panel title="BullMQ Job">
          <div className={styles.detailGrid}>
            <div><span>Job id</span><strong>{job.id}</strong></div>
            <div><span>State</span><strong><StatusBadge status={job.state} /></strong></div>
            <div><span>Attempts</span><strong>{job.attemptsMade}</strong></div>
            <div><span>Reason</span><strong>{job.failedReason || '-'}</strong></div>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete video?"
        message="This permanently removes the video record and storage objects using the admin cleanup path."
        confirmLabel="Delete"
        danger
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={deleteVideo}
      />
    </div>
  );
};

export default AdminVideoDetail;
