import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { formatDate, titleCase } from '../utils/format';
import { PageLoader, EmptyState } from '../components/Loader';
import Seo from '../components/Seo';
import { Squiggle } from '../components/Doodles';
import { IconWhatsApp, IconCheck } from '../components/Icons';
import { whatsappLink } from '../utils/whatsapp';

export default function JobDetails() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/jobs/${slug}`)
      .then((res) => active && setJob(res.data.data.job))
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <PageLoader full />;
  if (notFound || !job) {
    return (
      <div className="container">
        <EmptyState
          emoji="🗂️"
          title="Listing not found"
          text="This job listing may have been closed or removed."
          action={
            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Back to jobs
            </Link>
          }
        />
      </div>
    );
  }

  const whatsapp = String(settings?.whatsappNumber || '919679573542').replace(/\D/g, '');
  const message = `Hello The Creative Studio! I am interested in the job "${job.title}" at ${job.employer}. Could you please share the application details?`;

  const jobJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || undefined,
    datePosted: job.createdAt || undefined,
    employmentType: job.employmentType || undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.employer || 'The Creative Studio',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || undefined,
        addressCountry: 'IN',
      },
    },
  };

  return (
    <div className="container">
      <Seo
        title={`${job.title}${job.location ? ` — ${job.location}` : ''}`}
        description={
          job.eligibility ||
          job.description ||
          `Verified job opportunity${job.employer ? ` at ${job.employer}` : ''} shared by The Creative Studio.`
        }
        type="article"
        path={`/jobs/${job.slug}`}
        jsonLd={jobJsonLd}
      />
      <div className="page-head" style={{ textAlign: 'left' }}>
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <Link to="/jobs">Jobs</Link> / {job.title}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)' }}>{job.title}</h1>
        <Squiggle color="#A9DCC7" className="squiggle" />
        <div className="job-meta" style={{ marginTop: '0.6rem' }}>
          <span className="verified-tag">
            <IconCheck width="14" height="14" /> Verified listing
          </span>
          <span className="badge sky">📍 {job.location}</span>
          <span className="badge lavender">{titleCase(job.employmentType)}</span>
          {job.salaryInformation && <span className="badge yellow">{job.salaryInformation}</span>}
        </div>
        <p className="muted" style={{ marginTop: '0.4rem' }}>
          Employer: <strong>{job.employer}</strong>
        </p>
      </div>

      <div className="checkout-grid">
        <div className="form-card">
          <h3 style={{ color: 'var(--forest)' }}>Job description</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{job.description}</p>
          {job.eligibility && (
            <>
              <h3 style={{ color: 'var(--forest)', marginTop: '1.2rem' }}>Eligibility</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{job.eligibility}</p>
            </>
          )}
        </div>

        <aside>
          <div className="summary-card" style={{ position: 'static' }}>
            <h3>How to apply</h3>
            {job.applicationDeadline && (
              <div className="deadline" style={{ marginBottom: '0.8rem' }}>
                Applications close {formatDate(job.applicationDeadline)}
              </div>
            )}
            {job.applicationUrl ? (
              <a className="btn btn-primary btn-lg btn-block" href={job.applicationUrl} target="_blank" rel="noreferrer noopener">
                Apply Now
              </a>
            ) : (
              <p className="muted small">No online application link was provided for this listing.</p>
            )}
            <a
              className="btn btn-whatsapp btn-block"
              style={{ marginTop: '0.8rem' }}
              href={whatsappLink(whatsapp, message)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <IconWhatsApp width="18" height="18" /> Contact via WhatsApp
            </a>
            {job.contactInformation && (
              <p className="small muted" style={{ marginTop: '0.8rem' }}>{job.contactInformation}</p>
            )}
            <p className="small muted" style={{ marginTop: '0.8rem' }}>
              The Creative Studio shares verified listings only. We do not guarantee employment and never ask
              candidates for money.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}