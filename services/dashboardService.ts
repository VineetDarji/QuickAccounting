import { Activity, SavedCalculation } from '../types';

type AdminDashboardStats = {
  calculations: number;
  total: number;
  active: number;
  unassigned: number;
  waiting: number;
  scheduled: number;
  clients: number;
  employees: number;
  admins?: number;
};

type AdminDashboardClient = {
  name: string;
  email: string;
  role: string;
  calcCount: number;
};

type DashboardAppointment = {
  caseId: string;
  caseTitle: string;
  clientName: string;
  clientEmail: string;
  date: string;
  status: string;
};

export type AdminDashboardPayload = {
  stats: AdminDashboardStats;
  clients: AdminDashboardClient[];
  calculations: SavedCalculation[];
  activities: Activity[];
  appointments: DashboardAppointment[];
};

export type EmployeeDashboardPayload = {
  stats: {
    total: number;
    active: number;
    waiting: number;
    scheduled: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: number;
    caseId: string;
    caseTitle: string;
    clientName: string;
    clientEmail: string;
  }>;
  appointments: DashboardAppointment[];
};

const parseJson = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
};

export const fetchAdminDashboard = async (): Promise<AdminDashboardPayload> => {
  const response = await fetch('/api/v1/dashboard/admin');
  return parseJson(response);
};

export const fetchEmployeeDashboard = async (email: string): Promise<EmployeeDashboardPayload> => {
  const response = await fetch(`/api/v1/dashboard/employee/${encodeURIComponent(email)}`);
  return parseJson(response);
};

