import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import WholesaleSales from './WholesaleSales';
import WholesaleRecords from './WholesaleRecords';
import SalesReturn from './SalesReturn';
import SalesDueCollection from './SalesDueCollection';
import AllSales from './AllSales';
import RetailSales from './RetailSales';
import RetailRecords from './RetailRecords';
import SaleDetail from './SaleDetail';
import Transfers from './Transfers';
import AddTransfer from './AddTransfer';
import WarrantyManagement from '../Warranty/WarrantyManagement';

const Sales = () => {
  console.log('Sales route component rendered');
  return (
    <div>
      <Routes>
        <Route
          path="wholesale"
          element={
            <RequirePermission
              module="sales"
              action="create"
            >
              <WholesaleSales />
            </RequirePermission>
          }
        />
        <Route
          path="wholesale-records"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <WholesaleRecords />
            </RequirePermission>
          }
        />
        <Route
          path="retail"
          element={
            <RequirePermission
              module="sales"
              action="create"
            >
              <RetailSales />
            </RequirePermission>
          }
        />
        <Route
          path="retail-records"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <RetailRecords />
            </RequirePermission>
          }
        />
        <Route
          path="warranty"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <WarrantyManagement />
            </RequirePermission>
          }
        />
        <Route
          path="return"
          element={
            <RequirePermission
              module="sales"
              action="create"
            >
              <SalesReturn />
            </RequirePermission>
          }
        />
        <Route
          path="due-collection"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <SalesDueCollection />
            </RequirePermission>
          }
        />
        <Route
          path="all"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <AllSales />
            </RequirePermission>
          }
        />
        <Route
          path="transfers"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <Transfers />
            </RequirePermission>
          }
        />
        <Route
          path="transfers/add"
          element={
            <RequirePermission
              module="sales"
              action="create"
            >
              <AddTransfer />
            </RequirePermission>
          }
        />
        <Route
          path=":id"
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <SaleDetail />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="sales"
              action="read"
            >
              <AllSales />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Sales;