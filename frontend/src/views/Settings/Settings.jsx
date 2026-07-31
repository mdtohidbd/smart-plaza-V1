import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import General from './General';
import Modules from './Modules';
import SmsConfiguration from './SmsConfiguration';
import Banners from './Banners';
import PaymentConfig from './PaymentConfig';

const Settings = () => {
  return (
    <div>
      <Routes>
        <Route
          path="banners"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <Banners />
            </RequirePermission>
          }
        />
        <Route
          path="general"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <General />
            </RequirePermission>
          }
        />
        {/*
        <Route
          path="modules"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <Modules />
            </RequirePermission>
          }
        />
        */}
        {/*
        <Route
          path="routes"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <RoutesSettings />
            </RequirePermission>
          }
        />
        */}
        <Route
          path="sms"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <SmsConfiguration />
            </RequirePermission>
          }
        />
        <Route
          path="payment-config"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <PaymentConfig />
            </RequirePermission>
          }
        />
        {/*
        <Route
          path="shops"
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <Shops />
            </RequirePermission>
          }
        />
        */}
        <Route
          index
          element={
            <RequirePermission
              module="settings"
              action="read"
            >
              <General />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Settings;