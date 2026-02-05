import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') return <Navigate to="/dashboard/admin" />;
  if (user.role === 'employee') return <Navigate to="/dashboard/employee" />;
  return <Navigate to="/dashboard/client" />;
};

export default Dashboard;

