/**
 * Utility helper for Bank Application Number Formatting & Validation based on Bank Structure
 * 
 * SBI Bank: Exactly 13 numeric digits (e.g., 2925313102292)
 * HDFC Bank: Alphanumeric letters and numbers (e.g., D26I1045139850YZ)
 * AXIS Bank: Characters, numbers and hyphens (e.g., C1-00000080375505-C1)
 * Other/General Banks: Flexible alphanumeric with hyphens/slashes
 */

export const getBankAppNumberConfig = (bankName = '', productName = '', bankId = '') => {
  const combined = `${bankName || ''} ${productName || ''} ${bankId || ''}`.toUpperCase();

  // SBI Bank
  if (bankId === 'e7c2c604-139d-4fcf-a87c-695633535a02' || combined.includes('SBI') || combined.includes('STATE BANK')) {
    return {
      type: 'sbi',
      bankName: 'SBI Bank',
      placeholder: 'Enter 13-digit SBI App No (e.g. 2925313102292)',
      hint: 'SBI Format: Strictly 13 numeric digits',
      maxLength: 13,
      sanitize: (val) => String(val || '').replace(/\D/g, '').slice(0, 13),
      validate: (val) => !val || /^\d{13}$/.test(val),
      errorMessage: 'SBI Application Number must be exactly 13 numeric digits (e.g., 2925313102292)'
    };
  }

  // HDFC Bank & TATA Co-brand HDFC
  if (bankId === 'f0b5742d-f04d-4a91-b162-6009ddf6e345' || bankId === '1eacfa67-1187-48c7-adde-8a6edcfe9969' || combined.includes('HDFC') || combined.includes('TATA')) {
    return {
      type: 'hdfc',
      bankName: 'HDFC Bank',
      placeholder: 'Enter HDFC App No (e.g. D26I1045139850YZ)',
      hint: 'HDFC Format: Alphanumeric (e.g. D26I1045139850YZ)',
      maxLength: 25,
      sanitize: (val) => String(val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 25),
      validate: (val) => !val || /^[A-Z0-9]{8,25}$/.test(String(val).toUpperCase()),
      errorMessage: 'HDFC Application Number must be alphanumeric (letters & numbers, e.g., D26I1045139850YZ)'
    };
  }

  // AXIS Bank
  if (combined.includes('AXIS')) {
    return {
      type: 'axis',
      bankName: 'Axis Bank',
      placeholder: 'Enter Axis App No (e.g. C1-00000080375505-C1)',
      hint: 'Axis Format: Characters, numbers & hyphens (e.g. C1-00000080375505-C1)',
      maxLength: 30,
      sanitize: (val) => String(val || '').replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase().slice(0, 30),
      validate: (val) => !val || /^[A-Z0-9\-]{5,30}$/.test(String(val).toUpperCase()),
      errorMessage: 'Axis Application Number format should be like C1-00000080375505-C1'
    };
  }

  // Fallback / General Bank
  return {
    type: 'general',
    bankName: 'Bank',
    placeholder: 'Enter Bank Application / Ref Number',
    hint: 'Format: Alphanumeric, numbers, or hyphens',
    maxLength: 30,
    sanitize: (val) => String(val || '').replace(/[^a-zA-Z0-9\-_/]/g, '').toUpperCase().slice(0, 30),
    validate: (val) => true,
    errorMessage: 'Invalid Bank Application Number'
  };
};
