import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { api, getApiErrorMessage } from '../lib/api';

const STATUSES = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

const PRIORITIES = ['Low', 'Medium', 'High'];

const selectClass =
  'h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgb(79_70_229_/_18%)]';

function formatAppliedDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNoteTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function noteKey(note, index) {
  return note._id || note.id || `note-${index}`;
}

function normalizeLinkedin(value) {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v.replace(/^\/+/, '')}`;
}

function contactToPayload(c) {
  const name = (c.name ?? '').trim();
  if (!name) return null;
  const out = { name };
  const role = (c.role ?? '').trim();
  const email = (c.email ?? '').trim().toLowerCase();
  const li = (c.linkedin ?? '').trim();
  if (role) out.role = role;
  if (email) out.email = email;
  if (li) out.linkedin = normalizeLinkedin(li);
  const id = c._id || c.id;
  if (id) out._id = id;
  return out;
}

function contactsArrayForPatch(contacts) {
  return (contacts || []).map(contactToPayload).filter(Boolean);
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingField, setSavingField] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    email: '',
    linkedin: '',
  });
  const [addingContact, setAddingContact] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/applications/${id}`);
      setApplication(res.data?.data ?? null);
    } catch (err) {
      setApplication(null);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedNotes = useMemo(() => {
    const notes = application?.notes;
    if (!Array.isArray(notes)) return [];
    return [...notes].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return ta - tb;
    });
  }, [application?.notes]);

  const patchField = useCallback(
    async (payload, fieldLabel) => {
      if (!id) return;
      setActionError('');
      setSavingField(fieldLabel);
      setApplication((prev) => (prev ? { ...prev, ...payload } : prev));
      try {
        const res = await api.patch(`/applications/${id}`, payload);
        setApplication(res.data?.data ?? null);
      } catch (err) {
        setActionError(getApiErrorMessage(err));
        await load();
      } finally {
        setSavingField(null);
      }
    },
    [id, load],
  );

  async function handleAddNote(e) {
    e.preventDefault();
    if (!id) return;
    const text = noteText.trim();
    if (!text) {
      setActionError('Write something before adding a note.');
      return;
    }
    setActionError('');
    setAddingNote(true);
    try {
      const res = await api.post(`/applications/${id}/notes`, { text });
      setApplication(res.data?.data ?? null);
      setNoteText('');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setAddingNote(false);
    }
  }

  async function handleAddContact(e) {
    e.preventDefault();
    if (!id || !application) return;
    const name = contactForm.name.trim();
    if (!name) {
      setActionError('Contact name is required.');
      return;
    }
    setActionError('');
    setAddingContact(true);
    const entry = contactToPayload({
      name: contactForm.name,
      role: contactForm.role,
      email: contactForm.email,
      linkedin: contactForm.linkedin,
    });
    const next = [...contactsArrayForPatch(application.contacts), entry];
    try {
      const res = await api.patch(`/applications/${id}`, { contacts: next });
      setApplication(res.data?.data ?? null);
      setContactForm({ name: '', role: '', email: '', linkedin: '' });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setAddingContact(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 transition-opacity duration-200">
        <Link
          to="/dashboard"
          className="inline-flex text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          ← Back to dashboard
        </Link>
        <Card className="p-10">
          <p className="text-sm hb-muted">Loading application…</p>
        </Card>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard"
          className="inline-flex text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          ← Back to dashboard
        </Link>
        <Card className="border-red-100 bg-red-50/80 p-6">
          <p className="text-sm font-semibold text-[var(--color-danger)]">
            {error || 'Application not found.'}
          </p>
          <Button type="button" className="mt-4 w-auto px-4" variant="secondary" onClick={() => navigate('/dashboard')}>
            Return to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex text-sm font-semibold text-[var(--color-primary)] transition hover:underline"
        >
          ← Back to dashboard
        </Link>
        {savingField ? (
          <span className="text-xs font-semibold hb-muted">Saving {savingField}…</span>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="p-6 transition-shadow duration-200 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide hb-muted">Company</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] lg:text-3xl">
            {application.companyName}
          </h1>

          <div className="mt-6 space-y-5">
            <div>
              <label className="hb-label" htmlFor="detail-role">
                Role
              </label>
              <input
                id="detail-role"
                type="text"
                defaultValue={application.role}
                key={`role-${application.id}-${application.role}`}
                className={selectClass}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== application.role) void patchField({ role: next }, 'role');
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[140px] flex-1">
                <label className="hb-label" htmlFor="detail-status">
                  Status
                </label>
                <select
                  id="detail-status"
                  className={selectClass}
                  value={application.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== application.status) void patchField({ status: next }, 'status');
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="hb-label" htmlFor="detail-priority">
                  Priority
                </label>
                <select
                  id="detail-priority"
                  className={selectClass}
                  value={application.priority || 'Medium'}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== application.priority) void patchField({ priority: next }, 'priority');
                  }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="hb-label" htmlFor="detail-location">
                Location
              </label>
              <input
                id="detail-location"
                type="text"
                defaultValue={application.location || ''}
                key={`loc-${application.id}-${application.location ?? ''}`}
                className={selectClass}
                placeholder="City, region, or remote"
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  const prev = (application.location || '').trim();
                  if (next !== prev) void patchField({ location: next || undefined }, 'location');
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-5">
              <div>
                <p className="text-xs font-semibold hb-muted">Applied</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {formatAppliedDate(application.appliedDate)}
                </p>
              </div>
              <div className="flex items-end">
                <Badge>{application.status}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 lg:p-8">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Notes</h2>
            <p className="mt-1 text-xs hb-muted">Newest at the bottom. Follow-ups and outcomes stay here.</p>

            <ul className="mt-5 max-h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
              {sortedNotes.length === 0 ? (
                <li className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm hb-muted">
                  No notes yet.
                </li>
              ) : (
                sortedNotes.map((note, index) => (
                  <li
                    key={noteKey(note, index)}
                    className="rounded-xl border border-[var(--color-border)] bg-gray-50/50 px-4 py-3 transition-colors hover:bg-gray-50/90"
                  >
                    <p className="text-xs font-semibold hb-muted">{formatNoteTime(note.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">{note.text}</p>
                  </li>
                ))
              )}
            </ul>

            <form onSubmit={handleAddNote} className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5">
              <Input
                id="detail-note"
                label="Add a note"
                placeholder="Interview recap, recruiter reply, next step…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                autoComplete="off"
              />
              <Button type="submit" className="w-auto px-5" disabled={addingNote}>
                {addingNote ? 'Adding…' : 'Add note'}
              </Button>
            </form>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Contacts</h2>
            <p className="mt-1 text-xs hb-muted">People involved in this process.</p>

            <ul className="mt-4 space-y-3">
              {!application.contacts?.length ? (
                <li className="text-sm hb-muted">No contacts yet.</li>
              ) : (
                application.contacts.map((c, index) => (
                  <li
                    key={c._id || c.id || `c-${index}`}
                    className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3"
                  >
                    <p className="font-semibold text-[var(--color-text-primary)]">{c.name || '—'}</p>
                    {c.role ? <p className="mt-0.5 text-sm hb-muted">{c.role}</p> : null}
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="mt-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {c.email}
                      </a>
                    ) : null}
                    {c.linkedin ? (
                      <a
                        href={c.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                      >
                        LinkedIn profile
                      </a>
                    ) : null}
                  </li>
                ))
              )}
            </ul>

            <form onSubmit={handleAddContact} className="mt-6 space-y-4 border-t border-[var(--color-border)] pt-6">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Add contact</p>
              <Input
                id="contact-name"
                label="Name"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                autoComplete="name"
              />
              <Input
                id="contact-role"
                label="Role / title"
                value={contactForm.role}
                onChange={(e) => setContactForm((p) => ({ ...p, role: e.target.value }))}
              />
              <Input
                id="contact-email"
                type="email"
                label="Email"
                value={contactForm.email}
                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
              <Input
                id="contact-linkedin"
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/…"
                value={contactForm.linkedin}
                onChange={(e) => setContactForm((p) => ({ ...p, linkedin: e.target.value }))}
              />
              <Button type="submit" className="w-auto px-5" variant="secondary" disabled={addingContact}>
                {addingContact ? 'Saving…' : 'Add contact'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
