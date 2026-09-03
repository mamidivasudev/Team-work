import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, CalendarClock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getTasks, getProjects } from '../services/api';
import type { Task, Project } from '../types';
import { priorityStyles, statusStyles, isOverdue } from '../components/tasks/taskStyles';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysFromNow = (d: Date) => Math.floor((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86400000);

const MyWork = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    Promise.all([getTasks(), getProjects()]).then(([t, p]) => {
      setTasks(t);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  const myTasks = tasks.filter(t => t.assignee_ids.includes(currentUserId));
  const openTasks = myTasks.filter(t => t.status !== 'COMPLETED');
  const overdueTasks = openTasks.filter(isOverdue);
  const dueThisWeek = openTasks.filter(t => {
    if (!t.due_date) return false;
    const days = daysFromNow(new Date(t.due_date));
    return days >= 0 && days <= 7;
  });
  const now = new Date();
  const completedThisMonth = myTasks.filter(t =>
    t.status === 'COMPLETED' && new Date(t.updated_at).getMonth() === now.getMonth() && new Date(t.updated_at).getFullYear() === now.getFullYear()
  );

  const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || '—';

  const buckets: { label: string; tasks: Task[] }[] = [
    { label: 'Overdue', tasks: overdueTasks },
    { label: 'Due This Week', tasks: openTasks.filter(t => t.due_date && !isOverdue(t) && daysFromNow(new Date(t.due_date)) <= 7) },
    { label: 'Later / No Due Date', tasks: openTasks.filter(t => !overdueTasks.includes(t) && !(t.due_date && daysFromNow(new Date(t.due_date)) <= 7)) },
  ];

  const openTaskRef = (task: Task) => navigate(`/tasks?taskId=${task.id}`);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">My Work</h1>
        <p className="page-subtitle">Everything assigned to you, in one place.</p>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{openTasks.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Open Tasks</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{dueThisWeek.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Due This Week</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Overdue</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedThisMonth.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Completed This Month</p>
            </div>
          </div>

          {myTasks.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <ListChecks size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Nothing assigned to you</p>
              <p className="text-sm mt-1">
                {isAdmin ? "As admin you typically won't have tasks of your own — check Team Work to see everyone else's." : "You're all caught up."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {buckets.filter(b => b.tasks.length > 0).map(bucket => (
                <div key={bucket.label}>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    {bucket.label === 'Overdue' && <AlertTriangle size={14} className="text-red-500" />}
                    {bucket.label}
                    <span className="text-slate-400 font-normal normal-case">({bucket.tasks.length})</span>
                  </h2>
                  <div className="card divide-y divide-slate-100 overflow-hidden">
                    {bucket.tasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => openTaskRef(t)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                          <p className="text-xs text-slate-400">{getProjectName(t.project_id)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {t.due_date && (
                            <span className={`inline-flex items-center gap-1 text-xs ${isOverdue(t) ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                              <CalendarClock size={12} />
                              {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`badge ${priorityStyles[t.priority] || 'bg-slate-100 text-slate-600'}`}>{t.priority}</span>
                          <span className={`badge ${statusStyles[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {completedThisMonth.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-green-500" /> Completed This Month
                    <span className="text-slate-400 font-normal normal-case">({completedThisMonth.length})</span>
                  </h2>
                  <div className="card divide-y divide-slate-100 overflow-hidden">
                    {completedThisMonth.map(t => (
                      <div
                        key={t.id}
                        onClick={() => openTaskRef(t)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors opacity-70"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate line-through">{t.title}</p>
                          <p className="text-xs text-slate-400">{getProjectName(t.project_id)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyWork;
