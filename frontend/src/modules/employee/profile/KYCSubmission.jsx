import React from 'react';
import UnifiedEmployeeOnboarding from './UnifiedEmployeeOnboarding';

export default function KYCSubmission({ initialStep = 3 }) {
  return <UnifiedEmployeeOnboarding initialStep={initialStep} />;
}
