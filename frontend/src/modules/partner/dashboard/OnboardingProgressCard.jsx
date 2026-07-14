import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerService } from '../../../services/partner.api';
import { MdCheckCircle, MdOutlineRadioButtonUnchecked, MdArrowForward, MdCelebration, MdAutoAwesome } from 'react-icons/md';

export default function OnboardingProgressCard({ onTabChange, C }) {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOnboardingStatus = async () => {
    try {
      const res = await partnerService.getOnboarding();
      if (res?.data?.success) {
        setOnboarding(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  if (loading || !onboarding) {
    return null;
  }

  const {
    progress = 0,
    completed_steps_count = 0,
    total_steps_count = 6,
    is_fully_completed = false,
    steps = [],
    next_step = null
  } = onboarding;

  const handleNavigation = (redirectPath) => {
    if (!redirectPath) return;

    // Map route paths to tab keys if onTabChange is supplied
    if (onTabChange) {
      if (redirectPath.includes('profile')) onTabChange('profile');
      else if (redirectPath.includes('kyc')) onTabChange('kyc');
      else if (redirectPath.includes('wallet')) onTabChange('wallet');
      else if (redirectPath.includes('training')) onTabChange('training');
      else if (redirectPath.includes('products')) onTabChange('products');
      else if (redirectPath.includes('customers')) onTabChange('customers');
      else navigate(redirectPath);
    } else {
      navigate(redirectPath);
    }
  };

  return (
    <div style={{
      background: is_fully_completed
        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
        : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
      color: '#FFFFFF',
      borderRadius: '20px',
      padding: '24px 28px',
      marginBottom: '28px',
      boxShadow: '0 12px 32px rgba(49, 46, 129, 0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow element */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '180px',
        height: '180px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#A5B4FC',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <MdAutoAwesome style={{ color: '#F59E0B' }} />
            Welcome to GharKaPaisa
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {is_fully_completed ? '🎉 Account Fully Activated!' : 'Onboarding Progress'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '14px',
            fontWeight: 700
          }}>
            {completed_steps_count} of {total_steps_count} Steps
          </div>
          <div style={{
            background: '#F59E0B',
            color: '#1E1B4B',
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '14px',
            fontWeight: 800
          }}>
            {progress}% Completed
          </div>
        </div>
      </div>

      {/* Progress Bar Component */}
      <div style={{
        width: '100%',
        height: '10px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #F59E0B 0%, #10B981 100%)',
          borderRadius: '999px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {/* Steps Checklist Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {steps.map((step) => {
          return (
            <div
              key={step.key}
              onClick={() => handleNavigation(step.redirect)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: step.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: step.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {step.completed ? (
                <MdCheckCircle style={{ color: '#10B981', fontSize: '20px', flexShrink: 0 }} />
              ) : (
                <MdOutlineRadioButtonUnchecked style={{ color: '#9CA3AF', fontSize: '20px', flexShrink: 0 }} />
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: step.completed ? '#ECFDF5' : '#E0E7FF',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '11px', color: step.completed ? '#A7F3D0' : '#A5B4FC' }}>
                  Weight: {step.weight}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA Action Bar */}
      {!is_fully_completed && next_step ? (
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '12px 18px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#CBD5E1' }}>Recommended Next Action</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>{next_step.title}</div>
          </div>
          <button
            onClick={() => handleNavigation(next_step.redirect)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F59E0B',
              color: '#1E1B4B',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.2s ease'
            }}
          >
            <span>Complete {next_step.title}</span>
            <MdArrowForward style={{ fontSize: '18px' }} />
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          padding: '14px 20px'
        }}>
          <MdCelebration style={{ fontSize: '28px', color: '#F59E0B' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Congratulations! Your Partner Account is Fully Activated</div>
            <div style={{ fontSize: '13px', color: '#D1FAE5' }}>You have completed all mandatory onboarding tasks and can start referring customers to earn full payouts.</div>
          </div>
        </div>
      )}
    </div>
  );
}
