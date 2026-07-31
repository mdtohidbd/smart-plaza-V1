import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import DamagedProducts from './DamagedProducts';
import StockAlert from './StockAlert';
import StockList from './StockList';
import StockIn from './StockIn';
import StockHistory from './StockHistory';

const Inventory = () => {
  console.log('Inventory route component rendered');
  return (
    <div>
      <Routes>
        {/*
        <Route
          path="opening"
          element={
            <RequirePermission
              module="inventory"
              action="create"
            >
              <OpeningStock />
            </RequirePermission>
          }
        />
        */}
        <Route
          path="damaged"
          element={
            <RequirePermission
              module="inventory"
              action="update"
            >
              <DamagedProducts />
            </RequirePermission>
          }
        />
        <Route
          path="stock-in"
          element={
            <RequirePermission
              module="inventory"
              action="create"
            >
              <StockIn />
            </RequirePermission>
          }
        />
        <Route
          path="alert"
          element={
            <RequirePermission
              module="inventory"
              action="read"
            >
              <StockAlert />
            </RequirePermission>
          }
        />
        <Route
          path="list"
          element={
            <RequirePermission
              module="inventory"
              action="read"
            >
              <StockList />
            </RequirePermission>
          }
        />
        <Route
          path="history"
          element={
            <RequirePermission
              module="inventory"
              action="read"
            >
              <StockHistory />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="inventory"
              action="read"
            >
              <StockList />
            </RequirePermission>
          }
        />
        <Route path="stock-list" element={<Navigate to="list" replace />} />
        <Route path="*" element={<Navigate to="list" replace />} />
      </Routes>
    </div>
  );
};

export default Inventory;