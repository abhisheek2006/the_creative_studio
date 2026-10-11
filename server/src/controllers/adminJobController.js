const JobListing = require('../models/JobListing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { escapeRegex } = require('../utils/sanitize');
const slugify = require('slugify');

exports.listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 15, maxLimit: 100 });
  const { search, status, employmentType } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (employmentType && employmentType !== 'all') filter.employmentType = employmentType;
  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { title: { $regex: term, $options: 'i' } },
      { employer: { $regex: term, $options: 'i' } },
      { location: { $regex: term, $options: 'i' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    JobListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    JobListing.countDocuments(filter),
  ]);

  return sendSuccess(res, { jobs, pagination: buildPaginated(jobs, total, page, limit).pagination });
});

exports.getJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id).lean();
  if (!job) throw ApiError.notFound('Job listing not found.');
  return sendSuccess(res, { job });
});

function parseJobBody(body) {
  const data = {};
  const requiredText = (key, min) => {
    const v = String(body[key] || '').trim();
    if (v.length < min) throw ApiError.badRequest(`Please provide a valid ${key}.`);
    return v;
  };

  data.title = requiredText('title', 3).slice(0, 220);
  data.employer = requiredText('employer', 2).slice(0, 220);
  data.description = requiredText('description', 20).slice(0, 12000);
  data.location = requiredText('location', 2).slice(0, 200);

  if (body.eligibility !== undefined) data.eligibility = String(body.eligibility || '').trim().slice(0, 4000);
  if (body.salaryInformation !== undefined) data.salaryInformation = String(body.salaryInformation || '').trim().slice(0, 300);
  if (body.contactInformation !== undefined) data.contactInformation = String(body.contactInformation || '').trim().slice(0, 400);
  if (body.applicationUrl !== undefined) {
    const url = String(body.applicationUrl || '').trim();
    if (url && !/^https?:\/\//i.test(url)) throw ApiError.badRequest('Application URL must start with http(s).');
    data.applicationUrl = url.slice(0, 600);
  }

  const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'other'];
  if (body.employmentType !== undefined) {
    if (!EMPLOYMENT_TYPES.includes(String(body.employmentType))) throw ApiError.badRequest('Invalid employment type.');
    data.employmentType = body.employmentType;
  }

  if (body.applicationDeadline !== undefined) {
    if (body.applicationDeadline === null || body.applicationDeadline === '') data.applicationDeadline = null;
    else {
      const d = new Date(body.applicationDeadline);
      if (Number.isNaN(d.getTime())) throw ApiError.badRequest('Invalid application deadline.');
      data.applicationDeadline = d;
    }
  }

  if (body.isVerified !== undefined) data.isVerified = Boolean(body.isVerified);
  if (body.status !== undefined) {
    if (!['draft', 'published', 'closed', 'archived'].includes(String(body.status))) {
      throw ApiError.badRequest('Invalid status.');
    }
    data.status = body.status;
  }
  return data;
}

function buildJobSlug(title, employer) {
  const base = slugify(`${title}-${employer}`, { lower: true, strict: true });
  return base || slugify(title, { lower: true, strict: true });
}

async function uniqueSlot(title, employer, excludeId) {
  const base = buildJobSlug(title, employer);
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const clash = await JobListing.findOne(q).select('_id').lean();
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

exports.createJob = asyncHandler(async (req, res) => {
  const data = parseJobBody(req.body || {});
  data.slug = await uniqueSlot(data.title, data.employer);
  if (data.isVerified && data.status !== 'archived') data.status = data.status || 'published';
  const job = await JobListing.create(data);
  return sendSuccess(res, { job }, 201, 'Job listing created.');
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found.');

  const data = parseJobBody(req.body || {});
  if (data.title && data.title !== job.title) {
    data.slug = await uniqueSlot(data.title, (data.employer || job.employer), job._id);
  }
  if (data.employer && data.employer !== job.employer && !data.slug) {
    data.slug = await uniqueSlot(job.title, data.employer, job._id);
  }

  Object.assign(job, data);
  await job.save();
  return sendSuccess(res, { job }, 200, 'Job listing updated.');
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findByIdAndDelete(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found.');
  return sendSuccess(res, null, 200, 'Job listing deleted.');
});