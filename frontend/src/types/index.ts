export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  created_at: string;
  members?: TeamMember[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  assignee_ids: number[];
  assignees?: TeamMember[];
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  username?: string;
  role: string;
  current_task: string;
  assigned_tasks: number;
  completed_tasks: number;
  status: string;
  task_project_ids: number[];
  project_ids: number[];
}

export interface Activity {
  id: number;
  action: string;
  description: string;
  created_at: string;
}

export interface DashboardData {
  projects_summary: { total: number; active: number; completed: number };
  tasks_summary: { total: number; completed: number; in_progress: number; blocked: number };
  recent_activities: Activity[];
  project_progress: { id: number; name: string; progress: number; tasks: number; completed: number; in_progress: number; blocked: number }[];
}
