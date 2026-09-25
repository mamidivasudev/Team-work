import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import type { DashboardData } from '../types';
import { FolderKanban, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showTP, setShowTP] = useState(true);
  const [showAP, setShowAP] = useState(true);
  const [showTT, setShowTT] = useState(true);
  const [showCR, setShowCR] = useState(true);

  const [showTodo, setShowTodo] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showReview, setShowReview] = useState(true);
  const [showBlocked, setShowBlocked] = useState(true);
  const [showOverdue, setShowOverdue] = useState(true);

  const loadSettings = () => {
    setShowTP(localStorage.getItem('setting_dashTotalProjects') !== 'false');
    setShowAP(localStorage.getItem('setting_dashActiveProjects') !== 'false');
    setShowTT(localStorage.getItem('setting_dashTotalTasks') !== 'false');
    setShowCR(localStorage.getItem('setting_dashCompletionRate') !== 'false');
    
    setShowTodo(localStorage.getItem('setting_dashTodo') !== 'false');
    setShowInProgress(localStorage.getItem('setting_dashInProgress') !== 'false');
    setShowReview(localStorage.getItem('setting_dashReview') !== 'false');
    setShowBlocked(localStorage.getItem('setting_dashBlocked') !== 'false');
    setShowOverdue(localStorage.getItem('setting_dashOverdue') !== 'false');
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('settings_updated', loadSettings);
    return () => window.removeEventListener('settings_updated', loadSettings);
  }, []);

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
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
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

  // Count how many cards are visible to adjust grid columns
  const visibleCards = [showTP, showAP, showTT, showCR].filter(Boolean).length;
  const gridColsClass = visibleCards === 4 ? 'lg:grid-cols-4' 
                      : visibleCards === 3 ? 'lg:grid-cols-3' 
                      : visibleCards === 2 ? 'lg:grid-cols-2' 
                      : 'lg:grid-cols-1';

  // Count visible status blocks
  const visibleStatusBlocks = [showTodo, showInProgress, showReview, showBlocked, showOverdue].filter(Boolean).length;
  const statusGridColsClass = visibleStatusBlocks === 5 ? 'sm:grid-cols-5'
                            : visibleStatusBlocks === 4 ? 'sm:grid-cols-4'
                            : visibleStatusBlocks === 3 ? 'sm:grid-cols-3'
                            : visibleStatusBlocks === 2 ? 'sm:grid-cols-2'
                            : 'sm:grid-cols-1';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your team's projects and tasks.</p>
      </div>

      {/* Stat Cards */}
      {visibleCards > 0 && (
        <div className={`grid grid-cols-2 ${gridColsClass} gap-4`}>
          {showTP && (
            <div className="card p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <FolderKanban size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{data.projects_summary.total}</p>
              </div>
            </div>
          )}
          {showAP && (
            <div className="card p-5 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Active Projects</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{data.projects_summary.active}</p>
              </div>
            </div>
          )}
          {showTT && (
            <div className="card p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <CheckSquare size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{data.tasks_summary.total}</p>
              </div>
            </div>
          )}
          {showCR && (
            <div className="card p-5 flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertCircle size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{completionRate}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Status Summary */}
      {visibleStatusBlocks > 0 && (
        <div className={`grid grid-cols-2 ${statusGridColsClass} gap-3`}>
          {showTodo && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{data.tasks_summary.total - data.tasks_summary.completed - data.tasks_summary.in_progress - data.tasks_summary.blocked - data.tasks_summary.review}</p>
              <p className="text-xs text-yellow-600 mt-1 font-medium">To Do</p>
            </div>
          )}
          {showInProgress && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{data.tasks_summary.in_progress}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">In Progress</p>
            </div>
          )}
          {showReview && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{data.tasks_summary.review}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">Review</p>
            </div>
          )}
          {showBlocked && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{data.tasks_summary.blocked}</p>
              <p className="text-xs text-red-600 mt-1 font-medium">Blocked</p>
            </div>
          )}
          {showOverdue && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">{data.tasks_summary.overdue}</p>
              <p className="text-xs text-orange-600 mt-1 font-medium">Overdue</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Project Progress</h2>
          {data.project_progress.length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-sm">
              No projects yet. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.project_progress.map(p => (
                <div key={p.id} className="card p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                  <div className="mt-3 text-sm text-slate-500 flex justify-between">
                    <span>Progress</span>
                    <span className="font-medium text-slate-800">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-1 mb-3">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
                    {showTT && <span>📋 Tasks: {p.tasks}</span>}
                    {showCR && <span>✅ Done: {p.completed}</span>}
                    {showInProgress && <span>🔄 Active: {p.in_progress}</span>}
                    {showBlocked && <span>🚫 Blocked: {p.blocked}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="card p-4 space-y-4 max-h-80 overflow-y-auto">
            {data.recent_activities.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
            ) : (
              data.recent_activities.map(a => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
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
