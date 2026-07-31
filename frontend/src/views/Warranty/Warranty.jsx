import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import WarrantyManagement from './WarrantyManagement';

const Warranty = () => {
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <RequirePermission
              module="warranty"
              action="read"
            >
              <WarrantyManagement />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="warranty"
              action="read"
            >
              <WarrantyManagement />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Warranty;