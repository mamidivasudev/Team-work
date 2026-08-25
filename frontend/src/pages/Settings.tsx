import React, { useState, useEffect } from 'react';

type ToggleProps = {
  value: boolean;
  onChange: () => void;
};

const Toggle = ({ value, onChange }: ToggleProps) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

type SettingRowProps = {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
};

const SettingRow = ({ label, description, value, onChange }: SettingRowProps) => (
  <div className="flex items-center justify-between py-4 border-b last:border-b-0">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <Toggle value={value} onChange={onChange} />
  </div>
);

const Settings = () => {
  const [showAssigned, setShowAssigned] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCurrentTask, setShowCurrentTask] = useState(true);
  const [showTaskAssignee, setShowTaskAssignee] = useState(true);

  useEffect(() => {
    const savedAssigned = localStorage.getItem('setting_showTeamAssigned');
    const savedCompleted = localStorage.getItem('setting_showTeamCompleted');
    const savedCurrentTask = localStorage.getItem('setting_showTeamCurrentTask');
    const savedTaskAssignee = localStorage.getItem('setting_showTaskAssignee');

    if (savedAssigned !== null) setShowAssigned(savedAssigned === 'true');
    if (savedCompleted !== null) setShowCompleted(savedCompleted === 'true');
    if (savedCurrentTask !== null) setShowCurrentTask(savedCurrentTask === 'true');
    if (savedTaskAssignee !== null) setShowTaskAssignee(savedTaskAssignee === 'true');
  }, []);

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
      const password = window.prompt("Enter settings password to make changes:");
      if (password !== "Vasu@0897") {
        alert("Incorrect password.");
        return;
      }
    }
    
    const next = !value;
    setter(next);
    localStorage.setItem(key, next.toString());
  };

  const toggleAll = (enable: boolean) => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
      const password = window.prompt("Enter settings password to make changes:");
      if (password !== "Vasu@0897") {
        alert("Incorrect password.");
        return;
      }
    }

    setShowAssigned(enable);
    setShowCompleted(enable);
    setShowCurrentTask(enable);
    setShowTaskAssignee(enable);

    const val = enable.toString();
    localStorage.setItem('setting_showTeamAssigned', val);
    localStorage.setItem('setting_showTeamCompleted', val);
    localStorage.setItem('setting_showTeamCurrentTask', val);
    localStorage.setItem('setting_showTaskAssignee', val);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure what information is visible across the app.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => toggleAll(true)}
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            Enable All
          </button>
          <button 
            onClick={() => toggleAll(false)}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Team Visibility */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Team Page — Column Visibility</h2>
          </div>
          <div className="px-6">
            <SettingRow
              label="Show Current Task"
              description="Display the task a member is currently working on."
              value={showCurrentTask}
              onChange={() => toggle('setting_showTeamCurrentTask', showCurrentTask, setShowCurrentTask)}
            />
            <SettingRow
              label="Show Assigned Count"
              description="Show how many tasks are currently assigned to each member."
              value={showAssigned}
              onChange={() => toggle('setting_showTeamAssigned', showAssigned, setShowAssigned)}
            />
            <SettingRow
              label="Show Completed Count"
              description="Show how many tasks each member has completed."
              value={showCompleted}
              onChange={() => toggle('setting_showTeamCompleted', showCompleted, setShowCompleted)}
            />
          </div>
        </div>

        {/* Tasks Visibility */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tasks Page — Column Visibility</h2>
          </div>
          <div className="px-6">
            <SettingRow
              label="Show Assignee Column"
              description="Display who each task is assigned to in the task list."
              value={showTaskAssignee}
              onChange={() => toggle('setting_showTaskAssignee', showTaskAssignee, setShowTaskAssignee)}
            />
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">Changes are saved automatically and applied immediately.</p>
      </div>
    </div>
  );
};

export default Settings;
