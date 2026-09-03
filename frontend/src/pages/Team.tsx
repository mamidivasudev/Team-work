import React, { useEffect, useState } from 'react';
import { getTeam, getProjects, createTeamMember, deleteTeamMember, getTasks, updateTask, updateTeamMember } from '../services/api';
import type { TeamMember, Project } from '../types';
import { Plus, Trash2, Edit2, Eye, EyeOff, Users } from 'lucide-react';

const Team = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Reassignment Modal State
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [reassignToId, setReassignToId] = useState<string>('');

  const [showAssigned, setShowAssigned] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCurrentTask, setShowCurrentTask] = useState(true);

  useEffect(() => {
    getProjects().then(setProjects);
    fetchTeam();

    const savedAssigned = localStorage.getItem('setting_showTeamAssigned');
    const savedCompleted = localStorage.getItem('setting_showTeamCompleted');
    const savedCurrentTask = localStorage.getItem('setting_showTeamCurrentTask');
    if (savedAssigned !== null) setShowAssigned(savedAssigned === 'true');
    if (savedCompleted !== null) setShowCompleted(savedCompleted === 'true');
    if (savedCurrentTask !== null) setShowCurrentTask(savedCurrentTask === 'true');
  }, []);

  const fetchTeam = () => getTeam().then(setTeam);

  const handleDeleteClick = (member: TeamMember) => {
    if (member.assigned_tasks > 0) {
      setMemberToDelete(member);
      setReassignToId('');
    } else {
      if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
        deleteTeamMember(member.id).then(fetchTeam);
      }
    }
  };

  const confirmDeleteAndReassign = async () => {
    if (!memberToDelete) return;
    const allTasks = await getTasks();
    const tasksToReassign = allTasks.filter(t => t.assignee_ids?.includes(memberToDelete.id));
    const newAssigneeId = reassignToId ? parseInt(reassignToId) : undefined;
    for (const task of tasksToReassign) {
      // Remove the deleted member
      let newAssignees = (task.assignee_ids || []).filter(id => id !== memberToDelete.id);
      // Add the new member if specified and not already present
      if (newAssigneeId && !newAssignees.includes(newAssigneeId)) {
        newAssignees.push(newAssigneeId);
      }
      await updateTask(task.id, { ...task, assignee_ids: newAssignees });
    }
    await deleteTeamMember(memberToDelete.id);
    setMemberToDelete(null);
    fetchTeam();
  };

  const openCreateModal = () => {
    setEditingMemberId(null);
    setMemberForm({ name: '', role: '', username: '', password: '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setEditingMemberId(member.id);
    setMemberForm({ name: member.name, role: member.role, username: member.username || '', password: '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name) return;
    if (editingMemberId) {
      await updateTeamMember(editingMemberId, memberForm);
    } else {
      await createTeamMember(memberForm);
    }
    setShowModal(false);
    fetchTeam();
  };

  const filteredTeam = selectedProjectId === 'all'
    ? team
    : team.filter(m =>
        m.task_project_ids?.includes(parseInt(selectedProjectId)) ||
        m.project_ids?.includes(parseInt(selectedProjectId))
      );

  const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{filteredTeam.length} member{filteredTeam.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
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
          <button onClick={openCreateModal} className="btn-primary whitespace-nowrap">
            <Plus size={16} /> Add Team Member
          </button>
        </div>
      </div>

      {filteredTeam.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Users size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm mt-1">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Team Member</th>
                <th className="th">Role</th>
                {showCurrentTask && <th className="th">Current Task</th>}
                {showAssigned && <th className="th text-center">Assigned</th>}
                {showCompleted && <th className="th text-center">Completed</th>}
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredTeam.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-9 w-9 ${avatarColors[idx % avatarColors.length]} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                        {m.username && <div className="text-xs text-slate-400">@{m.username}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="badge bg-slate-100 text-slate-700">{m.role}</span>
                  </td>
                  {showCurrentTask && (
                    <td className="px-4 py-4 text-sm text-slate-600 max-w-[200px]">
                      <span className="truncate block" title={m.current_task}>
                        {m.current_task || <span className="text-slate-300 italic text-xs">None</span>}
                      </span>
                    </td>
                  )}
                  {showAssigned && (
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                        {m.assigned_tasks}
                      </span>
                    </td>
                  )}
                  {showCompleted && (
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                        {m.completed_tasks}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button onClick={() => openEditModal(m)} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg mr-1 transition-colors" title="Edit"><Edit2 size={15} /></button>
                    <button onClick={() => handleDeleteClick(m)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {showModal && (
        <div
          className="modal-overlay overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-panel p-6 max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-slate-900">{editingMemberId ? 'Edit Team Member' : 'Add Team Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="input"
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
              <div>
                <label className="label">Role</label>
                <input
                  type="text"
                  list="software-roles"
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="input"
                  required
                  placeholder="Search or select a role..."
                  autoComplete="off"
                />
                <datalist id="software-roles">
                  <option value="Frontend Developer" />
                  <option value="Backend Developer" />
                  <option value="Full Stack Developer" />
                  <option value="Mobile Developer (iOS)" />
                  <option value="Mobile Developer (Android)" />
                  <option value="DevOps Engineer" />
                  <option value="QA Engineer" />
                  <option value="Software Engineer" />
                  <option value="UI/UX Designer" />
                  <option value="Product Manager" />
                  <option value="Project Manager" />
                  <option value="Scrum Master" />
                  <option value="Data Scientist" />
                  <option value="Data Engineer" />
                  <option value="Database Administrator" />
                  <option value="System Administrator" />
                  <option value="Cloud Architect" />
                  <option value="Security Engineer" />
                  <option value="Machine Learning Engineer" />
                  <option value="Tech Lead" />
                  <option value="Engineering Manager" />
                </datalist>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Login Credentials <span className="text-slate-400 font-normal">(optional)</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Username</label>
                    <input
                      type="text"
                      value={memberForm.username || ''}
                      onChange={e => setMemberForm({ ...memberForm, username: e.target.value })}
                      className="input"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={memberForm.password || ''}
                        onChange={e => setMemberForm({ ...memberForm, password: e.target.value })}
                        className="input pr-9"
                        placeholder={editingMemberId ? '(unchanged)' : 'password'}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingMemberId ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Tasks Modal */}
      {memberToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setMemberToDelete(null)}
        >
          <div
            className="modal-panel p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Reassign Tasks Before Deleting</h2>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              <strong>{memberToDelete.name}</strong> has <strong>{memberToDelete.assigned_tasks}</strong> active tasks.
              Please reassign them before deleting this member.
            </p>

            <label className="label">Reassign tasks to:</label>
            <select
              value={reassignToId}
              onChange={e => setReassignToId(e.target.value)}
              className="input mb-5"
            >
              <option value="">Leave Unassigned</option>
              {team.filter(m => m.id !== memberToDelete.id).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setMemberToDelete(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDeleteAndReassign} className="btn bg-red-600 text-white hover:bg-red-700">
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Team;
