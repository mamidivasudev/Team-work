export const priorityStyles: Record<string, string> = {
  LOW:      'bg-slate-100 text-slate-600',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const statusStyles: Record<string, string> = {
  TODO:        'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW:      'bg-purple-100 text-purple-700',
  BLOCKED:     'bg-red-100 text-red-700',
  COMPLETED:   'bg-green-100 text-green-700',
};

export const statusLabels: Record<string, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  REVIEW: 'REVIEW',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
};

export const KANBAN_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED'] as const;

export const isOverdue = (t: { due_date?: string | null; status: string }) =>
  !!t.due_date && t.status !== 'COMPLETED' && new Date(t.due_date).getTime() < Date.now();
