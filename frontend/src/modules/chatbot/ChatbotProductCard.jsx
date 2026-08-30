import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExternalLinkAlt, FaShareAlt, FaCreditCard, FaTag } from 'react-icons/fa';

export default function ChatbotProductCard({ product, userRole, C }) {
  const navigate = useNavigate();

  if (!product) return null;

  const handleViewDetails = () => {
    if (product.actionUrl) {
      if (product.actionUrl.startsWith('http')) {
        window.open(product.actionUrl, '_blank');
      } else {
        navigate(product.actionUrl);
      }
    } else {
      navigate(`/products/credit_card/${product.slug || product.id}`);
    }
  };

  const handleShare = () => {
    if (product.shareUrl) {
      if (navigator.share) {
        navigator.share({
          title: product.name,
          text: `Apply for ${product.name} on GharKaPaisa!`,
          url: product.shareUrl
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(product.shareUrl);
        alert('Product referral link copied to clipboard!');
      }
    }
  };

  return (
    <div 
      className="chatbot-product-card"
      style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: '16px',
        padding: '14px',
        margin: '8px 0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span 
          style={{
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: '10px',
            background: `${C.primary}15`,
            color: C.primary
          }}
        >
          {product.category ? product.category.replace('_', ' ') : 'Product'}
        </span>
        {product.rewardLabel && product.rewardValue && (
          <span 
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#22c55e',
              background: '#22c55e15',
              padding: '2px 8px',
              borderRadius: '10px'
            }}
          >
            {product.rewardLabel}: {product.rewardValue}
          </span>
        )}
      </div>

      {/* Product Image / Icon & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} 
          />
        ) : (
          <div 
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              background: C.bgSecondary, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: C.primary 
            }}
          >
            <FaCreditCard size={20} />
          </div>
        )}
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text }}>{product.name}</h4>
          <span style={{ fontSize: '11.5px', color: C.textMid, fontWeight: '500' }}>{product.bankName}</span>
        </div>
      </div>

      {/* Fee Structure */}
      {product.annualFee && (
        <div style={{ fontSize: '11.5px', color: C.textMid, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <FaTag size={11} color={C.primary} />
          <span>{product.annualFee}</span>
        </div>
      )}

      {/* Benefits bullets */}
      {product.description && (
        <p style={{ fontSize: '12px', color: C.text, margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {product.description}
        </p>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={handleViewDetails}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark || C.primary})`,
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>View Details</span>
          <FaExternalLinkAlt size={10} />
        </button>

        {product.shareUrl && (
          <button
            onClick={handleShare}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '20px',
              border: `1.5px solid ${C.border}`,
              background: C.bgSecondary,
              color: C.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Share Referral Link"
          >
            <FaShareAlt size={11} />
            <span>Share</span>
          </button>
        )}
      </div>
    </div>
  );
}
