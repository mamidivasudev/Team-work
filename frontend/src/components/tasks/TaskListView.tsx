import { ClipboardList, Edit2, Trash2, Eye, CalendarClock, FileText } from 'lucide-react';
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
  onEditTask?: (task: Task) => void;
  onEditProjectMembers?: (projectId: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onPriorityChange: (taskId: number, priority: string) => void;
  onAssigneeChange: (taskId: number, assigneeIds: number[]) => void;
  selectedTaskIds?: number[];
  onSelectTask?: (id: number) => void;
  onSelectAll?: () => void;
}

const TaskListView = ({
  tasks, projects, teamMembers, showAssignee, isAdmin, anyFilterActive, showSelfAssigned,
  filterAssignee, setFilterAssignee, filterPriority, setFilterPriority,
  filterStatus, setFilterStatus, filterDate, setFilterDate, onClearFilters,
  onOpenTask, onEditTask, onEditProjectMembers, onDelete, onStatusChange, onPriorityChange, onAssigneeChange,
  selectedTaskIds = [], onSelectTask, onSelectAll
}: TaskListViewProps) => {
  const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || '—';

  return (
    <div className="card overflow-hidden">
      <table className="w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left w-10">
              <input 
                type="checkbox" 
                className="accent-indigo-600 cursor-pointer w-4 h-4 rounded border-slate-300"
                checked={tasks.length > 0 && selectedTaskIds.length === tasks.length}
                onChange={() => onSelectAll && onSelectAll()}
              />
            </th>
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
              <td colSpan={showAssignee ? 9 : 8} className="px-6 py-16 text-center text-slate-400">
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
                <td className="px-4 py-2">
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 cursor-pointer w-4 h-4 rounded border-slate-300"
                    checked={selectedTaskIds.includes(t.id)}
                    onChange={() => onSelectTask && onSelectTask(t.id)}
                  />
                </td>
                <td className="px-4 py-2 cursor-pointer group" onClick={() => onOpenTask(t)}>
                  <div className="flex flex-col group-hover:text-indigo-600 group-hover:underline" title={t.title}>
                    {t.title.startsWith('Observation ') && t.title.includes(': ') ? (
                      <>
                        <span className="text-xs font-bold text-indigo-500 mb-0.5 whitespace-nowrap">{t.title.split(': ')[0]}</span>
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[250px]">{t.title.split(': ').slice(1).join(': ')}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-900 truncate max-w-[250px]">{t.title}</span>
                    )}
                  </div>
                  {(t.description || (t.tags && t.tags.length > 0)) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {t.description && (
                        <div className="text-xs text-slate-400 max-w-[200px] truncate flex items-center gap-1" title={t.task_type === 'QA_OBSERVATION' ? t.qa_document_filename : undefined}>
                          {t.task_type === 'QA_OBSERVATION' 
                            ? (
                                <>
                                  <FileText size={12} className="text-slate-400 shrink-0" />
                                  {t.qa_document_filename ? t.qa_document_filename.replace(/_proj\d+\.html$/, '').replace(/\.html$/, '').replace(/html$/i, '').trim() : 'Document'}
                                </>
                              )
                            : t.description}
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
                      (() => {
                        const projectMembers = projects.find(p => p.id === t.project_id)?.members || [];
                        if (projectMembers.length === 0) {
                          return (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditProjectMembers) {
                                  onEditProjectMembers(t.project_id);
                                }
                              }}
                              className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer hover:bg-amber-100 transition-colors inline-block"
                              title="Click to add team members to this project"
                            >
                              ⚠ No team assigned
                            </span>
                          );
                        }
                        const isUnassigned = !t.assignees || t.assignees.length === 0;
                        return (
                          <select
                            value={isUnassigned ? "" : t.assignees[0].id.toString()}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              onAssigneeChange(t.id, selectedId ? [parseInt(selectedId)] : []);
                            }}
                            className={`border rounded-md text-sm cursor-pointer outline-none px-2 py-1 max-w-[130px] transition-colors ${
                              isUnassigned
                                ? 'border-dashed border-orange-300 text-orange-500 italic bg-orange-50 hover:bg-orange-100'
                                : 'border-0 bg-transparent font-medium text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <option value="">— Unassigned —</option>
                            {projectMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        );
                      })()
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
                    disabled={!t.assignees || t.assignees.length === 0}
                    title={(!t.assignees || t.assignees.length === 0) ? "Please assign a team member before changing the status" : ""}
                    className={`border-0 rounded-full text-xs font-medium px-2 py-1 outline-none ${
                      (!t.assignees || t.assignees.length === 0) 
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-70' 
                        : `cursor-pointer ${statusStyles[t.status] || 'bg-slate-100 text-slate-700'}`
                    }`}
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
                      <button onClick={(e) => { e.stopPropagation(); (onEditTask || onOpenTask)(t); }} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg mr-1 transition-colors" title="Edit Task Details"><Edit2 size={15} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete Task"><Trash2 size={15} /></button>
                    </>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); (onEditTask || onOpenTask)(t); }} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="View details"><Eye size={15} /></button>
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
