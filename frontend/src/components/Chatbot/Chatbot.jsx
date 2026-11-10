import React, { Suspense, lazy } from 'react';

const ChatbotModule = lazy(() => import('../../modules/chatbot/Chatbot'));

export default function Chatbot() {
  return (
    <Suspense fallback={null}>
      <ChatbotModule />
    </Suspense>
  );
}
