import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import IndividualSms from './IndividualSms';
import SmsReportsLogs from './SmsReportsLogs';
import BulkSms from './BulkSms';

const Sms = () => {
  return (
    <div>
      <Routes>
        <Route
          path="individual-sms"
          element={
            <RequirePermission module="messages" action="read">
              <IndividualSms />
            </RequirePermission>
          }
        />
        <Route
          path="sms-reports"
          element={
            <RequirePermission module="messages" action="read">
              <SmsReportsLogs />
            </RequirePermission>
          }
        />
        <Route
          path="bulk-sms"
          element={
            <RequirePermission module="messages" action="create">
              <BulkSms />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission module="messages" action="read">
              <IndividualSms />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Sms;