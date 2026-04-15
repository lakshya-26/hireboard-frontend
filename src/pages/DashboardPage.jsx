import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
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

function formatAppliedDate(date) {
  if (!date) return 'Not applied yet';
  const asDate = new Date(date);
  if (Number.isNaN(asDate.getTime())) return 'Not applied yet';
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

function ApplicationItem({ application, index }) {
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
              : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {application.companyName}
          </h4>
          <p className="mt-1 text-sm hb-muted">{application.role}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs hb-muted">
              Applied: {formatAppliedDate(application.appliedDate)}
            </span>
            <Badge>{application.priority || 'Medium'}</Badge>
          </div>
        </article>
      )}
    </Draggable>
  );
}

function StatusColumn({ status, applications }) {
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
              <ApplicationItem key={application.id} application={application} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </Card>
  );
}

export default function DashboardPage() {
  const [columns, setColumns] = useState(createEmptyColumns());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchApplications() {
      try {
        setError('');
        setIsLoading(true);
        const response = await api.get('/applications', {
          params: { limit: 100, sortBy: 'appliedDate', sortOrder: 'desc' },
        });
        const applications = response.data?.data?.applications ?? [];
        if (isMounted) {
          setColumns(groupByStatus(applications));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(getApiErrorMessage(fetchError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchApplications();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalApplications = useMemo(
    () => Object.values(columns).reduce((sum, list) => sum + list.length, 0),
    [columns],
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

    const previousColumns = columns;
    if (source.droppableId === destination.droppableId) {
      const current = columns[source.droppableId];
      const reordered = reorderWithinColumn(current, source.index, destination.index);
      setColumns((prev) => ({ ...prev, [source.droppableId]: reordered }));
      return;
    }

    const optimisticColumns = moveAcrossColumns(columns, source, destination);
    setColumns(optimisticColumns);
    setIsUpdating(true);
    setError('');

    try {
      await api.patch(`/applications/${draggableId}`, { status: destination.droppableId });
    } catch (updateError) {
      setColumns(previousColumns);
      setError(getApiErrorMessage(updateError));
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Your Applications</h2>
          <p className="mt-1 text-sm hb-muted">
            Drag cards across columns to quickly update application status.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {totalApplications} total
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

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm hb-muted">Loading applications...</p>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-start gap-4">
              {STATUSES.map((status) => (
                <StatusColumn
                  key={status}
                  status={status}
                  applications={columns[status] ?? []}
                />
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
