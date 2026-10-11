const JobListing = require('../models/JobListing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { escapeRegex } = require('../utils/sanitize');

const PUBLIC_JOB = (j) => ({
  id: j._id,
  title: j.title,
  slug: j.slug,
  employer: j.employer,
  description: j.description,
  eligibility: j.eligibility,
  location: j.location,
  employmentType: j.employmentType,
  salaryInformation: j.salaryInformation,
  applicationDeadline: j.applicationDeadline,
  applicationUrl: j.applicationUrl,
  contactInformation: j.contactInformation,
  createdAt: j.createdAt,
});

exports.listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 10, maxLimit: 40 });
  const { search, location, employmentType } = req.query;

  const filter = { status: 'published', isVerified: true };
  const clauses = [];

  if (search) {
    const term = escapeRegex(search.trim());
    clauses.push({
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { employer: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ],
    });
  }
  if (location) clauses.push({ location: { $regex: escapeRegex(String(location).trim()), $options: 'i' } });
  if (employmentType && employmentType !== 'all') clauses.push({ employmentType });
  clauses.push({ $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: new Date() } }] });
  if (clauses.length) filter.$and = clauses;

  const [jobs, total] = await Promise.all([
    JobListing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobListing.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    jobs: jobs.map(PUBLIC_JOB),
    pagination: buildPaginated(jobs, total, page, limit).pagination,
  });
});

exports.getJobBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const job = await JobListing.findOne({ slug, status: 'published', isVerified: true }).lean();
  if (!job) throw ApiError.notFound('Job listing not found.');
  return sendSuccess(res, { job: PUBLIC_JOB(job) });
});