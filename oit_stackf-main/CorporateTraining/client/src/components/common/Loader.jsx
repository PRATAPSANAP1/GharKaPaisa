import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Loader = ({ size = 'lg', text }) => {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};

export default Loader;

