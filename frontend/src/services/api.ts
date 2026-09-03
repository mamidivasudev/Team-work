import axios from 'axios';
import type { Project, Task, TeamMember, Activity, DashboardData, Tag, TaskRelationship, TaskAttachment, ProjectReportRow, TeamWorkloadRow, SearchResults } from '../types';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  const isAdmin = localStorage.getItem('isAdmin');
  
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  if (isAdmin) {
    config.headers['X-Is-Admin'] = isAdmin;
  }
  
  return config;
});

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProject = async (data: any): Promise<Project> => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const updateProject = async (id: number, data: any): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const getTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (data: Partial<Task>): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  await api.delete(`/tasks/${id}`);
};

export const getTaskComments = async (taskId: number) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const addTaskComment = async (taskId: number, content: string, userId: number) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { content, user_id: userId });
  return response.data;
};

export const saveObservation = async (title: string, content: string, project_id: number) => {
  const response = await api.post('/observations/save', { title, content, project_id });
  return response.data;
};

export const getObservationsList = async () => {
  const response = await api.get('/observations');
  return response.data;
};

export const getObservation = async (filename: string) => {
  const response = await api.get(`/observations/${filename}`);
  return response.data;
};

export const deleteObservationFile = async (filename: string) => {
  const response = await api.delete(`/observations/${filename}`);
  return response.data;
};

export const uploadObservationFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/observations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getTeam = async (): Promise<TeamMember[]> => {
  const response = await api.get('/team');
  return response.data;
};

export const createTeamMember = async (data: { name: string; role: string }): Promise<TeamMember> => {
  const response = await api.post('/team', data);
  return response.data;
};

export const updateTeamMember = async (id: number, data: any): Promise<TeamMember> => {
  const response = await api.put(`/team/${id}`, data);
  return response.data;
};

export const deleteTeamMember = async (id: number): Promise<void> => {
  await api.delete(`/team/${id}`);
};

export const loginUser = async (credentials: any) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const resetPassword = async (username: string) => {
  const response = await api.post('/reset-password', { username });
  return response.data;
};

export const getActivities = async (): Promise<Activity[]> => {
  const response = await api.get('/activity');
  return response.data;
};

export const clearActivities = async (): Promise<void> => {
  await api.delete('/activity');
};

export const updateTask = async (taskId: number, data: Partial<Task>): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, data);
  return response.data;
};

export const updateTaskStatus = async (taskId: number, status: string): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, { status });
  return response.data;
};

export const getTaskActivity = async (taskId: number): Promise<Activity[]> => {
  const response = await api.get(`/tasks/${taskId}/activity`);
  return response.data;
};

export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags');
  return response.data;
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const response = await api.post('/tags', { name, color });
  return response.data;
};

export const deleteTag = async (tagId: number): Promise<void> => {
  await api.delete(`/tags/${tagId}`);
};

export const getTaskRelationships = async (taskId: number): Promise<TaskRelationship[]> => {
  const response = await api.get(`/tasks/${taskId}/relationships`);
  return response.data;
};

export const createTaskRelationship = async (taskId: number, relatedTaskId: number, relationshipType: string): Promise<TaskRelationship> => {
  const response = await api.post(`/tasks/${taskId}/relationships`, { related_task_id: relatedTaskId, relationship_type: relationshipType });
  return response.data;
};

export const deleteTaskRelationship = async (relationshipId: number): Promise<void> => {
  await api.delete(`/task-relationships/${relationshipId}`);
};

export const getTaskAttachments = async (taskId: number): Promise<TaskAttachment[]> => {
  const response = await api.get(`/tasks/${taskId}/attachments`);
  return response.data;
};

export const uploadTaskAttachment = async (taskId: number, file: File): Promise<TaskAttachment> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteTaskAttachment = async (attachmentId: number): Promise<void> => {
  await api.delete(`/attachments/${attachmentId}`);
};

export const getAttachmentDownloadUrl = (attachmentId: number): string => {
  return `${API_URL}/attachments/${attachmentId}/download`;
};

export const globalSearch = async (q: string): Promise<SearchResults> => {
  const response = await api.get('/search', { params: { q } });
  return response.data;
};

export const getProjectsReport = async (): Promise<ProjectReportRow[]> => {
  const response = await api.get('/reports/projects');
  return response.data;
};

export const getTeamWorkloadReport = async (): Promise<TeamWorkloadRow[]> => {
  const response = await api.get('/reports/team-workload');
  return response.data;
};

export const getOverdueReport = async (): Promise<Task[]> => {
  const response = await api.get('/reports/overdue');
  return response.data;
};
