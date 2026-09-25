import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

type ToggleProps = {
  value: boolean;
  onChange: () => void;
};

const Toggle = ({ value, onChange }: ToggleProps) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
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
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <Toggle value={value} onChange={onChange} />
  </div>
);

const Settings = () => {
  const [showAssigned, setShowAssigned] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCurrentTask, setShowCurrentTask] = useState(true);
  const [showTaskAssignee, setShowTaskAssignee] = useState(true);
  
  // Dashboard Settings
  const [dashTotalProjects, setDashTotalProjects] = useState(true);
  const [dashActiveProjects, setDashActiveProjects] = useState(true);
  const [dashTotalTasks, setDashTotalTasks] = useState(true);
  const [dashCompletionRate, setDashCompletionRate] = useState(true);

  // Dashboard Task Status Settings
  const [dashTodo, setDashTodo] = useState(true);
  const [dashInProgress, setDashInProgress] = useState(true);
  const [dashReview, setDashReview] = useState(true);
  const [dashBlocked, setDashBlocked] = useState(true);
  const [dashOverdue, setDashOverdue] = useState(true);

  // Navigation Menu Visibility
  const [navDashboard, setNavDashboard] = useState(true);
  const [navTeamWork, setNavTeamWork] = useState(true);
  const [navProjects, setNavProjects] = useState(true);
  const [navTasks, setNavTasks] = useState(true);
  const [navQAObservations, setNavQAObservations] = useState(true);
  const [navReports, setNavReports] = useState(true);
  const [navNotifications, setNavNotifications] = useState(true);
  const [navTeamMembers, setNavTeamMembers] = useState(true);

  useEffect(() => {
    const savedAssigned = localStorage.getItem('setting_showTeamAssigned');
    const savedCompleted = localStorage.getItem('setting_showTeamCompleted');
    const savedCurrentTask = localStorage.getItem('setting_showTeamCurrentTask');
    const savedTaskAssignee = localStorage.getItem('setting_showTaskAssignee');
    
    const savedDashTP = localStorage.getItem('setting_dashTotalProjects');
    const savedDashAP = localStorage.getItem('setting_dashActiveProjects');
    const savedDashTT = localStorage.getItem('setting_dashTotalTasks');
    const savedDashCR = localStorage.getItem('setting_dashCompletionRate');
    
    const savedDashTodo = localStorage.getItem('setting_dashTodo');
    const savedDashInProgress = localStorage.getItem('setting_dashInProgress');
    const savedDashReview = localStorage.getItem('setting_dashReview');
    const savedDashBlocked = localStorage.getItem('setting_dashBlocked');
    const savedDashOverdue = localStorage.getItem('setting_dashOverdue');

    if (savedAssigned !== null) setShowAssigned(savedAssigned === 'true');
    if (savedCompleted !== null) setShowCompleted(savedCompleted === 'true');
    if (savedCurrentTask !== null) setShowCurrentTask(savedCurrentTask === 'true');
    if (savedTaskAssignee !== null) setShowTaskAssignee(savedTaskAssignee === 'true');
    
    if (savedDashTP !== null) setDashTotalProjects(savedDashTP === 'true');
    if (savedDashAP !== null) setDashActiveProjects(savedDashAP === 'true');
    if (savedDashTT !== null) setDashTotalTasks(savedDashTT === 'true');
    if (savedDashCR !== null) setDashCompletionRate(savedDashCR === 'true');
    
    if (savedDashTodo !== null) setDashTodo(savedDashTodo === 'true');
    if (savedDashInProgress !== null) setDashInProgress(savedDashInProgress === 'true');
    if (savedDashReview !== null) setDashReview(savedDashReview === 'true');
    if (savedDashBlocked !== null) setDashBlocked(savedDashBlocked === 'true');
    if (savedDashOverdue !== null) setDashOverdue(savedDashOverdue === 'true');

    // Nav
    const setNav = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      const val = localStorage.getItem(key);
      if (val !== null) setter(val === 'true');
    };
    setNav('setting_nav_dashboard', setNavDashboard);
    setNav('setting_nav_teamwork', setNavTeamWork);
    setNav('setting_nav_projects', setNavProjects);
    setNav('setting_nav_tasks', setNavTasks);
    setNav('setting_nav_qaobservations', setNavQAObservations);
    setNav('setting_nav_reports', setNavReports);
    setNav('setting_nav_notifications', setNavNotifications);
    setNav('setting_nav_teammembers', setNavTeamMembers);
  }, []);

  const toggle = (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    // const isAdmin = localStorage.getItem('isAdmin') === 'true';
    // if (isAdmin) {
    //   const password = window.prompt("Enter settings password to make changes:");
    //   if (password !== "Vasu@0897") {
    //     alert("Incorrect password.");
    //     return;
    //   }
    // }

    const next = !value;
    setter(next);
    localStorage.setItem(key, next.toString());
    window.dispatchEvent(new Event('settings_updated'));
  };

  const toggleAll = (enable: boolean) => {
    // const isAdmin = localStorage.getItem('isAdmin') === 'true';
    // if (isAdmin) {
    //   const password = window.prompt("Enter settings password to make changes:");
    //   if (password !== "Vasu@0897") {
    //     alert("Incorrect password.");
    //     return;
    //   }
    // }

    const settings: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
      'setting_showTeamAssigned': setShowAssigned,
      'setting_showTeamCompleted': setShowCompleted,
      'setting_showTeamCurrentTask': setShowCurrentTask,
      'setting_showTaskAssignee': setShowTaskAssignee,
      'setting_dashTotalProjects': setDashTotalProjects,
      'setting_dashActiveProjects': setDashActiveProjects,
      'setting_dashTotalTasks': setDashTotalTasks,
      'setting_dashCompletionRate': setDashCompletionRate,
      'setting_dashTodo': setDashTodo,
      'setting_dashInProgress': setDashInProgress,
      'setting_dashReview': setDashReview,
      'setting_dashBlocked': setDashBlocked,
      'setting_dashOverdue': setDashOverdue,
      'setting_nav_dashboard': setNavDashboard,
      'setting_nav_teamwork': setNavTeamWork,
      'setting_nav_projects': setNavProjects,
      'setting_nav_tasks': setNavTasks,
      'setting_nav_qaobservations': setNavQAObservations,
      'setting_nav_reports': setNavReports,
      'setting_nav_notifications': setNavNotifications,
      'setting_nav_teammembers': setNavTeamMembers,
    };
    
    Object.entries(settings).forEach(([key, setter]) => {
      setter(enable);
      localStorage.setItem(key, enable.toString());
    });
    
    window.dispatchEvent(new Event('settings_updated'));
  };
  return (
    <div>
      <div className="mb-6 flex justify-between items-end max-w-2xl">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure what information is visible across the app.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toggleAll(true)}
            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Team Management */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Team Management</h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Add, edit, or remove team members</p>
              <p className="text-xs text-slate-500 mt-0.5">Manage names, roles, and login credentials.</p>
            </div>
            <Link to="/team" className="btn-secondary whitespace-nowrap">Manage Team</Link>
          </div>
        </div>

        {/* Dashboard Visibility */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Dashboard — Visibility</h2>
          </div>
          <div className="px-6">
            <SettingRow
              label="Show Total Projects"
              description="Display the total number of projects on the dashboard."
              value={dashTotalProjects}
              onChange={() => toggle('setting_dashTotalProjects', dashTotalProjects, setDashTotalProjects)}
            />
            <SettingRow
              label="Show Active Projects"
              description="Display the number of currently active projects on the dashboard."
              value={dashActiveProjects}
              onChange={() => toggle('setting_dashActiveProjects', dashActiveProjects, setDashActiveProjects)}
            />
            <SettingRow
              label="Show Total Tasks"
              description="Display the total number of tasks tracked across the system."
              value={dashTotalTasks}
              onChange={() => toggle('setting_dashTotalTasks', dashTotalTasks, setDashTotalTasks)}
            />
            <SettingRow
              label="Show Completion Rate"
              description="Display the overall percentage of completed tasks."
              value={dashCompletionRate}
              onChange={() => toggle('setting_dashCompletionRate', dashCompletionRate, setDashCompletionRate)}
            />
          </div>
        </div>

        {/* Dashboard Status Summary */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Dashboard — Task Statuses</h2>
          </div>
          <div className="px-6">
            <SettingRow
              label="Show To Do"
              description="Display the count of tasks that are yet to be started."
              value={dashTodo}
              onChange={() => toggle('setting_dashTodo', dashTodo, setDashTodo)}
            />
            <SettingRow
              label="Show In Progress"
              description="Display the count of tasks currently being worked on."
              value={dashInProgress}
              onChange={() => toggle('setting_dashInProgress', dashInProgress, setDashInProgress)}
            />
            <SettingRow
              label="Show Review"
              description="Display the count of tasks waiting for review."
              value={dashReview}
              onChange={() => toggle('setting_dashReview', dashReview, setDashReview)}
            />
            <SettingRow
              label="Show Blocked"
              description="Display the count of tasks that are blocked."
              value={dashBlocked}
              onChange={() => toggle('setting_dashBlocked', dashBlocked, setDashBlocked)}
            />
            <SettingRow
              label="Show Overdue"
              description="Display the count of tasks that are past their due date."
              value={dashOverdue}
              onChange={() => toggle('setting_dashOverdue', dashOverdue, setDashOverdue)}
            />
          </div>
        </div>

        {/* Team Visibility */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Team Page — Column Visibility</h2>
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
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tasks Page — Column Visibility</h2>
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

        {/* Navigation Menu Visibility */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Navigation — Menu Visibility</h2>
          </div>
          <div className="px-6">
            <SettingRow
              label="Show Dashboard"
              description="Display the Dashboard link in the sidebar."
              value={navDashboard}
              onChange={() => toggle('setting_nav_dashboard', navDashboard, setNavDashboard)}
            />
            <SettingRow
              label="Show Team Work"
              description="Display the Team Work link in the sidebar."
              value={navTeamWork}
              onChange={() => toggle('setting_nav_teamwork', navTeamWork, setNavTeamWork)}
            />
            <SettingRow
              label="Show Projects"
              description="Display the Projects link in the sidebar."
              value={navProjects}
              onChange={() => toggle('setting_nav_projects', navProjects, setNavProjects)}
            />
            <SettingRow
              label="Show Tasks"
              description="Display the Tasks link in the sidebar."
              value={navTasks}
              onChange={() => toggle('setting_nav_tasks', navTasks, setNavTasks)}
            />
            <SettingRow
              label="Show QA Observations"
              description="Display the QA Observations link in the sidebar."
              value={navQAObservations}
              onChange={() => toggle('setting_nav_qaobservations', navQAObservations, setNavQAObservations)}
            />
            <SettingRow
              label="Show Reports"
              description="Display the Reports link in the sidebar."
              value={navReports}
              onChange={() => toggle('setting_nav_reports', navReports, setNavReports)}
            />
            <SettingRow
              label="Show Notifications"
              description="Display the Notifications link in the sidebar."
              value={navNotifications}
              onChange={() => toggle('setting_nav_notifications', navNotifications, setNavNotifications)}
            />
            <SettingRow
              label="Show Team Members"
              description="Display the Team Members link in the sidebar (admin only)."
              value={navTeamMembers}
              onChange={() => toggle('setting_nav_teammembers', navTeamMembers, setNavTeamMembers)}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">Changes are saved automatically and applied immediately.</p>
      </div>
    </div>
  );
};

export default Settings;
