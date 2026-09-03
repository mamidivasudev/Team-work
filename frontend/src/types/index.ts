export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  created_at: string;
  members?: TeamMember[];
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: TeamMember;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  filename: string;
  original_name: string;
  file_size?: number | null;
  uploaded_by?: number | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskMini {
  id: number;
  title: string;
  status: string;
  priority: string;
}

export interface TaskRelationship {
  id: number;
  task_id: number;
  related_task_id: number;
  relationship_type: 'blocks' | 'relates_to';
  created_at: string;
  direction: 'forward' | 'reverse';
  related_task: TaskMini;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  project_id: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  assignees?: TeamMember[];
  assignee_ids: number[];
  tags?: Tag[];
  attachments?: TaskAttachment[];
  qa_document_filename?: string | null;

  // QA Fields
  task_type?: string;
  dev_status?: string;
  qa_status?: string;
  support_status?: string;
  comments?: TaskComment[];
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
  task_id?: number | null;
  project_id?: number | null;
  created_at: string;
}

export interface DashboardData {
  projects_summary: { total: number; active: number; completed: number };
  tasks_summary: { total: number; completed: number; in_progress: number; blocked: number; review: number; overdue: number };
  recent_activities: Activity[];
  project_progress: { id: number; name: string; progress: number; tasks: number; completed: number; in_progress: number; blocked: number }[];
}

export interface ProjectReportRow {
  id: number;
  name: string;
  status: string;
  progress: number;
  total_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
}

export interface TeamWorkloadRow {
  id: number;
  name: string;
  role: string;
  open_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
}

export interface SearchResults {
  tasks: Task[];
  projects: Project[];
  team: TeamMember[];
}
