import { useEffect, useState } from 'react';
import { getActivities, clearActivities, getTasks, getProjects } from '../services/api';
import type { Activity as ActivityType } from '../types';
import { Trash2, Zap } from 'lucide-react';

const Notifications = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [myTaskIds, setMyTaskIds] = useState<number[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<number[]>([]);
  const [relatedToMeOnly, setRelatedToMeOnly] = useState(false);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  const fetchActivities = () => getActivities().then(setActivities);

  useEffect(() => {
    fetchActivities();
    getTasks().then(tasks => {
      setMyTaskIds(tasks.filter(t => t.assignee_ids.includes(currentUserId)).map(t => t.id));
    });
    getProjects().then(projects => {
      setMyProjectIds(projects.map(p => p.id));
    });
  }, []);

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear all activity logs? This cannot be undone.")) {
      await clearActivities();
      fetchActivities();
    }
  };

  const visibleActivities = relatedToMeOnly
    ? activities.filter(a =>
        (a.task_id != null && myTaskIds.includes(a.task_id)) ||
        (a.project_id != null && myProjectIds.includes(a.project_id))
      )
    : activities;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">A running log of everything happening across your projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white text-sm font-medium">
            <button
              onClick={() => setRelatedToMeOnly(false)}
              className={`px-3 py-1.5 transition-colors ${!relatedToMeOnly ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              All Activity
            </button>
            <button
              onClick={() => setRelatedToMeOnly(true)}
              className={`px-3 py-1.5 transition-colors ${relatedToMeOnly ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Related to Me
            </button>
          </div>
          {isAdmin && activities.length > 0 && (
            <button onClick={handleClear} className="btn-danger">
              <Trash2 size={16} />
              Reset Activity
            </button>
          )}
        </div>
      </div>
      <div className="card p-6 space-y-5 max-w-2xl">
        {visibleActivities.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            {relatedToMeOnly ? "Nothing related to you yet." : "No recent activity."}
          </p>
        ) : (
          visibleActivities.map(a => (
            <div key={a.id} className="flex gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
              <div className="w-9 h-9 bg-indigo-50 rounded-full shrink-0 flex items-center justify-center text-indigo-500">
                <Zap size={16} />
              </div>
              <div>
                <p className="text-slate-800 text-sm">{a.description}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Notifications;
