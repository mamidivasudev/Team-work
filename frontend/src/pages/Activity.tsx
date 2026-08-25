import React, { useEffect, useState } from 'react';
import { getActivities, clearActivities } from '../services/api';
import type { Activity as ActivityType } from '../types';
import { Trash2 } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-gray-800">Activity Feed</h1>
        {isAdmin && activities.length > 0 && (
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Reset Activity
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6 max-w-2xl">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity.</p>
        ) : (
          activities.map(a => (
            <div key={a.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400">
                #
              </div>
              <div>
                <p className="text-gray-800 text-sm">{a.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Activity;
