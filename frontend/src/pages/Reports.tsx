import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { getProjectsReport, getTeamWorkloadReport, getOverdueReport } from '../services/api';
import type { ProjectReportRow, TeamWorkloadRow, Task } from '../types';
import { priorityStyles } from '../components/tasks/taskStyles';

const daysOverdue = (dueDate: string) => Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);

const Reports = () => {
  const navigate = useNavigate();
  const [projectRows, setProjectRows] = useState<ProjectReportRow[]>([]);
  const [teamRows, setTeamRows] = useState<TeamWorkloadRow[]>([]);
  const [overdueRows, setOverdueRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProjectsReport(), getTeamWorkloadReport(), getOverdueReport()]).then(([p, t, o]) => {
      setProjectRows(p);
      setTeamRows(t);
      setOverdueRows(o);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Simple, at-a-glance summaries of project and team status.</p>
      </div>

      {/* Project Summary */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Project Summary</h2>
        </div>
        {projectRows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No projects yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-white">
                <tr>
                  <th className="th">Project</th>
                  <th className="th">Status</th>
                  <th className="th">Progress</th>
                  <th className="th text-center">Total</th>
                  <th className="th text-center">Completed</th>
                  <th className="th text-center">Blocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectRows.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3"><span className="badge bg-slate-100 text-slate-600">{p.status}</span></td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{p.total_tasks}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{p.completed_tasks}</td>
                    <td className="px-4 py-3 text-center text-sm text-red-500 font-medium">{p.blocked_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Workload */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Team Workload</h2>
        </div>
        {teamRows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No team members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-white">
                <tr>
                  <th className="th">Member</th>
                  <th className="th">Role</th>
                  <th className="th text-center">Open Tasks</th>
                  <th className="th text-center">Completed</th>
                  <th className="th text-center">Blocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamRows.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{m.role}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{m.open_tasks}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-bold">{m.completed_tasks}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-700 text-xs font-bold">{m.blocked_tasks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue / Aging */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Overdue Tasks</h2>
        </div>
        {overdueRows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nothing overdue — nice work.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {overdueRows.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/tasks?taskId=${t.id}`)}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-400">Due {new Date(t.due_date as string).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`badge ${priorityStyles[t.priority] || 'bg-slate-100 text-slate-600'}`}>{t.priority}</span>
                  <span className="text-xs font-semibold text-red-600">{daysOverdue(t.due_date as string)}d overdue</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {projectRows.length === 0 && teamRows.length === 0 && overdueRows.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <BarChart3 size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">Not enough data yet</p>
          <p className="text-sm mt-1">Reports will fill in as you add projects, team members, and tasks.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
