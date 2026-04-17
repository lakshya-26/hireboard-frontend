import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import ApplicationModal from '../components/application/ApplicationModal';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import BrandLogo from '../components/ui/BrandLogo';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { api, getApiErrorMessage } from '../lib/api';
import { celebrateOffer } from '../lib/offerConfetti';

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

function createEmptyColumns() {
  return Object.fromEntries(STATUSES.map((status) => [status, []]));
}

function groupByStatus(applications) {
  const grouped = createEmptyColumns();
  for (const app of applications) {
    const key = STATUSES.includes(app.status) ? app.status : 'Saved';
    grouped[key].push(app);
  }
  return grouped;
}

function flattenColumns(cols) {
  return STATUSES.flatMap((status) => cols[status] ?? []);
}

function formatAppliedDate(date) {
  if (!date) return '—';
  const asDate = new Date(date);
  if (Number.isNaN(asDate.getTime())) return '—';
  return asDate.toLocaleDateString();
}

function reorderWithinColumn(items, sourceIndex, destinationIndex) {
  const updated = [...items];
  const [moved] = updated.splice(sourceIndex, 1);
  updated.splice(destinationIndex, 0, moved);
  return updated;
}

function moveAcrossColumns(columns, source, destination) {
  const sourceItems = [...columns[source.droppableId]];
  const destinationItems = [...columns[destination.droppableId]];
  const [moved] = sourceItems.splice(source.index, 1);
  const movedWithStatus = { ...moved, status: destination.droppableId };
  destinationItems.splice(destination.index, 0, movedWithStatus);

  return {
    ...columns,
    [source.droppableId]: sourceItems,
    [destination.droppableId]: destinationItems,
  };
}

function ApplicationItem({ application, index, onEdit, onDelete }) {
  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`hb-card hb-card--interactive mb-0 rounded-[var(--radius-lg)] p-3.5 transition-shadow ${
            snapshot.isDragging
              ? 'cursor-grabbing shadow-lg ring-2 ring-indigo-200'
              : 'cursor-grab'
          }`}
        >
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                <Link
                  to={`/applications/${application.id}`}
                  draggable={false}
                  className="rounded no-underline outline-none hover:text-[var(--color-primary)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                >
                  {application.companyName}
                </Link>
              </h4>
              <p className="mt-1 text-sm hb-muted">{application.role}</p>
              <p className="mt-3 text-xs leading-snug hb-muted">
                Applied: {formatAppliedDate(application.appliedDate)}
              </p>
            </div>
            <div
              className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-indigo-50"
                  onClick={() => onEdit?.(application)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-danger)] hover:bg-red-50"
                  onClick={() => onDelete?.(application)}
                >
                  Delete
                </button>
              </div>
              <Badge className="shrink-0">{application.priority || 'Medium'}</Badge>
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
}

function StatusColumn({ status, applications, onEditApplication, onDeleteApplication }) {
  return (
    <Card className="hb-panel flex h-full min-h-0 w-[272px] shrink-0 flex-col p-3 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{status}</h3>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {applications.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain rounded-lg p-1.5 transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50/60' : 'bg-transparent'
            }`}
          >
            {applications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-7 text-center text-sm hb-muted">
                No applications
              </div>
            ) : null}

            {applications.map((application, index) => (
              <ApplicationItem
                key={application.id}
                application={application}
                index={index}
                onEdit={onEditApplication}
                onDelete={onDeleteApplication}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Card>
  );
}

function ApplicationsListTable({ applications, onEditRow, onDeleteRow, hasActiveFilters, onAddApplication }) {
  if (applications.length === 0) {
    if (!hasActiveFilters) {
      return (
        <Card className="p-12 text-center hb-fade-in">
          <p className="text-base font-semibold text-[var(--color-text-primary)]">No applications yet</p>
          <p className="mt-2 text-sm hb-muted">
            Add a role to see it here and on the Kanban board.
          </p>
          {onAddApplication ? (
            <div className="mt-6 flex justify-center">
              <Button type="button" className="w-auto px-6" onClick={onAddApplication}>
                Add application
              </Button>
            </div>
          ) : null}
        </Card>
      );
    }
    return (
      <Card className="p-10 text-center hb-fade-in">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">No results found</p>
        <p className="mt-1 text-sm hb-muted">Try adjusting filters or search.</p>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="hb-table-wrap min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-gray-50/95 backdrop-blur-sm">
            <tr>
              <th className="w-[22%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">
                Company
              </th>
              <th className="w-[20%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">Role</th>
              <th className="w-[14%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">Status</th>
              <th className="hidden w-[14%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:table-cell sm:px-4">
                Applied
              </th>
              <th className="w-[12%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">Priority</th>
              <th className="w-[18%] px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--color-border)] last:border-b-0 transition-colors hover:bg-gray-50/70"
              >
                <td className="px-3 py-3 font-semibold text-[var(--color-text-primary)] sm:px-4">
                  <Link
                    to={`/applications/${row.id}`}
                    className="block truncate text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                    title={row.companyName}
                  >
                    {row.companyName}
                  </Link>
                </td>
                <td className="px-3 py-3 hb-muted sm:px-4">
                  <span className="line-clamp-2 break-words" title={row.role}>
                    {row.role}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <Badge className="max-w-full truncate">{row.status}</Badge>
                </td>
                <td className="hidden w-[14%] px-3 py-3 text-sm hb-muted sm:table-cell sm:px-4">
                  {formatAppliedDate(row.appliedDate)}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <Badge>{row.priority || 'Medium'}</Badge>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-indigo-50"
                      onClick={() => onEditRow?.(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-red-50"
                      onClick={() => onDeleteRow?.(row)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FilterSidebar({
  viewMode,
  filterStatus,
  setFilterStatus,
  filterWorkType,
  setFilterWorkType,
  filterPriority,
  setFilterPriority,
  appliedFrom,
  setAppliedFrom,
  appliedTo,
  setAppliedTo,
  onClear,
}) {
  const showStatusFilter = viewMode === 'list';

  return (
    <Card className="border-0 bg-transparent p-0 shadow-none lg:rounded-xl lg:border lg:border-[var(--color-border)] lg:bg-[var(--color-surface)] lg:p-4 lg:shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
      <p className="mt-2 text-xs hb-muted">
        {showStatusFilter
          ? 'Refine the table below. Other filters also apply in Kanban (not status).'
          : 'Refine cards by type, priority, or dates. Status is shown as columns here.'}
      </p>

      <div className="mt-4 space-y-4">
        {showStatusFilter ? (
          <div>
            <label className="hb-label" htmlFor="filter-status">
              Status
            </label>
            <select
              id="filter-status"
              className={selectClass}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="hb-label" htmlFor="filter-worktype">
            Work type
          </label>
          <select
            id="filter-worktype"
            className={selectClass}
            value={filterWorkType}
            onChange={(e) => setFilterWorkType(e.target.value)}
          >
            <option value="">All types</option>
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="hb-label" htmlFor="filter-priority">
            Priority
          </label>
          <select
            id="filter-priority"
            className={selectClass}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="hb-label" htmlFor="filter-from">
            Applied from
          </label>
          <input
            id="filter-from"
            type="date"
            className={selectClass}
            value={appliedFrom}
            onChange={(e) => setAppliedFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="hb-label" htmlFor="filter-to">
            Applied to
          </label>
          <input
            id="filter-to"
            type="date"
            className={selectClass}
            value={appliedTo}
            onChange={(e) => setAppliedTo(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-gray-50"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('kanban');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalApplication, setModalApplication] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const columns = useMemo(() => groupByStatus(applications), [applications]);

  useEffect(() => {
    if (!mobileFiltersOpen) return undefined;
    document.body.classList.add('hb-scroll-lock');
    function onKey(e) {
      if (e.key === 'Escape') setMobileFiltersOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('hb-scroll-lock');
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileFiltersOpen]);

  const fetchApplications = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const params = {
        limit: 200,
        sortBy: 'appliedDate',
        sortOrder: 'desc',
      };
      if (viewMode === 'list' && filterStatus) params.status = filterStatus;
      if (filterWorkType) params.workType = filterWorkType;
      if (filterPriority) params.priority = filterPriority;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (appliedFrom) params.appliedFrom = appliedFrom;
      if (appliedTo) params.appliedTo = appliedTo;

      const response = await api.get('/applications', { params });
      setApplications(response.data?.data?.applications ?? []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError));
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    viewMode,
    debouncedSearch,
    filterStatus,
    filterWorkType,
    filterPriority,
    appliedFrom,
    appliedTo,
  ]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const totalApplications = applications.length;

  const hasActiveFilters = useMemo(() => {
    if (debouncedSearch.trim()) return true;
    if (filterWorkType || filterPriority || appliedFrom || appliedTo) return true;
    if (viewMode === 'list' && filterStatus) return true;
    return false;
  }, [
    debouncedSearch,
    filterWorkType,
    filterPriority,
    appliedFrom,
    appliedTo,
    viewMode,
    filterStatus,
  ]);

  const clearFilters = useCallback(() => {
    setFilterStatus('');
    setFilterWorkType('');
    setFilterPriority('');
    setAppliedFrom('');
    setAppliedTo('');
    setSearch('');
  }, []);

  const handleExportCsv = useCallback(async () => {
    setExportingCsv(true);
    setError('');
    try {
      const params = {
        sortBy: 'appliedDate',
        sortOrder: 'desc',
      };
      if (filterStatus) params.status = filterStatus;
      if (filterWorkType) params.workType = filterWorkType;
      if (filterPriority) params.priority = filterPriority;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (appliedFrom) params.appliedFrom = appliedFrom;
      if (appliedTo) params.appliedTo = appliedTo;

      const res = await api.get('/applications/export/csv', { params, responseType: 'blob' });
      const ctype = (res.headers['content-type'] || '').toLowerCase();
      if (ctype.includes('application/json') || ctype.includes('json')) {
        const text = await res.data.text();
        const body = JSON.parse(text || '{}');
        throw new Error(body.message || 'Export failed');
      }

      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
      const cd = res.headers['content-disposition'] || '';
      let filename = 'hireboard-applications.csv';
      const match = /filename="?([^";]+)"?/i.exec(cd);
      if (match) filename = match[1];

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (exportErr) {
      setError(exportErr?.message || getApiErrorMessage(exportErr));
    } finally {
      setExportingCsv(false);
    }
  }, [
    debouncedSearch,
    filterStatus,
    filterWorkType,
    filterPriority,
    appliedFrom,
    appliedTo,
  ]);

  const closeApplicationModal = useCallback(() => {
    setModalOpen(false);
    setModalApplication(null);
  }, []);

  const openCreateApplication = useCallback(() => {
    setModalApplication(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const openEditApplication = useCallback((app) => {
    setModalApplication(app);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const handleDeleteApplication = useCallback(
    (app) => {
      if (
        !window.confirm(
          `Delete application for "${app.companyName}"? This cannot be undone.`,
        )
      ) {
        return;
      }
      void (async () => {
        try {
          await api.delete(`/applications/${app.id}`);
          setApplications((prev) => prev.filter((a) => a.id !== app.id));
          if (modalApplication?.id === app.id) {
            closeApplicationModal();
          }
        } catch (deleteError) {
          setError(getApiErrorMessage(deleteError));
        }
      })();
    },
    [modalApplication?.id, closeApplicationModal],
  );

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const cols = groupByStatus(applications);
    const previousApplications = applications;

    if (source.droppableId === destination.droppableId) {
      const reordered = reorderWithinColumn(
        cols[source.droppableId],
        source.index,
        destination.index,
      );
      const nextCols = { ...cols, [source.droppableId]: reordered };
      setApplications(flattenColumns(nextCols));
      return;
    }

    const nextCols = moveAcrossColumns(cols, source, destination);
    setApplications(flattenColumns(nextCols));
    setIsUpdating(true);
    setError('');

    try {
      await api.patch(`/applications/${draggableId}`, { status: destination.droppableId });
      if (destination.droppableId === 'Offer' && source.droppableId !== 'Offer') {
        celebrateOffer();
      }
    } catch (updateError) {
      setApplications(previousApplications);
      setError(getApiErrorMessage(updateError));
    } finally {
      setIsUpdating(false);
    }
  }

  const filterSidebarProps = {
    viewMode,
    filterStatus,
    setFilterStatus,
    filterWorkType,
    setFilterWorkType,
    filterPriority,
    setFilterPriority,
    appliedFrom,
    setAppliedFrom,
    appliedTo,
    setAppliedTo,
    onClear: clearFilters,
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <div className="shrink-0 space-y-6">
        <DashboardAnalytics />

        <div className="space-y-5 border-t border-[var(--color-border-soft)] pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <BrandLogo className="h-10 w-10 shrink-0 rounded-[10px] object-contain shadow-md" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">HireBoard</p>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Your Applications</h2>
                <p className="mt-2 text-sm leading-relaxed hb-muted">
                  Kanban for fast moves, list for scanning. Status filtering is available in List view;
                  Kanban uses columns instead.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" className="h-11 w-auto px-5" onClick={openCreateApplication}>
                Add Application
              </Button>
              <div className="inline-flex h-9 items-center rounded-full bg-indigo-50 px-3 text-xs font-semibold text-indigo-700">
                {totalApplications} shown
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide hb-muted">View</span>
              <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-sm">
                <button
                  type="button"
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    viewMode === 'kanban'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
                  }`}
                  onClick={() => setViewMode('kanban')}
                >
                  Kanban
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text-primary)]'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-auto px-4 lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                Filters
              </Button>
              {viewMode === 'list' ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-auto px-4"
                  loading={exportingCsv}
                  disabled={exportingCsv || isLoading}
                  onClick={() => void handleExportCsv()}
                >
                  Export CSV
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-0">
        <aside className="hb-filter-rail hidden min-h-0 flex-col lg:flex">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pr-3">
            <FilterSidebar {...filterSidebarProps} />
          </div>
        </aside>

        {mobileFiltersOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-slate-900/45 backdrop-blur-[1px] lg:hidden"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div
              className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,var(--hb-filter-width))] max-w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Filters</span>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-indigo-50"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Done
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
                <FilterSidebar {...filterSidebarProps} />
              </div>
            </div>
          </>
        ) : null}

        <main className="hb-dashboard-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-4">
          <div className="shrink-0 space-y-3 border-b border-[var(--color-border-soft)] px-4 py-4 sm:px-6">
            <Input
              id="search-applications"
              label="Search"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}
            {isUpdating ? (
              <p className="text-xs font-semibold hb-muted">Updating status...</p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {isLoading ? (
              <Card className="p-6">
                <p className="text-sm hb-muted">Loading applications...</p>
              </Card>
            ) : viewMode === 'kanban' && totalApplications === 0 && !hasActiveFilters ? (
              <Card className="p-14 text-center hb-fade-in">
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">No applications yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm hb-muted">
                  Start with one application—then drag cards across stages as you progress. When you land on
                  Offer, we&apos;ll celebrate with you.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button type="button" className="h-11 w-auto px-6" onClick={openCreateApplication}>
                    Add application
                  </Button>
                </div>
              </Card>
            ) : viewMode === 'kanban' ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="hb-kanban-scroll min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex h-full min-h-[min(520px,calc(100dvh-22rem))] items-stretch gap-4 pr-1">
                      {STATUSES.map((status) => (
                        <StatusColumn
                          key={status}
                          status={status}
                          applications={columns[status] ?? []}
                          onEditApplication={openEditApplication}
                          onDeleteApplication={handleDeleteApplication}
                        />
                      ))}
                    </div>
                  </div>
                </DragDropContext>
              </div>
            ) : (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ApplicationsListTable
                  applications={applications}
                  onEditRow={openEditApplication}
                  onDeleteRow={handleDeleteApplication}
                  hasActiveFilters={hasActiveFilters}
                  onAddApplication={openCreateApplication}
                />
              </div>
            )}
          </div>
        </main>
      </section>

      <ApplicationModal
        open={modalOpen}
        mode={modalMode}
        application={modalApplication}
        onClose={closeApplicationModal}
        onCreated={(created) => {
          setApplications((prev) => [created, ...prev]);
          closeApplicationModal();
        }}
        onUpdated={(updated) => {
          setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setModalApplication((prev) => (prev && prev.id === updated.id ? updated : prev));
        }}
        onDeleted={(id) => {
          setApplications((prev) => prev.filter((a) => a.id !== id));
          closeApplicationModal();
        }}
      />
    </div>
  );
}
