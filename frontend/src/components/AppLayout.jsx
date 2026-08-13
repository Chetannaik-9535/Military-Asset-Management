// src/components/AppLayout.jsx

import React from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-ops-black">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar />
      <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</main>
    </div>
  </div>
);

export default AppLayout;
