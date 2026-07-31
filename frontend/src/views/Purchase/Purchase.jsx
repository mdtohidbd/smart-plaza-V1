import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import AddPurchase from './AddPurchase';
import AllPurchases from './AllPurchases';
import PurchaseReturn from './PurchaseReturn';
import PurchaseDuePayment from './PurchaseDuePayment';

const Purchase = () => {
  console.log('Purchase route component rendered');
  return (
    <div>
      <Routes>
        <Route
          path="add"
          element={
            <RequirePermission
              module="purchase"
              action="create"
            >
              <AddPurchase />
            </RequirePermission>
          }
        />
        <Route
          path="all"
          element={
            <RequirePermission
              module="purchase"
              action="read"
            >
              <AllPurchases />
            </RequirePermission>
          }
        />
        <Route
          path="return"
          element={
            <RequirePermission
              module="purchase"
              action="create"
            >
              <PurchaseReturn />
            </RequirePermission>
          }
        />
        <Route
          path="due-payment"
          element={
            <RequirePermission
              module="purchase"
              action="update"
            >
              <PurchaseDuePayment />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="purchase"
              action="create"
            >
              <AddPurchase />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Purchase;