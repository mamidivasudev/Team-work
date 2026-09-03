import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getTeam, getTasks, getProjects } from '../services/api';
import type { TeamMember, Task, Project } from '../types';
import { statusStyles } from '../components/tasks/taskStyles';

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

const TeamWork = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTeam(), getTasks(), getProjects()]).then(([t, tk, p]) => {
      setTeam([...t].sort((a, b) => a.name.localeCompare(b.name)));
      setTasks(tk);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || '—';

  const filteredTeam = selectedProjectId === 'all'
    ? team
    : team.filter(m =>
        m.task_project_ids?.includes(parseInt(selectedProjectId)) ||
        m.project_ids?.includes(parseInt(selectedProjectId))
      );

  const openTasksFor = (memberId: number) => {
    let memberTasks = tasks.filter(t => t.assignee_ids.includes(memberId) && t.status !== 'COMPLETED');
    if (selectedProjectId !== 'all') {
      memberTasks = memberTasks.filter(t => t.project_id.toString() === selectedProjectId);
    }
    return memberTasks;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Team Work</h1>
          <p className="page-subtitle">See what everyone on the team is currently working on.</p>
        </div>
        <select
          className="input bg-white w-auto"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading...</div>
      ) : filteredTeam.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No team members to show</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeam.map((m, idx) => {
            const memberTasks = openTasksFor(m.id);
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.role}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                    {memberTasks.length} open
                  </span>
                </div>
                {memberTasks.length === 0 ? (
                  <p className="text-xs text-slate-300 italic py-2">No open tasks</p>
                ) : (
                  <div className="space-y-1.5">
                    {memberTasks.slice(0, 5).map(t => (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/tasks?taskId=${t.id}`)}
                        className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-slate-700 truncate">{t.title}</p>
                          {selectedProjectId === 'all' && <p className="text-[10px] text-slate-400 truncate">{getProjectName(t.project_id)}</p>}
                        </div>
                        <span className={`badge shrink-0 ${statusStyles[t.status] || 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                      </div>
                    ))}
                    {memberTasks.length > 5 && (
                      <p className="text-xs text-slate-400 text-center pt-1">+{memberTasks.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamWork;
