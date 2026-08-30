import React from 'react';
import ChatbotProductCard from './ChatbotProductCard';

export default function ChatbotProductList({ products, userRole, C }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="chatbot-product-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {products.map((product, idx) => (
        <ChatbotProductCard key={product.id || idx} product={product} userRole={userRole} C={C} />
      ))}
    </div>
  );
}
