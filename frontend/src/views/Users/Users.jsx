import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import AddUser from './AddUser';
import AllUsers from './AllUsers';
import Roles from './Roles';
// import SRList from './SRList';
import CustomRoleList from './CustomRoleList';
import UserApproval from './UserApproval';

const Users = () => {
  return (
    <div>
      <Routes>
        <Route
          path="add"
          element={
            <RequirePermission
              module="users"
              action="create"
            >
              <AddUser />
            </RequirePermission>
          }
        />
        <Route
          path="all"
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <AllUsers />
            </RequirePermission>
          }
        />
        <Route
          path="roles"
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <Roles />
            </RequirePermission>
          }
        />
        {/*
        <Route
          path="sr-list"
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <SRList />
            </RequirePermission>
          }
        />
        */}
        {/*
        <Route
          path="dsr-list"
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <DSRList />
            </RequirePermission>
          }
        />
        */}
        {/*
        <Route
          path="custom-roles"
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <CustomRoleList />
            </RequirePermission>
          }
        />
        */}
        <Route
          path="approval"
          element={
            <RequirePermission
              module="users"
              action="update"
            >
              <UserApproval />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="users"
              action="read"
            >
              <AllUsers />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Users;