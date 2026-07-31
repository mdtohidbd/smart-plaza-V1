import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { isSuperAdminPlus } from '../utils/roleUtils';

// Import Role-Specific Dashboards
import OwnerDashboard from './dashboards/OwnerDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import InvestorDashboard from './Investors/InvestorDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on role
  if (user.role === 'Super Admin' || user.role === 'Owner') {
    return <OwnerDashboard />;
  }

  if (isSuperAdminPlus(user)) {
    return <Navigate to="/dashboard/inventory/list" replace />;
  }

  if (user.role === 'Investor') {
    return <InvestorDashboard />;
  }

  // Default fallback for operational staff (Manager, Sales, etc.)
  return <StaffDashboard />;
};

export default DashboardRouter;
