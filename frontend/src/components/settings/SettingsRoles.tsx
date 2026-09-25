import React, { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '../../services/api';
import type { Role } from '../../types';
import { Edit2, Trash2, Shield, Plus, X } from 'lucide-react';

const PERMISSIONS = [
  { id: 'view_all_data', label: 'View All Data', desc: 'Can see all projects and tasks (not just assigned)' },
  { id: 'manage_team', label: 'Manage Team', desc: 'Can add, edit, or remove team members' },
  { id: 'manage_projects', label: 'Manage Projects', desc: 'Can create, edit, or delete projects' },
  { id: 'manage_tasks', label: 'Manage Tasks', desc: 'Can create, edit, or delete tasks' },
  { id: 'manage_settings', label: 'Manage Settings', desc: 'Can access and change global app settings' },
  { id: 'manage_roles', label: 'Manage Roles', desc: 'Can create and assign roles' },
];

const SettingsRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formPerms, setFormPerms] = useState<string[]>([]);

  const loadData = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNew = () => {
    setEditingRole(null);
    setFormName('');
    setFormPerms([]);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    if (role.is_system) return;
    setEditingRole(role);
    setFormName(role.name);
    setFormPerms(role.permissions || []);
    setShowModal(true);
  };

  const togglePerm = (perm: string) => {
    if (formPerms.includes(perm)) {
      setFormPerms(formPerms.filter(p => p !== perm));
    } else {
      setFormPerms([...formPerms, perm]);
    }
  };

  const handleTogglePermission = async (role: Role, permId: string) => {
    if (role.is_system) return;
    
    const currentPerms = role.permissions || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter(p => p !== permId)
      : [...currentPerms, permId];
      
    // Optimistic UI update
    setRoles(roles.map(r => r.id === role.id ? { ...r, permissions: newPerms } : r));
    
    try {
      await updateRole(role.id, { name: role.name, permissions: newPerms });
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error updating role");
      loadData(); // Revert on error
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: formName, permissions: formPerms });
      } else {
        await createRole({ name: formName, permissions: formPerms });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error saving role");
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system) return;
    if (!window.confirm(`Are you sure you want to delete ${role.name}?`)) return;
    try {
      await deleteRole(role.id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error deleting role");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading roles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Roles & Permissions</h2>
          <p className="text-sm text-slate-500">Define access levels and assign them to your team.</p>
        </div>
        <button onClick={openNew} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="th w-48">Role Name</th>
                {PERMISSIONS.map(p => (
                  <th key={p.id} className="th text-center text-xs" title={p.desc}>
                    {p.label}
                  </th>
                ))}
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                    <Shield size={14} className={role.is_system ? 'text-indigo-500' : 'text-slate-400'} />
                    {role.name}
                    {role.is_system && <span className="badge bg-indigo-50 text-indigo-700 text-[10px]">System</span>}
                  </td>
                  {PERMISSIONS.map(p => {
                    const has = role.permissions?.includes(p.id);
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePermission(role, p.id)}
                          disabled={role.is_system}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded shadow-sm transition-colors ${role.is_system ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow'} ${has ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-transparent hover:bg-slate-300'}`}
                          title={role.is_system ? "System roles cannot be modified" : `Toggle ${p.label}`}
                        >
                          <svg className={`w-3.5 h-3.5 ${has ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    {!role.is_system && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(role)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(role)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <label className="label">Role Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="input"
                  placeholder="e.g. QA Tester"
                />
              </div>

              <div>
                <label className="label mb-3">Permissions</label>
                <div className="space-y-3">
                  {PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formPerms.includes(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                        <p className="text-xs text-slate-500">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl shrink-0">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={!formName.trim()} className="btn-primary">Save Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsRoles;
