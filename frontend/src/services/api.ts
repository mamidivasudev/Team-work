import axios from 'axios';
import type { Project, Task, TeamMember, Activity, DashboardData } from '../types';

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
