import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import Employees from './Employees';
import AddEmployee from './AddEmployee';
import EditEmployee from './EditEmployee';

const EmployeeRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequirePermission module="users" action="read">
            <Employees />
          </RequirePermission>
        }
      />
      <Route
        path="add"
        element={
          <RequirePermission module="users" action="create">
            <AddEmployee />
          </RequirePermission>
        }
      />
      <Route
        path="edit/:id"
        element={
          <RequirePermission module="users" action="update">
            <EditEmployee />
          </RequirePermission>
        }
      />
    </Routes>
  );
};

export default EmployeeRouter;
