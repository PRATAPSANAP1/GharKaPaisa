import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Chatbot from '../components/Chatbot/Chatbot';

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Chatbot />
    </>
  );
};

export default PublicLayout;
