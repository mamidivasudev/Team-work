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
        <h1 className="text-2xl font-bold text-gray-800">Team</h1>
        <div className="flex gap-2">
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
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Team Member
          </button>
        </div>
      </div>

      {filteredTeam.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No team members yet</p>
          <p className="text-sm mt-1">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                {showCurrentTask && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Task</th>}
                {showAssigned && <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned</th>}
                {showCompleted && <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>}
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTeam.map((m, idx) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-9 w-9 ${avatarColors[idx % avatarColors.length]} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                        {m.username && <div className="text-xs text-gray-400">@{m.username}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">{m.role}</span>
                  </td>
                  {showCurrentTask && (
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px]">
                      <span className="truncate block" title={m.current_task}>
                        {m.current_task || <span className="text-gray-300 italic text-xs">None</span>}
                      </span>
                    </td>
                  )}
                  {showAssigned && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                        {m.assigned_tasks}
                      </span>
                    </td>
                  )}
                  {showCompleted && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                        {m.completed_tasks}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => openEditModal(m)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg mr-1 transition-colors" title="Edit"><Edit2 size={15} /></button>
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-gray-800">{editingMemberId ? 'Edit Team Member' : 'Add Team Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  list="software-roles"
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

              <div className="pt-3 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Login Credentials <span className="text-gray-400 font-normal">(optional)</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={memberForm.username || ''}
                      onChange={e => setMemberForm({ ...memberForm, username: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={memberForm.password || ''}
                        onChange={e => setMemberForm({ ...memberForm, password: e.target.value })}
                        className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm pr-9 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={editingMemberId ? '(unchanged)' : 'password'}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setMemberToDelete(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Reassign Tasks Before Deleting</h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              <strong>{memberToDelete.name}</strong> has <strong>{memberToDelete.assigned_tasks}</strong> active tasks.
              Please reassign them before deleting this member.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Reassign tasks to:</label>
            <select
              value={reassignToId}
              onChange={e => setReassignToId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Leave Unassigned</option>
              {team.filter(m => m.id !== memberToDelete.id).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteAndReassign} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium">
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
