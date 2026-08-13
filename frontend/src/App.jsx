// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Purchases from './pages/Purchases.jsx';
import Transfers from './pages/Transfers.jsx';
import Assignments from './pages/Assignments.jsx';
import Bases from './pages/Bases.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

    <Route
      path="/purchases"
      element={
        <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']}>
          <Purchases />
        </ProtectedRoute>
      }
    />

    <Route
      path="/transfers"
      element={
        <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']}>
          <Transfers />
        </ProtectedRoute>
      }
    />

    <Route
      path="/assignments"
      element={
        <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
          <Assignments />
        </ProtectedRoute>
      }
    />

    <Route
      path="/bases"
      element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Bases />
        </ProtectedRoute>
      }
    />

    <Route
      path="/users"
      element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Users />
        </ProtectedRoute>
      }
    />

    <Route
      path="/audit-log"
      element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AuditLogs />
        </ProtectedRoute>
      }
    />

    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
