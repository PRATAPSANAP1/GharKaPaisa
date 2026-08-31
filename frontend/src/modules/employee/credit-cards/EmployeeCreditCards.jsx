import React from 'react';
import PartnerCategoryOverview from '../../partner/dashboard/PartnerCategoryOverview';

export default function EmployeeCreditCards({ defaultCategory = 'credit_card' }) {
  return <PartnerCategoryOverview defaultCategory={defaultCategory} />;
}
