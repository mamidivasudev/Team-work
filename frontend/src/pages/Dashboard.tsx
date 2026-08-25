import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import type { DashboardData } from '../types';
import { FolderKanban, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      Loading dashboard...
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center h-64 text-red-500 text-sm">
      Error loading data. Is the backend running?
    </div>
  );

  const completionRate = data.tasks_summary.total > 0
    ? Math.round((data.tasks_summary.completed / data.tasks_summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FolderKanban size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total Projects</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{data.projects_summary.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Active Projects</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{data.projects_summary.active}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <CheckSquare size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{data.tasks_summary.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-lg">
            <AlertCircle size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Task Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{data.tasks_summary.total - data.tasks_summary.completed - data.tasks_summary.in_progress - data.tasks_summary.blocked}</p>
          <p className="text-xs text-yellow-600 mt-1 font-medium">To Do</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{data.tasks_summary.in_progress}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">In Progress</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{data.tasks_summary.blocked}</p>
          <p className="text-xs text-red-600 mt-1 font-medium">Blocked</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Project Progress</h2>
          {data.project_progress.length === 0 ? (
            <div className="bg-white rounded-xl border shadow-sm p-6 text-center text-gray-400 text-sm">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {data.project_progress.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border">
                  <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                  <div className="mt-3 text-sm text-gray-500 flex justify-between">
                    <span>Progress</span>
                    <span className="font-medium text-gray-800">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1 mb-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                    <span>📋 Tasks: {p.tasks}</span>
                    <span>✅ Done: {p.completed}</span>
                    <span>🔄 Active: {p.in_progress}</span>
                    <span>🚫 Blocked: {p.blocked}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4 max-h-80 overflow-y-auto">
            {data.recent_activities.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
            ) : (
              data.recent_activities.map(a => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
