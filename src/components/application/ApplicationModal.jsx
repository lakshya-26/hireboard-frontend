import { useCallback, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { api, getApiErrorMessage } from '../../lib/api';
import { celebrateOffer } from '../../lib/offerConfetti';

const STATUSES = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

const WORK_TYPES = ['Remote', 'Hybrid', 'Onsite'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const selectClass =
  'h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(79_70_229_/_18%)]';

function emptyForm() {
  return {
    companyName: '',
    role: '',
    jobUrl: '',
    status: 'Saved',
    appliedDate: '',
    location: '',
    workType: '',
    priority: 'Medium',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    tags: '',
  };
}

function applicationToForm(app) {
  if (!app) return emptyForm();
  const applied =
    app.appliedDate && !Number.isNaN(new Date(app.appliedDate).getTime())
      ? new Date(app.appliedDate).toISOString().slice(0, 10)
      : '';
  const salary = app.salary || {};
  return {
    companyName: app.companyName || '',
    role: app.role || '',
    jobUrl: app.jobUrl || '',
    status: app.status || 'Saved',
    appliedDate: applied,
    location: app.location || '',
    workType: app.workType || '',
    priority: app.priority || 'Medium',
    salaryMin: salary.min != null ? String(salary.min) : '',
    salaryMax: salary.max != null ? String(salary.max) : '',
    salaryCurrency: salary.currency || 'USD',
    tags: Array.isArray(app.tags) ? app.tags.join(', ') : '',
  };
}

function buildPayload(form) {
  const payload = {
    companyName: form.companyName.trim(),
    role: form.role.trim(),
  };
  if (form.jobUrl.trim()) payload.jobUrl = form.jobUrl.trim();
  if (form.status) payload.status = form.status;
  if (form.appliedDate) payload.appliedDate = form.appliedDate;
  if (form.location.trim()) payload.location = form.location.trim();
  if (form.workType) payload.workType = form.workType;
  if (form.priority) payload.priority = form.priority;

  const tags = form.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length) payload.tags = tags;

  const minRaw = form.salaryMin.trim();
  const maxRaw = form.salaryMax.trim();
  const min = minRaw === '' ? undefined : Number(minRaw);
  const max = maxRaw === '' ? undefined : Number(maxRaw);
  if (
    (min !== undefined && !Number.isNaN(min)) ||
    (max !== undefined && !Number.isNaN(max))
  ) {
    payload.salary = {};
    if (min !== undefined && !Number.isNaN(min)) payload.salary.min = min;
    if (max !== undefined && !Number.isNaN(max)) payload.salary.max = max;
    if (form.salaryCurrency.trim()) payload.salary.currency = form.salaryCurrency.trim();
  }

  return payload;
}

function formatNoteDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function ApplicationModal({
  open,
  mode,
  application,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(applicationToForm(application));
    setFieldErrors({});
    setFormError('');
    setNoteText('');
    setShowDeleteConfirm(false);
  }, [open, mode, application?.id]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validate = useCallback(() => {
    const errors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company name is required';
    if (!form.role.trim()) errors.role = 'Role is required';
    if (form.jobUrl.trim()) {
      try {
        const u = new URL(form.jobUrl.trim());
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          errors.jobUrl = 'Enter a valid http(s) URL or leave blank';
        }
      } catch {
        errors.jobUrl = 'Enter a valid URL or leave blank';
      }
    }
    const minRaw = form.salaryMin.trim();
    const maxRaw = form.salaryMax.trim();
    if (minRaw !== '' && Number.isNaN(Number(minRaw))) errors.salaryMin = 'Must be a number';
    if (maxRaw !== '' && Number.isNaN(Number(maxRaw))) errors.salaryMax = 'Must be a number';
    const min = minRaw === '' ? undefined : Number(minRaw);
    const max = maxRaw === '' ? undefined : Number(maxRaw);
    if (min != null && !Number.isNaN(min) && max != null && !Number.isNaN(max) && min > max) {
      errors.salaryMax = 'Max must be greater than or equal to min';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    const payload = buildPayload(form);
    if (!payload.jobUrl) delete payload.jobUrl;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await api.post('/applications', payload);
        const created = res.data?.data;
        if (created) onCreated?.(created);
        if (created?.status === 'Offer') celebrateOffer();
        onClose();
      } else if (application?.id) {
        const previousStatus = application.status;
        const res = await api.patch(`/applications/${application.id}`, payload);
        const updated = res.data?.data;
        if (updated) onUpdated?.(updated);
        if (updated?.status === 'Offer' && previousStatus !== 'Offer') {
          celebrateOffer();
        }
        onClose();
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    if (!application?.id) return;
    const text = noteText.trim();
    if (!text) {
      setFormError('Note text is required');
      return;
    }
    setFormError('');
    setIsAddingNote(true);
    try {
      const res = await api.post(`/applications/${application.id}/notes`, { text });
      const updated = res.data?.data;
      if (updated) onUpdated?.(updated);
      setNoteText('');
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleDelete() {
    if (!application?.id) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      await api.delete(`/applications/${application.id}`);
      onDeleted?.(application.id);
      onClose();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!open) return null;

  const title = mode === 'create' ? 'Add application' : 'Edit application';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
            <p className="mt-1 text-sm hb-muted">
              {mode === 'create'
                ? 'Track a new role in your pipeline.'
                : 'Update details or add notes below.'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {formError ? <p className="hb-error mb-4">{formError}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="app-company"
            name="companyName"
            label="Company name"
            value={form.companyName}
            onChange={handleChange}
            error={fieldErrors.companyName}
            required
          />
          <Input
            id="app-role"
            name="role"
            label="Role"
            value={form.role}
            onChange={handleChange}
            error={fieldErrors.role}
            required
          />
          <Input
            id="app-joburl"
            name="jobUrl"
            label="Job URL (optional)"
            value={form.jobUrl}
            onChange={handleChange}
            error={fieldErrors.jobUrl}
            placeholder="https://..."
          />

          <div>
            <label className="hb-label" htmlFor="app-status">
              Status
            </label>
            <select
              id="app-status"
              name="status"
              className={selectClass}
              value={form.status}
              onChange={handleChange}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="hb-label" htmlFor="app-applied">
              Applied date
            </label>
            <input
              id="app-applied"
              name="appliedDate"
              type="date"
              className={selectClass}
              value={form.appliedDate}
              onChange={handleChange}
            />
          </div>

          <Input
            id="app-location"
            name="location"
            label="Location (optional)"
            value={form.location}
            onChange={handleChange}
          />

          <div>
            <label className="hb-label" htmlFor="app-worktype">
              Work type
            </label>
            <select
              id="app-worktype"
              name="workType"
              className={selectClass}
              value={form.workType}
              onChange={handleChange}
            >
              <option value="">—</option>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="hb-label" htmlFor="app-priority">
              Priority
            </label>
            <select
              id="app-priority"
              name="priority"
              className={selectClass}
              value={form.priority}
              onChange={handleChange}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="app-salary-min"
              name="salaryMin"
              label="Salary min (optional)"
              value={form.salaryMin}
              onChange={handleChange}
              error={fieldErrors.salaryMin}
              inputMode="decimal"
            />
            <Input
              id="app-salary-max"
              name="salaryMax"
              label="Salary max (optional)"
              value={form.salaryMax}
              onChange={handleChange}
              error={fieldErrors.salaryMax}
              inputMode="decimal"
            />
          </div>
          <Input
            id="app-currency"
            name="salaryCurrency"
            label="Currency"
            value={form.salaryCurrency}
            onChange={handleChange}
            placeholder="USD"
          />

          <Input
            id="app-tags"
            name="tags"
            label="Tags (comma-separated, optional)"
            value={form.tags}
            onChange={handleChange}
            placeholder="e.g. FAANG, referral"
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="sm:flex-1">
              {mode === 'create' ? 'Create application' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="sm:flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>

        {mode === 'edit' && application ? (
          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Notes</h3>
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-gray-50/60 p-3">
              {Array.isArray(application.notes) && application.notes.length ? (
                [...application.notes]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((n) => (
                    <li key={n._id || `${n.text}-${n.createdAt}`} className="text-sm">
                      <p className="font-medium text-[var(--color-text-primary)]">{n.text}</p>
                      <p className="text-xs hb-muted">{formatNoteDate(n.createdAt)}</p>
                    </li>
                  ))
              ) : (
                <li className="text-sm hb-muted">No notes yet.</li>
              )}
            </ul>
            <form onSubmit={handleAddNote} className="mt-3 space-y-2">
              <Input
                id="app-note"
                label="Add a note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Follow-up sent, recruiter name..."
              />
              <Button type="submit" variant="secondary" loading={isAddingNote} disabled={isAddingNote}>
                Add note
              </Button>
            </form>
          </div>
        ) : null}

        {mode === 'edit' && application ? (
          <div className="mt-8 border-t border-[var(--color-border)] pt-4">
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="danger"
                className="w-auto px-6"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                Delete application
              </Button>
            ) : (
              <div className="rounded-xl border border-red-100 bg-red-50/80 p-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Delete this application for <strong>{application.companyName}</strong>? This cannot be undone.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="danger" loading={isSubmitting} onClick={handleDelete}>
                    Yes, delete
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-auto px-6"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
