import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import Income from './Income';
import Expense from './Expense';
import ManageAccounts from './ManageAccounts';
import HeadsManagement from './HeadsManagement';
import ProfitAndLoss from './ProfitAndLoss';
import CashFlow from './CashFlow';

const Accounts = () => {
  return (
    <div>
      <Routes>
        <Route
          path="manage"
          element={
            <RequirePermission module="accounts" action="read">
              <ManageAccounts />
            </RequirePermission>
          }
        />
        <Route
          path="heads"
          element={
            <RequirePermission module="accounts" action="read">
              <HeadsManagement />
            </RequirePermission>
          }
        />
        <Route
          path="income"
          element={
            <RequirePermission module="accounts" action="read">
              <Income />
            </RequirePermission>
          }
        />
        <Route
          path="expense"
          element={
            <RequirePermission module="accounts" action="read">
              <Expense />
            </RequirePermission>
          }
        />
        <Route
          path="profit-loss"
          element={
            <RequirePermission module="reports" action="read">
              <ProfitAndLoss />
            </RequirePermission>
          }
        />
        <Route
          path="cash-flow"
          element={
            <RequirePermission module="reports" action="read">
              <CashFlow />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission module="accounts" action="read">
              <ManageAccounts />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Accounts;