import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import ApplicationModal from '../components/application/ApplicationModal';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
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
          className={`hb-card rounded-xl border border-[var(--color-border)] bg-white p-3.5 transition-all ${
            snapshot.isDragging
              ? 'cursor-grabbing shadow-lg ring-2 ring-indigo-200'
              : 'cursor-grab hover:-translate-y-0.5 hover:shadow-md'
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
    <Card className="flex h-full min-h-[540px] w-[300px] flex-shrink-0 flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
      <div className="mb-3 flex items-center justify-between">
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
            className={`flex min-h-[420px] flex-1 flex-col gap-2.5 rounded-lg p-1.5 transition-colors ${
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

function ApplicationsListTable({ applications, onEditRow, onDeleteRow }) {
  if (applications.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">No results found</p>
        <p className="mt-1 text-sm hb-muted">Try adjusting filters or search.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Company</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Role</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Status</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Applied</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Priority</th>
              <th className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-gray-50/60"
              >
                <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                  <Link
                    to={`/applications/${row.id}`}
                    className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                  >
                    {row.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3 hb-muted">{row.role}</td>
                <td className="px-4 py-3">
                  <Badge>{row.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm hb-muted">{formatAppliedDate(row.appliedDate)}</td>
                <td className="px-4 py-3">
                  <Badge>{row.priority || 'Medium'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-indigo-50"
                      onClick={() => onEditRow?.(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-danger)] hover:bg-red-50"
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
    <Card className="h-fit p-4 lg:sticky lg:top-24">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
      <p className="mt-1 text-xs hb-muted">
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

  const columns = useMemo(() => groupByStatus(applications), [applications]);

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

  const clearFilters = useCallback(() => {
    setFilterStatus('');
    setFilterWorkType('');
    setFilterPriority('');
    setAppliedFrom('');
    setAppliedTo('');
    setSearch('');
  }, []);

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
    } catch (updateError) {
      setApplications(previousApplications);
      setError(getApiErrorMessage(updateError));
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-8">
      <DashboardAnalytics />

      <div className="space-y-6 border-t border-[var(--color-border)] pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Your Applications</h2>
          <p className="mt-1 text-sm hb-muted">
            Kanban for fast moves, list for scanning. Status filtering is available in List view;
            Kanban uses columns instead.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" className="w-auto px-5" onClick={openCreateApplication}>
            Add Application
          </Button>
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {totalApplications} shown
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide hb-muted">View</span>
        <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-white p-1">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'kanban'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {isUpdating ? (
        <p className="text-xs font-semibold hb-muted">Updating status...</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <FilterSidebar
          viewMode={viewMode}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterWorkType={filterWorkType}
          setFilterWorkType={setFilterWorkType}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          appliedFrom={appliedFrom}
          setAppliedFrom={setAppliedFrom}
          appliedTo={appliedTo}
          setAppliedTo={setAppliedTo}
          onClear={clearFilters}
        />

        <div className="space-y-4">
          <Input
            id="search-applications"
            label="Search"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />

          {isLoading ? (
            <Card className="p-6">
              <p className="text-sm hb-muted">Loading applications...</p>
            </Card>
          ) : viewMode === 'kanban' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max items-start gap-4">
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
          ) : (
            <ApplicationsListTable
              applications={applications}
              onEditRow={openEditApplication}
              onDeleteRow={handleDeleteApplication}
            />
          )}
        </div>
      </div>

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
    </div>
  );
}
