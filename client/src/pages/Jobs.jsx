import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate, titleCase } from '../utils/format';
import Pagination from '../components/Pagination';
import Seo from '../components/Seo';
import { PageLoader, EmptyState } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import { IconSearch, IconCheck } from '../components/Icons';

const TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'other', label: 'Other' },
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const debounce = useRef();

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { page, limit: 8 };
    if (search) params.search = search;
    if (location) params.location = location;
    if (type && type !== 'all') params.employmentType = type;

    api
      .get('/jobs', { params })
      .then((res) => {
        if (!active) return;
        setJobs(res.data.data.jobs);
        setPagination(res.data.data.pagination);
      })
      .catch(() => active && setJobs([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search, location, type]);

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
    }, 400);
  };

  return (
    <div className="container">
      <Seo
        title="Islander Job Opportunities"
        description="Browse verified job listings for islanders — full-time, part-time, contract and internship opportunities shared by employers."
        path="/jobs"
      />
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          online recruitment for islanders
        </span>
        <h1>Job Opportunities</h1>
        <Squiggle color="#A9DCC7" />
        <p>
          Verified opportunities shared by employers. Only listings confirmed by our team are shown — there is
          no guarantee of employment.
        </p>
      </div>

      <div className="shop-toolbar">
        <div className="search-box">
          <IconSearch />
          <input
            type="search"
            placeholder="Search job title or employer…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            className="select-sort"
            style={{ minWidth: 150 }}
            placeholder="Location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by location"
          />
          <select
            className="select-sort"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by employment type"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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
          title="No job listings right now"
          text="New verified opportunities will appear here as they are published. Please check back soon."
        />
      ) : (
        <>
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="flex-btw">
                <div>
                  <h2>{job.title}</h2>
                  <div className="employer">{job.employer}</div>
                </div>
                {job.salaryInformation && <span className="badge yellow">{job.salaryInformation}</span>}
              </div>
              <div className="job-meta">
                <span className="verified-tag">
                  <IconCheck width="14" height="14" /> Verified
                </span>
                <span className="badge sky">📍 {job.location}</span>
                <span className="badge lavender">{titleCase(job.employmentType)}</span>
                {job.applicationDeadline && (
                  <span className="deadline">Apply by {formatDate(job.applicationDeadline)}</span>
                )}
              </div>
              <p className="muted" style={{ margin: '0.4rem 0' }}>
                {job.description.length > 200 ? `${job.description.slice(0, 200)}…` : job.description}
              </p>
              <Link to={`/jobs/${job.slug}`} className="btn btn-primary btn-sm">
                View details
              </Link>
            </article>
          ))}

          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </>
      )}
    </div>
  );
}