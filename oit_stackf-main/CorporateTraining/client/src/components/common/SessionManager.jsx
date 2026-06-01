import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const SessionManager = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  // 30 minutes in milliseconds
  const IDLE_TIMEOUT = 30 * 60 * 1000; 

  const handleLogout = () => {
    dispatch(logout());
    toast('You have been logged out due to inactivity.', { icon: '💤' });
    navigate('/login');
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Set initial timer
    resetTimer();

    // Events to monitor for activity
    const events = ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove'];

    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated]); // Only re-bind if authentication status changes

  // This is a logic-only component, it renders nothing
  return null;
};

export default SessionManager;
