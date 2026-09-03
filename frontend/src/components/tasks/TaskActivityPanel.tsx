import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { Activity } from '../../types';
import { getTaskActivity } from '../../services/api';

interface TaskActivityPanelProps {
  taskId: number;
}

const TaskActivityPanel = ({ taskId }: TaskActivityPanelProps) => {
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    getTaskActivity(taskId).then(setActivity).catch(() => setActivity([]));
  }, [taskId]);

  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <History size={14} /> Activity History
      </label>
      <div className="max-h-40 overflow-y-auto space-y-2">
        {activity.length === 0 ? (
          <p className="text-xs text-slate-400">No activity recorded yet.</p>
        ) : (
          activity.map(a => (
            <div key={a.id} className="flex gap-2 text-xs">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <div>
                <p className="text-slate-600">{a.description}</p>
                <p className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskActivityPanel;
