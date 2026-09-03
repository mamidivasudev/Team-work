import { ClipboardList, Edit2, Trash2, Eye, CalendarClock } from 'lucide-react';
import type { Task, Project, TeamMember } from '../../types';
import { priorityStyles, statusStyles, statusLabels, isOverdue } from './taskStyles';

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  showAssignee: boolean;
  isAdmin: boolean;
  anyFilterActive: boolean;
  showSelfAssigned: boolean;
  filterAssignee: string;
  setFilterAssignee: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterDate: string;
  setFilterDate: (v: string) => void;
  onClearFilters: () => void;
  onOpenTask: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onPriorityChange: (taskId: number, priority: string) => void;
  onAssigneeChange: (taskId: number, assigneeIds: number[]) => void;
}

const TaskListView = ({
  tasks, projects, teamMembers, showAssignee, isAdmin, anyFilterActive, showSelfAssigned,
  filterAssignee, setFilterAssignee, filterPriority, setFilterPriority,
  filterStatus, setFilterStatus, filterDate, setFilterDate, onClearFilters,
  onOpenTask, onDelete, onStatusChange, onPriorityChange, onAssigneeChange
}: TaskListViewProps) => {
  const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || '—';

  return (
    <div className="card overflow-hidden overflow-x-auto">
      <table className="w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="th w-[25%]">Title</th>
            <th className="th w-[15%]">Project</th>
            {showAssignee && (
              <th className="th">
                <div className="flex items-center gap-1">
                  <span>Assignee</span>
                  {filterAssignee && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{tasks.length}</span>}
                </div>
                <select
                  value={filterAssignee}
                  onChange={e => setFilterAssignee(e.target.value)}
                  className="mt-1 block w-full border border-slate-200 rounded-md px-1 py-1 text-xs font-normal text-slate-700 bg-white focus:ring-1 focus:ring-indigo-400 outline-none normal-case tracking-normal"
                >
                  <option value="">All</option>
                  <option value="__unassigned__">Unassigned</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </th>
            )}
            <th className="th">
              <div className="flex items-center gap-1">
                <span>Priority</span>
                {filterPriority && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{tasks.length}</span>}
              </div>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="mt-1 block w-full border border-slate-200 rounded-md px-1 py-0.5 text-xs font-normal text-slate-700 bg-white focus:ring-1 focus:ring-indigo-400 outline-none normal-case tracking-normal"
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </th>
            <th className="th">
              <div className="flex items-center gap-1">
                <span>Status</span>
                {filterStatus && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{tasks.length}</span>}
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="mt-1 block w-full border border-slate-200 rounded-md px-1 py-0.5 text-xs font-normal text-slate-700 bg-white focus:ring-1 focus:ring-indigo-400 outline-none normal-case tracking-normal"
              >
                <option value="">All</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </th>
            <th className="th">
              <div className="flex items-center gap-1">
                <span>Created</span>
                {filterDate && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{tasks.length}</span>}
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="mt-1 block w-full border border-slate-200 rounded-md px-1 py-0.5 text-xs font-normal text-slate-700 bg-white focus:ring-1 focus:ring-indigo-400 outline-none normal-case tracking-normal"
              />
            </th>
            <th className="th">Due Date</th>
            <th className="th text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={showAssignee ? 8 : 7} className="px-6 py-16 text-center text-slate-400">
                <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-sm">
                  {anyFilterActive ? 'No tasks match the selected filters' : showSelfAssigned ? 'No tasks assigned to you' : 'No tasks yet — create one to get started'}
                </p>
                {anyFilterActive && (
                  <button onClick={onClearFilters} className="mt-3 text-xs text-indigo-600 hover:underline">
                    Clear all filters
                  </button>
                )}
              </td>
            </tr>
          ) : (
            tasks.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 cursor-pointer group" onClick={() => onOpenTask(t)}>
                  <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 group-hover:underline flex items-center gap-1.5">
                    {t.title}
                  </div>
                  {(t.description || (t.tags && t.tags.length > 0)) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {t.description && (
                        <div className="text-xs text-slate-400 max-w-[160px] truncate">
                          {t.task_type === 'QA_OBSERVATION' ? 'Click to view full document...' : t.description}
                        </div>
                      )}
                      {t.tags?.map(tag => (
                        <span key={tag.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 cursor-pointer" onClick={() => onOpenTask(t)}>{getProjectName(t.project_id)}</td>
                {showAssignee && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {isAdmin ? (
                      <select
                        value={t.assignees && t.assignees.length > 0 ? t.assignees[0].id.toString() : ""}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          onAssigneeChange(t.id, selectedId ? [parseInt(selectedId)] : []);
                        }}
                        className="bg-transparent border-0 text-sm font-medium text-slate-700 cursor-pointer outline-none hover:bg-slate-100 rounded px-2 py-1 max-w-[120px]"
                      >
                        <option value="">Unassigned</option>
                        {(projects.find(p => p.id === t.project_id)?.members || []).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      t.assignees && t.assignees.length > 0 ? (
                        <div className="flex -space-x-1.5 cursor-pointer" onClick={() => onOpenTask(t)}>
                          {t.assignees.slice(0, 3).map((a, idx) => {
                            const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                            return (
                              <div
                                key={a.id}
                                className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white ${colors[idx % colors.length]}`}
                                title={a.name}
                              >
                                {a.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                          {t.assignees.length > 3 && (
                            <div className="h-6 w-6 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] font-bold border-2 border-white">
                              +{t.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic cursor-pointer hover:text-slate-600" onClick={() => onOpenTask(t)}>Unassigned</span>
                      )
                    )}
                  </td>
                )}
                <td className="px-4 py-2 whitespace-nowrap">
                  {isAdmin ? (
                    <select
                      value={t.priority}
                      onChange={(e) => onPriorityChange(t.id, e.target.value)}
                      className={`border-0 rounded-full text-xs font-medium px-2 py-1 cursor-pointer outline-none ${priorityStyles[t.priority] || 'bg-slate-100 text-slate-600'}`}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  ) : (
                    <span className={`badge ${priorityStyles[t.priority] || 'bg-slate-100 text-slate-600'}`}>
                      {t.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <select
                    value={t.status}
                    onChange={(e) => onStatusChange(t.id, e.target.value)}
                    className={`border-0 rounded-full text-xs font-medium px-2 py-1 cursor-pointer outline-none ${statusStyles[t.status] || 'bg-slate-100 text-slate-700'}`}
                  >
                    <option value="TODO">{statusLabels.TODO}</option>
                    <option value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</option>
                    <option value="REVIEW">{statusLabels.REVIEW}</option>
                    <option value="BLOCKED">{statusLabels.BLOCKED}</option>
                    <option value="COMPLETED">{statusLabels.COMPLETED}</option>
                  </select>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {t.due_date ? (
                    <span className={`inline-flex items-center gap-1 ${isOverdue(t) ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                      {isOverdue(t) && <CalendarClock size={12} />}
                      {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-300 italic">—</span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right sticky right-0 bg-white">
                  {isAdmin ? (
                    <>
                      <button onClick={() => onOpenTask(t)} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg mr-1 transition-colors" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => onDelete(t.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </>
                  ) : (
                    <button onClick={() => onOpenTask(t)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="View details"><Eye size={15} /></button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListView;
