import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getTasks, updateTaskStatus, getProjects, createTask, deleteTask, getTeam, updateTask, updateProject,
  getTaskComments, addTaskComment, getTags
} from '../services/api';
import type { Task, Project, TeamMember, TaskComment, Tag } from '../types';
import { Plus, ClipboardList, X, Send, MessageSquare, List, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { resolveQaDocFilename } from '../utils/qaDocument';
import TaskListView from '../components/tasks/TaskListView';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskCalendar from '../components/tasks/TaskCalendar';
import TaskTagsPicker from '../components/tasks/TaskTagsPicker';
import TaskRelationshipsPanel from '../components/tasks/TaskRelationshipsPanel';
import TaskAttachmentsPanel from '../components/tasks/TaskAttachmentsPanel';
import TaskActivityPanel from '../components/tasks/TaskActivityPanel';

type ViewMode = 'list' | 'board' | 'calendar';

const Tasks = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('setting_taskViewMode') as ViewMode) || 'list');
  const setAndPersistViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('setting_taskViewMode', mode);
  };

  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingProjectMembers, setEditingProjectMembers] = useState<Project | null>(null);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<number[]>([]);

  const [taskForm, setTaskForm] = useState<{
    title: string,
    description: string,
    project_id: string,
    assignee_ids: number[],
    tag_ids: number[],
    priority: Task['priority'],
    status: Task['status'],
    due_date: string,
    task_type: string,
    dev_status: string,
    qa_status: string,
    support_status: string
  }>({
    title: '',
    description: '',
    project_id: '',
    assignee_ids: [],
    tag_ids: [],
    priority: 'MEDIUM',
    status: 'TODO',
    due_date: '',
    task_type: 'STANDARD',
    dev_status: 'PENDING',
    qa_status: 'PENDING',
    support_status: 'PENDING'
  });

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

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
    getTags().then(setAllTags);
    fetchTasks();
    const savedShowAssignee = localStorage.getItem('setting_showTaskAssignee');
    if (savedShowAssignee !== null) setShowAssignee(savedShowAssignee === 'true');
  }, []);

  const fetchTasks = () => getTasks().then(setTasks);

  const handleStatusChange = async (taskId: number, status: string) => {
    await updateTaskStatus(taskId, status);
    fetchTasks();
  };

  const handlePriorityChange = async (taskId: number, priority: string) => {
    await updateTask(taskId, { priority: priority as Task['priority'] });
    fetchTasks();
  };

  const handleAssigneeChange = async (taskId: number, assigneeIds: number[]) => {
    await updateTask(taskId, { assignee_ids: assigneeIds });
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
    setComments([]);
    setNewComment('');
    setTaskForm({
      title: '',
      description: '',
      project_id: projects.length === 1 ? projects[0].id.toString() : '',
      assignee_ids: [],
      tag_ids: [],
      priority: 'MEDIUM',
      status: 'TODO',
      due_date: '',
      task_type: 'STANDARD',
      dev_status: 'PENDING',
      qa_status: 'PENDING',
      support_status: 'PENDING'
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
      tag_ids: task.tags ? task.tags.map(t => t.id) : [],
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      task_type: task.task_type || 'STANDARD',
      dev_status: task.dev_status || 'PENDING',
      qa_status: task.qa_status || 'PENDING',
      support_status: task.support_status || 'PENDING'
    });
    setComments([]);
    setNewComment('');
    getTaskComments(task.id).then(setComments).catch(() => setComments([]));
    setShowModal(true);
  };

  const handleOpenTask = (task: Task) => {
    if (task.task_type === 'QA_OBSERVATION') {
      const filename = resolveQaDocFilename(task);
      navigate(`/observations?doc=${encodeURIComponent(filename)}`);
    } else {
      openEditModal(task);
    }
  };

  // Deep-link support: /tasks?taskId=123 opens that task's modal once loaded
  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');
    if (taskIdParam && tasks.length > 0) {
      const task = tasks.find(t => t.id === parseInt(taskIdParam));
      if (task) {
        handleOpenTask(task);
      }
      searchParams.delete('taskId');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchParams]);

  const handleAddComment = async () => {
    if (!editingTaskId || !newComment.trim()) return;
    const userId = parseInt(localStorage.getItem('userId') || '0');
    setPostingComment(true);
    try {
      await addTaskComment(editingTaskId, newComment.trim(), userId);
      setNewComment('');
      const updated = await getTaskComments(editingTaskId);
      setComments(updated);
    } finally {
      setPostingComment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.project_id) return;

    const payload = {
      ...taskForm,
      due_date: taskForm.due_date ? taskForm.due_date : null,
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
  const clearFilters = () => { setFilterAssignee(''); setFilterPriority(''); setFilterStatus(''); setFilterDate(''); };

  const projectTasksForRelationships = tasks.filter(t => t.project_id.toString() === taskForm.project_id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} {anyFilterActive || showSelfAssigned ? 'matching filters' : 'total'}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white">
            {([['list', List], ['board', LayoutGrid], ['calendar', CalendarIcon]] as [ViewMode, typeof List][]).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setAndPersistViewMode(mode)}
                title={mode[0].toUpperCase() + mode.slice(1)}
                className={`p-2 transition-colors ${viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon size={16} />
              </button>
            ))}
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
          {!isAdmin && (
            <button
              onClick={() => setShowSelfAssigned(!showSelfAssigned)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                showSelfAssigned
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
              }`}
            >
              {showSelfAssigned ? '✓ My Tasks' : 'My Tasks'}
            </button>
          )}
          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
          {isAdmin && (
            <button onClick={openCreateModal} className="btn-primary">
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <TaskListView
          tasks={filteredTasks}
          projects={projects}
          teamMembers={teamMembers}
          showAssignee={showAssignee}
          isAdmin={isAdmin}
          anyFilterActive={!!anyFilterActive}
          showSelfAssigned={showSelfAssigned}
          filterAssignee={filterAssignee}
          setFilterAssignee={setFilterAssignee}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          onClearFilters={clearFilters}
          onOpenTask={handleOpenTask}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onAssigneeChange={handleAssigneeChange}
        />
      )}
      {viewMode === 'board' && (
        <KanbanBoard
          tasks={filteredTasks}
          projects={projects}
          onOpenTask={handleOpenTask}
          onStatusChange={handleStatusChange}
        />
      )}
      {viewMode === 'calendar' && (
        <TaskCalendar tasks={filteredTasks} onOpenTask={handleOpenTask} />
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-panel p-6 max-w-3xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-slate-900">
              {isAdmin ? (editingTaskId ? 'Edit Task' : 'Create New Task') : 'View Task'}
            </h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 md:gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="label">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input"
                  placeholder="What needs to be done?"
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                {taskForm.task_type === 'QA_OBSERVATION' ? (
                  <div className="relative">
                    <div
                      className="block w-full border border-slate-300 rounded-lg p-3 text-sm bg-slate-50 max-h-80 overflow-y-auto prose prose-sm max-w-none text-slate-800"
                      dangerouslySetInnerHTML={{ __html: taskForm.description }}
                    />
                    <div className="absolute top-2 right-2 text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded shadow-sm opacity-80 pointer-events-none">
                      From Document
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const filename = resolveQaDocFilename({
                          title: taskForm.title,
                          project_id: parseInt(taskForm.project_id) || 0,
                          qa_document_filename: null
                        });
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
                    className="input"
                    rows={3}
                    placeholder="Add more details..."
                    disabled={!isAdmin}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:col-span-2">
                <div>
                  <label className="label">Project</label>
                  <select
                    value={taskForm.project_id}
                    onChange={e => setTaskForm({ ...taskForm, project_id: e.target.value })}
                    className="input"
                    required
                    disabled={!isAdmin}
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Task Type</label>
                  <select
                    value={taskForm.task_type}
                    onChange={e => setTaskForm({ ...taskForm, task_type: e.target.value })}
                    className="input"
                    disabled={!isAdmin}
                  >
                    <option value="STANDARD">Standard Task</option>
                    <option value="QA_OBSERVATION">QA Observation</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                    className="input"
                    disabled={!isAdmin}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                    className="input"
                    disabled={!isAdmin}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="max-w-[260px]">
                <label className="label">Due Date <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>

              {taskForm.task_type === 'QA_OBSERVATION' && (
                <div className="grid grid-cols-3 gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100 md:col-span-2">
                  <div className="col-span-1">
                    <label className="text-sm font-medium text-indigo-800 mb-1 block">Dev Status</label>
                    <select
                      value={taskForm.dev_status}
                      onChange={e => setTaskForm({ ...taskForm, dev_status: e.target.value })}
                      className="block w-full border border-indigo-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-sm font-medium text-indigo-800 mb-1 block">QA Status</label>
                    <select
                      value={taskForm.qa_status}
                      onChange={e => setTaskForm({ ...taskForm, qa_status: e.target.value })}
                      className="block w-full border border-indigo-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-sm font-medium text-indigo-800 mb-1 block">Support Status</label>
                    <select
                      value={taskForm.support_status}
                      onChange={e => setTaskForm({ ...taskForm, support_status: e.target.value })}
                      className="block w-full border border-indigo-200 rounded-lg p-2 text-sm outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="label mb-0">Assignees</label>
                  {isAdmin && (
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const p = projects.find(p => p.id.toString() === taskForm.project_id);
                          const pMem = p?.members?.map(m => m.id) || [];
                          setTaskForm({ ...taskForm, assignee_ids: Array.from(new Set([...taskForm.assignee_ids, ...pMem])) });
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, assignee_ids: [] })}
                        className="text-slate-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>
                <div className={`max-h-24 overflow-y-auto border border-slate-300 rounded-lg p-1.5 space-y-0.5 bg-white shadow-sm ${!isAdmin && 'bg-slate-50'}`}>
                  {(() => {
                    const selectedProject = projects.find(p => p.id.toString() === taskForm.project_id);
                    const projectMemberIds = selectedProject?.members?.map(m => m.id) || [];
                    const availableMembers = teamMembers.filter(m => projectMemberIds.includes(m.id) || taskForm.assignee_ids.includes(m.id));

                    if (!taskForm.project_id) {
                      return <p className="text-xs text-slate-400 text-center py-2">Please select a project first</p>;
                    }
                    if (availableMembers.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs text-slate-400 mb-2">No team members in this project</p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProjectMembers(selectedProject || null);
                                setSelectedProjectMembers(projectMemberIds);
                              }}
                              className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors font-medium"
                            >
                              Add Team Members
                            </button>
                          )}
                        </div>
                      );
                    }

                    return availableMembers.map(m => (
                      <label key={m.id} className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${isAdmin ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
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
                        <span className={`text-sm ${!isAdmin ? 'text-slate-500' : 'text-slate-700'}`}>{m.name} <span className="text-[10px] text-slate-400">({m.role})</span></span>
                      </label>
                    ));
                  })()}
                </div>
              </div>

              <div className="md:col-span-2">
                <TaskTagsPicker
                  allTags={allTags}
                  selectedTagIds={taskForm.tag_ids}
                  onChange={(tagIds) => setTaskForm({ ...taskForm, tag_ids: tagIds })}
                  onTagCreated={(tag) => setAllTags([...allTags, tag])}
                  isAdmin={isAdmin}
                />
              </div>

              {editingTaskId && (
                <>
                  <div className="pt-3 border-t border-slate-100 md:col-span-2">
                    <TaskRelationshipsPanel
                      taskId={editingTaskId}
                      projectTasks={projectTasksForRelationships}
                      isAdmin={isAdmin}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 md:col-span-2">
                    <TaskAttachmentsPanel taskId={editingTaskId} isAdmin={isAdmin} />
                  </div>

                  <div className="pt-3 border-t border-slate-100 md:col-span-2">
                    <TaskActivityPanel taskId={editingTaskId} />
                  </div>

                  <div className="pt-3 border-t border-slate-100 md:col-span-2">
                    <label className="label flex items-center gap-1.5">
                      <MessageSquare size={14} /> Comments
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1">No comments yet.</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700">
                                {c.user?.name || (c.user_id === 0 ? 'Admin' : 'Unknown')}
                              </span>
                              <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                        className="input"
                        placeholder="Add a status update or note..."
                      />
                      <button
                        type="button"
                        onClick={handleAddComment}
                        disabled={postingComment || !newComment.trim()}
                        className="btn-secondary px-3"
                        title="Post comment"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-2 md:col-span-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  {isAdmin ? 'Cancel' : 'Close'}
                </button>
                {isAdmin && (
                  <button type="submit" className="btn-primary">
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
          className="modal-overlay z-[60]"
          onClick={() => setEditingProjectMembers(null)}
        >
          <div
            className="modal-panel p-6 max-w-sm max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-slate-900">Add Team to Project</h2>
            <div className="max-h-64 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-1 mb-4">
              {teamMembers.map(m => (
                <label key={m.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600"
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
              <button onClick={() => setEditingProjectMembers(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={async () => {
                  await updateProject(editingProjectMembers.id, { member_ids: selectedProjectMembers });
                  const updatedProjects = await getProjects();
                  setProjects(updatedProjects);
                  setEditingProjectMembers(null);
                }}
                className="btn-primary"
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
