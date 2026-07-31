import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import AddContact from './AddContact';
import EditContact from './EditContact';
import Customers from './Customers';
import Companies from './Companies';

const Contacts = () => {
  return (
    <div>
      <Routes>
        <Route
          path="add"
          element={
            <RequirePermission
              module="contacts"
              action="create"
            >
              <AddContact />
            </RequirePermission>
          }
        />
        <Route
          path="edit/:id"
          element={
            <RequirePermission
              module="contacts"
              action="update"
            >
              <EditContact />
            </RequirePermission>
          }
        />
        <Route
          path="customers"
          element={
            <RequirePermission
              module="contacts"
              action="read"
            >
              <Customers />
            </RequirePermission>
          }
        />
        <Route
          path="companies"
          element={
            <RequirePermission
              module="contacts"
              action="read"
            >
              <Companies />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="contacts"
              action="read"
            >
              <Customers />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Contacts;