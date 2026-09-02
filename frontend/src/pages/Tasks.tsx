import { useEffect, useState } from 'react';
import { getTasks, updateTaskStatus, getProjects, createTask, deleteTask, getTeam, updateTask, updateProject } from '../services/api';
import type { Task, Project, TeamMember } from '../types';
import { Plus, Trash2, Edit2, ClipboardList, ChevronDown, X, Eye, MessageSquare } from 'lucide-react';

const priorityStyles: Record<string, string> = {
  LOW:      'bg-gray-100 text-gray-600',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const statusStyles: Record<string, string> = {
  TODO:        'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED:     'bg-red-100 text-red-700',
  COMPLETED:   'bg-green-100 text-green-700',
};

import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingProjectMembers, setEditingProjectMembers] = useState<Project | null>(null);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<number[]>([]);

  const [taskForm, setTaskForm] = useState<{
    title: string,
    description: string,
    project_id: string,
    assignee_ids: number[],
    priority: string,
    status: string,
    task_type: string,
    dev_status: string,
    qa_status: string,
    support_status: string
  }>({
    title: '',
    description: '',
    project_id: '',
    assignee_ids: [],
    priority: 'MEDIUM',
    status: 'TODO',
    task_type: 'STANDARD',
    dev_status: 'PENDING',
    qa_status: 'PENDING',
    support_status: 'PENDING'
  });

  const [showAssignee, setShowAssignee] = useState(true);
  const [showSelfAssigned, setShowSelfAssigned] = useState(false);

  // Column filters
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    getProjects().then(setProjects);
    getTeam().then(setTeamMembers);
    fetchTasks();
    const savedShowAssignee = localStorage.getItem('setting_showTaskAssignee');
    if (savedShowAssignee !== null) setShowAssignee(savedShowAssignee === 'true');
  }, []);

  const fetchTasks = () => getTasks().then(setTasks);

  const handleStatusChange = async (taskId: number, status: string) => {
    await updateTaskStatus(taskId, status);
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(id);
      fetchTasks();
    }
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setTaskForm({ 
      title: '', 
      description: '', 
      project_id: projects.length === 1 ? projects[0].id.toString() : '', 
      assignee_ids: [], 
      priority: 'MEDIUM', 
      status: 'TODO' 
    });
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id.toString(),
      assignee_ids: task.assignees ? task.assignees.map(a => a.id) : [],
      priority: task.priority,
      status: task.status,
      task_type: task.task_type || 'STANDARD',
      dev_status: task.dev_status || 'PENDING',
      qa_status: task.qa_status || 'PENDING',
      support_status: task.support_status || 'PENDING'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.project_id) return;
    
    const payload = {
      ...taskForm,
      project_id: parseInt(taskForm.project_id)
    };

    if (editingTaskId) {
      await updateTask(editingTaskId, payload);
    } else {
      await createTask(payload);
    }
    
    setShowModal(false);
    fetchTasks();
  };

  let filteredTasks = selectedProjectId === 'all'
    ? tasks
    : tasks.filter(t => t.project_id.toString() === selectedProjectId);

  if (showSelfAssigned) {
    filteredTasks = filteredTasks.filter(t => t.assignee_ids.includes(currentUserId));
  }
  if (filterAssignee) {
    filteredTasks = filterAssignee === '__unassigned__'
      ? filteredTasks.filter(t => t.assignee_ids.length === 0)
      : filteredTasks.filter(t => t.assignee_ids.includes(parseInt(filterAssignee)));
  }
  if (filterPriority) {
    filteredTasks = filteredTasks.filter(t => t.priority === filterPriority);
  }
  if (filterStatus) {
    filteredTasks = filteredTasks.filter(t => t.status === filterStatus);
  }
  if (filterDate) {
    filteredTasks = filteredTasks.filter(t =>
      new Date(t.created_at).toLocaleDateString() === new Date(filterDate).toLocaleDateString()
    );
  }

  const anyFilterActive = filterAssignee || filterPriority || filterStatus || filterDate;

  const getProjectName = (id: number) => {
    return projects.find(p => p.id === id)?.name || '—';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          <select
            className="border rounded-lg px-3 py-2 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {!isAdmin && (
            <button
              onClick={() => setShowSelfAssigned(!showSelfAssigned)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                showSelfAssigned
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {showSelfAssigned ? '✓ My Tasks' : 'My Tasks'}
            </button>
          )}
          {anyFilterActive && (
            <button
              onClick={() => { setFilterAssignee(''); setFilterPriority(''); setFilterStatus(''); setFilterDate(''); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[25%]">Title</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[15%]">Project</th>
                {showAssignee && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ">
                    <div className="flex items-center gap-1">
                      <span>Assignee</span>
                      {filterAssignee && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{filteredTasks.length}</span>}
                    </div>
                    <select
                      value={filterAssignee}
                      onChange={e => setFilterAssignee(e.target.value)}
                      className="mt-1 block w-full border border-gray-200 rounded-md px-1 py-1 text-xs font-normal text-gray-700 bg-white focus:ring-1 focus:ring-blue-400 outline-none normal-case tracking-normal"
                    >
                      <option value="">All</option>
                      <option value="__unassigned__">Unassigned</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    {filterPriority && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{filteredTasks.length}</span>}
                  </div>
                  <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-1 py-0.5 text-xs font-normal text-gray-700 bg-white focus:ring-1 focus:ring-blue-400 outline-none normal-case tracking-normal"
                  >
                    <option value="">All</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {filterStatus && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{filteredTasks.length}</span>}
                  </div>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-1 py-0.5 text-xs font-normal text-gray-700 bg-white focus:ring-1 focus:ring-blue-400 outline-none normal-case tracking-normal"
                  >
                    <option value="">All</option>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="flex items-center gap-1">
                    <span>Created</span>
                    {filterDate && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{filteredTasks.length}</span>}
                  </div>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-1 py-0.5 text-xs font-normal text-gray-700 bg-white focus:ring-1 focus:ring-blue-400 outline-none normal-case tracking-normal"
                  />
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={showAssignee ? 7 : 6} className="px-6 py-16 text-center text-gray-400">
                    <ClipboardList size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-sm">
                      {anyFilterActive ? 'No tasks match the selected filters' : showSelfAssigned ? 'No tasks assigned to you' : 'No tasks yet — create one to get started'}
                    </p>
                    {anyFilterActive && (
                      <button
                        onClick={() => { setFilterAssignee(''); setFilterPriority(''); setFilterStatus(''); setFilterDate(''); }}
                        className="mt-3 text-xs text-blue-600 hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 cursor-pointer group" onClick={() => {
                      if (t.task_type === 'QA_OBSERVATION') {
                        const docTitle = t.title.split(' - Observation ')[0];
                        const safeTitle = Array.from(docTitle).filter(c => /[a-zA-Z0-9 \-_]/.test(c)).join('').trimEnd();
                        const filename = safeTitle ? `${safeTitle}_proj${t.project_id}.html` : `Observation_proj${t.project_id}.html`;
                        navigate(`/observations?doc=${encodeURIComponent(filename)}`);
                      } else {
                        openEditModal(t);
                      }
                    }}>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 group-hover:underline flex items-center gap-1.5">
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                          {t.task_type === 'QA_OBSERVATION' ? 'Click to view full document...' : t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => openEditModal(t)}>{getProjectName(t.project_id)}</td>
                    {showAssignee && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {isAdmin ? (
                          <select
                            value={t.assignees && t.assignees.length > 0 ? t.assignees[0].id.toString() : ""}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const newAssignees = selectedId ? [parseInt(selectedId)] : [];
                              updateTask(t.id, { assignee_ids: newAssignees }).then(() => fetchTasks());
                            }}
                            className="bg-transparent border-0 text-sm font-medium text-gray-700 cursor-pointer outline-none hover:bg-gray-100 rounded px-2 py-1 max-w-[120px]"
                          >
                            <option value="">Unassigned</option>
                            {(projects.find(p => p.id === t.project_id)?.members || []).map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        ) : (
                          t.assignees && t.assignees.length > 0 ? (
                            <div className="flex -space-x-1.5 cursor-pointer" onClick={() => openEditModal(t)}>
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
                                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 text-[10px] font-bold border-2 border-white">
                                  +{t.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic cursor-pointer hover:text-gray-600" onClick={() => openEditModal(t)}>Unassigned</span>
                          )
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isAdmin ? (
                        <select
                          value={t.priority}
                          onChange={(e) => {
                            const newPriority = e.target.value;
                            updateTask(t.id, { priority: newPriority }).then(() => fetchTasks());
                          }}
                          className={`border-0 rounded-full text-xs font-medium px-2 py-1 cursor-pointer outline-none ${priorityStyles[t.priority] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyles[t.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {t.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className={`border-0 rounded-full text-xs font-medium px-2 py-1 cursor-pointer outline-none ${statusStyles[t.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right sticky right-0 bg-white">
                      {isAdmin ? (
                        <>
                          <button onClick={() => openEditModal(t)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg mr-1 transition-colors" title="Edit"><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                        </>
                      ) : (
                        <button onClick={() => openEditModal(t)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition-colors" title="View details"><Eye size={15} /></button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-gray-800">
              {isAdmin ? (editingTaskId ? 'Edit Task' : 'Create New Task') : 'View Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="What needs to be done?"
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                {taskForm.task_type === 'QA_OBSERVATION' ? (
                  <div className="relative">
                    <div 
                      className="block w-full border border-gray-300 rounded-lg p-3 text-sm bg-gray-50 max-h-80 overflow-y-auto prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: taskForm.description }}
                    />
                    <div className="absolute top-2 right-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded shadow-sm opacity-80 pointer-events-none">
                      From Document
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const docTitle = taskForm.title.split(' - Observation ')[0];
                        const safeTitle = Array.from(docTitle).filter(c => /[a-zA-Z0-9 \-_]/.test(c)).join('').trimEnd();
                        const filename = safeTitle ? `${safeTitle}_proj${taskForm.project_id}.html` : `Observation_proj${taskForm.project_id}.html`;
                        navigate(`/observations?doc=${encodeURIComponent(filename)}`);
                      }}
                      className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded hover:bg-indigo-100 hover:text-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ClipboardList size={14} /> Open Full Source Document
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    rows={4}
                    placeholder="Add more details..."
                    disabled={!isAdmin}
                  />
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={taskForm.project_id}
                    onChange={e => setTaskForm({ ...taskForm, project_id: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={!isAdmin}
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select
                    value={taskForm.task_type}
                    onChange={e => setTaskForm({ ...taskForm, task_type: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isAdmin}
                  >
                    <option value="STANDARD">Standard Task</option>
                    <option value="QA_OBSERVATION">QA Observation</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isAdmin}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isAdmin}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {taskForm.task_type === 'QA_OBSERVATION' && (
                <div className="grid grid-cols-3 gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Dev Status</label>
                    <select
                      value={taskForm.dev_status}
                      onChange={e => setTaskForm({ ...taskForm, dev_status: e.target.value })}
                      className="block w-full border border-blue-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-blue-800 mb-1">QA Status</label>
                    <select
                      value={taskForm.qa_status}
                      onChange={e => setTaskForm({ ...taskForm, qa_status: e.target.value })}
                      className="block w-full border border-blue-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Support Status</label>
                    <select
                      value={taskForm.support_status}
                      onChange={e => setTaskForm({ ...taskForm, support_status: e.target.value })}
                      className="block w-full border border-blue-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-gray-700">Assignees</label>
                  {isAdmin && (
                    <div className="flex gap-3 text-xs">
                      <button 
                        type="button" 
                        onClick={() => {
                          const p = projects.find(p => p.id.toString() === taskForm.project_id);
                          const pMem = p?.members?.map(m => m.id) || [];
                          setTaskForm({ ...taskForm, assignee_ids: Array.from(new Set([...taskForm.assignee_ids, ...pMem])) });
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setTaskForm({ ...taskForm, assignee_ids: [] })}
                        className="text-gray-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>
                <div className={`max-h-24 overflow-y-auto border border-gray-300 rounded-lg p-1.5 space-y-0.5 bg-white shadow-sm ${!isAdmin && 'bg-gray-50'}`}>
                  {(() => {
                    const selectedProject = projects.find(p => p.id.toString() === taskForm.project_id);
                    const projectMemberIds = selectedProject?.members?.map(m => m.id) || [];
                    const availableMembers = teamMembers.filter(m => projectMemberIds.includes(m.id) || taskForm.assignee_ids.includes(m.id));
                    
                    if (!taskForm.project_id) {
                      return <p className="text-xs text-gray-400 text-center py-2">Please select a project first</p>;
                    }
                    if (availableMembers.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs text-gray-400 mb-2">No team members in this project</p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProjectMembers(selectedProject || null);
                                setSelectedProjectMembers(projectMemberIds);
                              }}
                              className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors font-medium"
                            >
                              Add Team Members
                            </button>
                          )}
                        </div>
                      );
                    }

                    return availableMembers.map(m => (
                      <label key={m.id} className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${isAdmin ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}>
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          checked={taskForm.assignee_ids.includes(m.id)}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            if (!isAdmin) return;
                            if (e.target.checked) {
                              setTaskForm({ ...taskForm, assignee_ids: [...taskForm.assignee_ids, m.id] });
                            } else {
                              setTaskForm({ ...taskForm, assignee_ids: taskForm.assignee_ids.filter(id => id !== m.id) });
                            }
                          }}
                        />
                        <span className={`text-sm ${!isAdmin ? 'text-gray-500' : 'text-gray-700'}`}>{m.name} <span className="text-[10px] text-gray-400">({m.role})</span></span>
                      </label>
                    ));
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  {isAdmin ? 'Cancel' : 'Close'}
                </button>
                {isAdmin && (
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">
                    {editingTaskId ? 'Save Changes' : 'Create Task'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {editingProjectMembers && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setEditingProjectMembers(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-gray-800">Add Team to Project</h2>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1 mb-4">
              {teamMembers.map(m => (
                <label key={m.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600"
                    checked={selectedProjectMembers.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProjectMembers([...selectedProjectMembers, m.id]);
                      } else {
                        setSelectedProjectMembers(selectedProjectMembers.filter(id => id !== m.id));
                      }
                    }}
                  />
                  <span className="text-sm">{m.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingProjectMembers(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button 
                onClick={async () => {
                  await updateProject(editingProjectMembers.id, { member_ids: selectedProjectMembers });
                  const updatedProjects = await getProjects();
                  setProjects(updatedProjects);
                  setEditingProjectMembers(null);
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
              >
                Save Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tasks;
