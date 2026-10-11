import { titleCase } from '../utils/format';

const LABELS = {
  pending_confirmation: 'Pending confirmation',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_dispatch: 'Ready for dispatch',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  in_review: 'In review',
  quoted: 'Quoted',
  in_progress: 'In progress',
};

export default function StatusPill({ status }) {
  const key = String(status || '').toLowerCase();
  return <span className={`status-pill ${key}`}>{LABELS[key] || titleCase(status)}</span>;
}