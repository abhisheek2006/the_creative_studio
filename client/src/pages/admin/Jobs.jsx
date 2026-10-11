import { useEffect, useRef, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatDate, titleCase } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconSearch, IconEdit, IconTrash, IconCheck } from '../../components/Icons';

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'other'];
const STATUSES = ['draft', 'published', 'closed', 'archived'];

const EMPTY = {
  title: '', employer: '', description: '', eligibility: '', location: '',
  employmentType: 'full_time', salaryInformation: '', applicationDeadline: '',
  applicationUrl: '', contactInformation: '', isVerified: false, status: 'draft',
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function AdminJobs() {
  const toast = useToast();
  const confirm = useConfirm();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const debounce = useRef();

  const load = () => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (search) params.search = search;
    if (status) params.status = status;
    api
      .get('/admin/jobs', { params })
      .then((res) => {
        setJobs(res.data.data.jobs);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setPage(1), 400);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditing('new');
    setForm({ ...EMPTY });
  };

  const openEdit = (job) => {
    setEditing(job._id);
    setForm({
      title: job.title || '',
      employer: job.employer || '',
      description: job.description || '',
      eligibility: job.eligibility || '',
      location: job.location || '',
      employmentType: job.employmentType || 'full_time',
      salaryInformation: job.salaryInformation || '',
      applicationDeadline: toDateInput(job.applicationDeadline),
      applicationUrl: job.applicationUrl || '',
      contactInformation: job.contactInformation || '',
      isVerified: Boolean(job.isVerified),
      status: job.status || 'draft',
    });
  };

  const close = () => {
    setEditing(null);
    setForm({ ...EMPTY });
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) return toast.error('Job title is required.');
    if (form.employer.trim().length < 2) return toast.error('Employer is required.');
    if (form.location.trim().length < 2) return toast.error('Location is required.');
    if (form.description.trim().length < 20) return toast.error('Please add a fuller description (20+ characters).');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        employer: form.employer.trim(),
        description: form.description.trim(),
        eligibility: form.eligibility.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        salaryInformation: form.salaryInformation.trim(),
        applicationDeadline: form.applicationDeadline || null,
        applicationUrl: form.applicationUrl.trim(),
        contactInformation: form.contactInformation.trim(),
        isVerified: form.isVerified,
        status: form.status,
      };
      if (editing === 'new') {
        await api.post('/admin/jobs', payload);
        toast.success('Job listing created.');
      } else {
        await api.patch(`/admin/jobs/${editing}`, payload);
        toast.success('Job listing updated.');
      }
      close();
      load();
    } catch (err) {
      toast.error(extractError(err, 'Could not save the listing.'));
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (job, patch) => {
    try {
      await api.patch(`/admin/jobs/${job._id}`, {
        title: job.title,
        employer: job.employer,
        description: job.description,
        location: job.location,
        ...patch,
      });
      toast.success('Listing updated.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (job) => {
    const ok = await confirm({
      title: `Delete "${job.title}"?`,
      message: 'This listing will be permanently removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/jobs/${job._id}`);
      toast.success('Listing deleted.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Recruitment listings</h1>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          + Add job listing
        </button>
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ minWidth: 220 }}>
              <IconSearch />
              <input type="search" placeholder="Title, employer, location…" value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <select className="select-sort" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : jobs.length === 0 ? (
          <EmptyState
            emoji="📋"
            title="No job listings"
            text="Only add real, verified opportunities. They are hidden from the public site until verified and published."
            action={
              <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openNew}>
                + Add job listing
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Employer</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <strong>{job.title}</strong>
                    </td>
                    <td>{job.employer}</td>
                    <td>{job.location}</td>
                    <td className="small">{titleCase(job.employmentType)}</td>
                    <td className="small">{job.applicationDeadline ? formatDate(job.applicationDeadline) : '—'}</td>
                    <td>
                      <StatusPill status={job.status} />
                    </td>
                    <td>
                      {job.isVerified ? (
                        <span className="verified-tag">
                          <IconCheck width="13" height="13" /> Yes
                        </span>
                      ) : (
                        <span className="small muted">No</span>
                      )}
                    </td>
                    <td>
                      <div className="action-row">
                        <button type="button" className="icon-action" title="Edit" onClick={() => openEdit(job)}>
                          <IconEdit />
                        </button>
                        {job.isVerified && job.status === 'published' ? (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => quickToggle(job, { status: 'closed' })}>
                            Close
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => quickToggle(job, { isVerified: true, status: 'published' })}
                          >
                            Verify & publish
                          </button>
                        )}
                        <button type="button" className="icon-action danger" title="Delete" onClick={() => remove(job)}>
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <div style={{ padding: '1rem' }}>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" style={{ maxWidth: 660 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing === 'new' ? 'Add job listing' : 'Edit job listing'}</h3>
              <button type="button" className="modal-close" onClick={close} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={save} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
              <div className="form-row">
                <div className="field">
                  <label>Job title <span className="req">*</span></label>
                  <input value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div className="field">
                  <label>Employer <span className="req">*</span></label>
                  <input value={form.employer} onChange={(e) => set('employer', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Location <span className="req">*</span></label>
                  <input value={form.location} onChange={(e) => set('location', e.target.value)} />
                </div>
                <div className="field">
                  <label>Employment type</label>
                  <select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {titleCase(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Description <span className="req">*</span></label>
                <textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="field">
                <label>Eligibility</label>
                <textarea rows={3} value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Salary information</label>
                  <input value={form.salaryInformation} onChange={(e) => set('salaryInformation', e.target.value)} />
                </div>
                <div className="field">
                  <label>Application deadline</label>
                  <input type="date" value={form.applicationDeadline} onChange={(e) => set('applicationDeadline', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Application URL</label>
                <input value={form.applicationUrl} onChange={(e) => set('applicationUrl', e.target.value)} placeholder="https://…" />
              </div>
              <div className="field">
                <label>Contact information</label>
                <input value={form.contactInformation} onChange={(e) => set('contactInformation', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <div className="field-check" style={{ marginTop: '1.6rem' }}>
                    <input id="j-verified" type="checkbox" checked={form.isVerified} onChange={(e) => set('isVerified', e.target.checked)} />
                    <label htmlFor="j-verified" style={{ margin: 0 }}>Verified listing</label>
                  </div>
                </div>
              </div>

              <div className="confirm-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner" />} Save listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}