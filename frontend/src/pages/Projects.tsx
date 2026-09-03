import { useEffect, useState } from 'react';
import { getProjects, createProject, updateProject, deleteProject, getTeam } from '../services/api';
import type { Project, TeamMember } from '../types';
import { Plus, Trash2, Edit2, FolderOpen, Eye, X } from 'lucide-react';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
};

const avatarColors = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500',
  'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
];

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingMembersProject, setViewingMembersProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<{name: string, description: string, member_ids: number[], status?: string, progress?: number}>({ name: '', description: '', member_ids: [] });
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const fetchProjects = () => getProjects().then(setProjects);

  useEffect(() => {
    fetchProjects();
    getTeam().then(setTeamMembers);
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setNewProject({ name: '', description: '', member_ids: [] });
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingId(project.id);
    setNewProject({
      name: project.name,
      description: project.description || '',
      member_ids: project.members?.map(m => m.id) || [],
      status: project.status,
      progress: project.progress
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    if (editingId) {
      await updateProject(editingId, newProject);
    } else {
      await createProject(newProject);
    }

    setShowModal(false);
    fetchProjects();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this project? All its tasks will also be deleted.")) {
      await deleteProject(id);
      fetchProjects();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <FolderOpen size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No projects yet</p>
          {isAdmin && <p className="text-sm mt-1">Click "New Project" to create your first one.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="card p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="font-bold text-slate-900">{p.name}</h2>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                        title="Edit project"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-1 min-h-[2rem]">{p.description || <span className="italic text-slate-300">No description</span>}</p>
                {p.members && p.members.length > 0 && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex -space-x-2">
                      {p.members.slice(0, 5).map((m, idx) => (
                        <div
                          key={m.id}
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white ${avatarColors[idx % avatarColors.length]}`}
                          title={m.name}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {p.members.length > 5 && (
                        <div className="h-7 w-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] font-bold border-2 border-white">
                          +{p.members.length - 5}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setViewingMembersProject(p)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 p-1 rounded border border-transparent hover:border-indigo-100"
                      title="View all members"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`badge ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-panel p-6 max-w-md max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-slate-900">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Website Redesign"
                  required
                />
              </div>
              <div>
                <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Brief description of this project..."
                />
              </div>

              {editingId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={newProject.status || 'ACTIVE'}
                      onChange={e => setNewProject({ ...newProject, status: e.target.value })}
                      className="input bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProject.progress || 0}
                      onChange={e => setNewProject({ ...newProject, progress: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="label mb-0">
                    Team Members <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  {teamMembers.length > 0 && (
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewProject({ ...newProject, member_ids: teamMembers.map(m => m.id) })}
                        className="text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProject({ ...newProject, member_ids: [] })}
                        className="text-slate-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>
                <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-lg p-1.5 space-y-0.5 bg-slate-50">
                  {teamMembers.map(m => (
                    <label key={m.id} className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={newProject.member_ids.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProject({ ...newProject, member_ids: [...newProject.member_ids, m.id] });
                          } else {
                            setNewProject({ ...newProject, member_ids: newProject.member_ids.filter(id => id !== m.id) });
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700">{m.name} <span className="text-[10px] text-slate-400">({m.role})</span></span>
                    </label>
                  ))}
                  {teamMembers.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No team members available</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingMembersProject && (
        <div
          className="modal-overlay"
          onClick={() => setViewingMembersProject(null)}
        >
          <div
            className="modal-panel max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Team Members</h2>
              <button onClick={() => setViewingMembersProject(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto bg-slate-50">
              {viewingMembersProject.members && viewingMembersProject.members.length > 0 ? (
                <div className="space-y-2">
                  {viewingMembersProject.members.map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-tight">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No team members assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
