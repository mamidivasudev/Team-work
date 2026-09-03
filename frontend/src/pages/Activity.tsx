import { useEffect, useState } from 'react';
import { getActivities, clearActivities } from '../services/api';
import type { Activity as ActivityType } from '../types';
import { Trash2, Zap } from 'lucide-react';

const Activity = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const fetchActivities = () => getActivities().then(setActivities);

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear all activity logs? This cannot be undone.")) {
      await clearActivities();
      fetchActivities();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-subtitle">A running log of everything happening across your projects.</p>
        </div>
        {isAdmin && activities.length > 0 && (
          <button onClick={handleClear} className="btn-danger">
            <Trash2 size={16} />
            Reset Activity
          </button>
        )}
      </div>
      <div className="card p-6 space-y-5 max-w-2xl">
        {activities.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No recent activity.</p>
        ) : (
          activities.map(a => (
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
export default Activity;
