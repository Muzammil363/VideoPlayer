import React from 'react';
import styles from '../../styles/Admin.module.css';

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className={styles.pageHeader}>
    <div>
      {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className={styles.headerActions}>{actions}</div>}
  </div>
);

export const MetricCard = ({ label, value, hint, tone = 'default' }) => (
  <div className={`${styles.metricCard} ${styles[`metric_${tone}`] || ''}`}>
    <div className={styles.metricLabel}>{label}</div>
    <div className={styles.metricValue}>{value}</div>
    {hint && <div className={styles.metricHint}>{hint}</div>}
  </div>
);

export const StatusBadge = ({ status }) => (
  <span className={`${styles.statusBadge} ${styles[`status_${status}`] || ''}`}>
    {status || 'unknown'}
  </span>
);

export const Panel = ({ title, actions, children }) => (
  <section className={styles.panel}>
    {(title || actions) && (
      <div className={styles.panelHeader}>
        {title && <h2>{title}</h2>}
        {actions && <div className={styles.panelActions}>{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export const LoadingState = () => (
  <div className={styles.stateBox}>Loading admin data...</div>
);

export const EmptyState = ({ message = 'No records found.' }) => (
  <div className={styles.stateBox}>{message}</div>
);

export const ErrorState = ({ error }) => (
  <div className={`${styles.stateBox} ${styles.errorBox}`}>{error?.message || 'Something went wrong.'}</div>
);

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination) return null;

  return (
    <div className={styles.pagination}>
      <span>
        Page {pagination.page} of {Math.max(1, pagination.totalPages || 1)}
      </span>
      <div className={styles.paginationActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!pagination.hasNext}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
