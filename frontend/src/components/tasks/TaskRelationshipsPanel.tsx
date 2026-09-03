import { useEffect, useState } from 'react';
import { Link2, X, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Task, TaskRelationship } from '../../types';
import { getTaskRelationships, createTaskRelationship, deleteTaskRelationship } from '../../services/api';
import { statusStyles } from './taskStyles';

interface TaskRelationshipsPanelProps {
  taskId: number;
  projectTasks: Task[];
  isAdmin: boolean;
}

const typeLabels: Record<string, string> = {
  blocks: 'Blocks',
  relates_to: 'Relates to',
};

const directionLabel = (r: TaskRelationship): string => {
  if (r.relationship_type === 'blocks' && r.direction === 'reverse') return 'Blocked by';
  return typeLabels[r.relationship_type] || r.relationship_type;
};

const TaskRelationshipsPanel = ({ taskId, projectTasks, isAdmin }: TaskRelationshipsPanelProps) => {
  const [relationships, setRelationships] = useState<TaskRelationship[]>([]);
  const [relatedTaskId, setRelatedTaskId] = useState('');
  const [relType, setRelType] = useState('relates_to');
  const [saving, setSaving] = useState(false);

  const load = () => getTaskRelationships(taskId).then(setRelationships).catch(() => setRelationships([]));

  useEffect(() => { load(); }, [taskId]);

  const otherTasks = projectTasks.filter(t => t.id !== taskId);

  const handleAdd = async () => {
    if (!relatedTaskId) return;
    setSaving(true);
    try {
      await createTaskRelationship(taskId, parseInt(relatedTaskId), relType);
      setRelatedTaskId('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (relationshipId: number) => {
    await deleteTaskRelationship(relationshipId);
    load();
  };

  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Link2 size={14} /> Related Tasks
      </label>
      <div className="space-y-1.5 mb-2">
        {relationships.length === 0 ? (
          <p className="text-xs text-slate-400">No linked tasks.</p>
        ) : (
          relationships.map(r => (
            <div key={r.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                {r.direction === 'forward' ? <ArrowRight size={12} className="text-slate-400 shrink-0" /> : <ArrowLeft size={12} className="text-slate-400 shrink-0" />}
                <span className="font-medium text-slate-600 shrink-0">
                  {directionLabel(r)}
                </span>
                <span className={`badge shrink-0 ${statusStyles[r.related_task.status] || 'bg-slate-100 text-slate-600'}`}>{r.related_task.status}</span>
                <span className="truncate text-slate-700">{r.related_task.title}</span>
              </div>
              {isAdmin && (
                <button type="button" onClick={() => handleRemove(r.id)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2">
                  <X size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <select value={relType} onChange={e => setRelType(e.target.value)} className="input py-1.5 text-sm w-auto">
            <option value="relates_to">Relates to</option>
            <option value="blocks">Blocks</option>
          </select>
          <select value={relatedTaskId} onChange={e => setRelatedTaskId(e.target.value)} className="input py-1.5 text-sm">
            <option value="">Select a task...</option>
            {otherTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <button type="button" onClick={handleAdd} disabled={saving || !relatedTaskId} className="btn-secondary px-3 py-1.5 whitespace-nowrap">
            Link
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskRelationshipsPanel;
