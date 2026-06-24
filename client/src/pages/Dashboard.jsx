import React from 'react';
import { useSelector } from 'react-redux';
import CitizenDashboard from './CitizenDashboard';
import LawyerDashboard from './LawyerDashboard';
import JudgeDashboard from './JudgeDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'citizen') {
    return <CitizenDashboard />;
  }
  if (user?.role === 'lawyer') {
    return <LawyerDashboard />;
  }
  if (user?.role === 'judge') {
    return <JudgeDashboard />;
  }
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Dashboard;
