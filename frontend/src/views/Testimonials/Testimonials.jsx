import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import TestimonialsManagement from './TestimonialsManagement';

const Testimonials = () => {
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <RequirePermission
              module="testimonials"
              action="read"
            >
              <TestimonialsManagement />
            </RequirePermission>
          }
        />
        <Route
          index
          element={
            <RequirePermission
              module="testimonials"
              action="read"
            >
              <TestimonialsManagement />
            </RequirePermission>
          }
        />
      </Routes>
    </div>
  );
};

export default Testimonials;
