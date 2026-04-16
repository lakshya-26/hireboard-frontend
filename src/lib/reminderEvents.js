export const DUE_REMINDERS_REFRESH_EVENT = 'hireboard:due-reminders-refresh';

export function requestDueRemindersRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DUE_REMINDERS_REFRESH_EVENT));
  }
}
