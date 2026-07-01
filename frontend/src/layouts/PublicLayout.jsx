import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Chatbot from '../components/Chatbot/Chatbot';

const PublicLayout = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = path === '/login' || path === '/register';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Outlet />
      <Chatbot />
    </>
  );
};

export default PublicLayout;
