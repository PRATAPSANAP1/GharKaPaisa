import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Chatbot from '../components/Chatbot/Chatbot';
import HomeMobileBottomNav from '../components/HomeMobileBottomNav';
import SEO from '../components/SEO';

const PublicLayout = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = path === '/login' || path === '/register';

  return (
    <>
      <SEO />
      {!isAuthPage && <Navbar />}
      <Outlet />
      <Chatbot />
      {!isAuthPage && <HomeMobileBottomNav />}
    </>
  );
};

export default PublicLayout;
