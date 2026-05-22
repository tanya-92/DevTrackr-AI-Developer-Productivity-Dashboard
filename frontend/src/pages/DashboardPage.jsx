import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Overview from './dashboard/Overview';
import Repositories from './dashboard/Repositories';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/repos" element={<Repositories />} />
            {/* Add more routes like settings here */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
