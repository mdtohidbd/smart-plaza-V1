import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import EMIDashboard from './EMIDashboard';
import EMIOverdue from './EMIOverdue';
import EMIReceivable from './EMIReceivable';
import EMIReports from './EMIReports';
import EMISales from './EMISales';
import EMISaleDetail from './EMISaleDetail';
import EMICollections from './EMICollections';
import EMICollectionList from './EMICollectionList';

const EMI = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/emi/dashboard" replace />} />
      <Route path="dashboard" element={<EMIDashboard />} />
      <Route path="sales" element={<EMISales />} />
      <Route path="invoice/:id" element={<EMISaleDetail />} />
      <Route path="overdue" element={<EMIOverdue />} />
      <Route path="receivable" element={<EMIReceivable />} />
      <Route path="reports" element={<EMIReports />} />
      <Route path="collections" element={<EMICollections />} />
      <Route path="collections-list" element={<EMICollectionList />} />
    </Routes>
  );
};

export default EMI;

