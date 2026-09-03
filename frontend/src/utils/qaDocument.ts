import type { Task } from '../types';

/**
 * Resolves the saved observation document filename a QA task links back to.
 * Prefers the server-set `qa_document_filename` (exact match). Falls back to
 * reconstructing it from the title for legacy tasks created before that field
 * existed.
 */
export function resolveQaDocFilename(task: Pick<Task, 'title' | 'project_id' | 'qa_document_filename'>): string {
  if (task.qa_document_filename) return task.qa_document_filename;

  const docTitle = task.title.split(' - Observation ')[0];
  const safeTitle = Array.from(docTitle).filter(c => /[a-zA-Z0-9 \-_]/.test(c)).join('').trimEnd();
  return safeTitle ? `${safeTitle}_proj${task.project_id}.html` : `Observation_proj${task.project_id}.html`;
}
