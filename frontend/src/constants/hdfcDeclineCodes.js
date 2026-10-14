/**
 * Centralized HDFC Credit Card Decline Codes and Curing Designation Mapping
 * Total 51 codes across 3 Curing Designations:
 * - PHYSICAL_CURABLE: 26 codes
 * - DIGITAL_CURABLE: 17 codes
 * - EMAIL_CURABLE: 8 codes
 */

export const CURING_DESIGNATIONS = {
  PHYSICAL_CURABLE: 'PHYSICAL_CURABLE',
  DIGITAL_CURABLE: 'DIGITAL_CURABLE',
  EMAIL_CURABLE: 'EMAIL_CURABLE',
};

export const CURING_DESIGNATION_LABELS = {
  PHYSICAL_CURABLE: 'Physical Curable',
  DIGITAL_CURABLE: 'Digital Curable',
  EMAIL_CURABLE: 'Email Curable',
};

export const CURING_DESIGNATION_BADGES = {
  PHYSICAL_CURABLE: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    pillBg: '#2563eb',
    label: 'Physical Curable'
  },
  DIGITAL_CURABLE: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    pillBg: '#059669',
    label: 'Digital Curable'
  },
  EMAIL_CURABLE: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    pillBg: '#d97706',
    label: 'Email Curable'
  }
};

export const HDFC_DECLINE_CODES = [
  // --- PHYSICAL CURING (26 codes) ---
  { code: '41', type: 'SALARY CHECK NEGATIVE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '15R', type: 'RESI PHYSCL REPEAT CUR FAILURE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '82', type: 'LOW INCOME', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '86N', type: 'ONL NOT MEETS POLICY GUIDELINE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '141', type: 'BIZ VERIF NEGATIVE CURABLE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '14', type: 'BIZ VERIFICATION NEGATIVE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '14R', type: 'BIZ PHYSCL REPEAT CUR FAILURE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '426', type: 'COMPANY NAME MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '15', type: 'RESI VERIFICATION NEGATIVE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '16D', type: 'MULTIPLE DEFECT LETTER', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '15W', type: 'RESI DRLOCK REPEAT CUR FAILURE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '431', type: 'Business proof required', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '3F', type: 'PROMO CODE BLANK', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '429', type: 'AFU PRE CPV REJECT', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '417', type: 'OFFICE APPOINTMENT REQUIRED', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '424', type: 'DOB MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '882', type: 'INCORRECT DESIGNATION', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '425', type: 'PAN MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '52', type: 'CITY MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '884', type: 'INCORRECT EMPLOYER NAME', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '414', type: 'CLEAR DOCUMENT REQUIRED', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '151', type: 'RES VERIF NEGATIVE CURABLE', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '34A', type: 'NAME MM BETWEEN APPL & PROOF', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '35', type: 'DOB MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '16R', type: 'POOR CONTACT REPEAT', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },
  { code: '427', type: 'MOBILE MISMATCH', designation: CURING_DESIGNATIONS.PHYSICAL_CURABLE },

  // --- DIGITAL CURING (17 codes) ---
  { code: '86D', type: 'ONL INCOME DOCS REQD', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '412', type: 'LATEST INCOME PROOF REQUIRED', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '413', type: 'BANK STATEMENT REQUIRED', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '415', type: 'BANK ACCOUNT NUMBER REQUIRED', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '420', type: 'FORM 16 OR 26 AS REQUIRED', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '32', type: 'INCOME DOCS NOT AS PER POLICY', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '824', type: 'BUSINESS CARD TO NON SELF EMPL', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '823', type: 'NOT ELIGIBLE FOR PRODUCT', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '15S', type: 'SHORT RESIDENCE ADDRESS', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '86I', type: 'INVALID INCORRECT COMPANY NAME', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '86C', type: 'ONL SALARIED WITH SINGLE ADD', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: 'EM1', type: 'EMAIL ID Curing', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '14S', type: 'SHORT BUSINESS ADDRESS', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '37E', type: 'EKYC SELF DECLN REQUIRED', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '8', type: 'PER ADD AND DET NOT AS PER POL', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '86F', type: 'ONL PAN MM WITH FLEX', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },
  { code: '86E', type: 'ONLY AUTOPAY MANDATE', designation: CURING_DESIGNATIONS.DIGITAL_CURABLE },

  // --- EMAIL CURING (8 codes) ---
  { code: '418', type: 'DOCUMENT REQUIRED AS PER PROMO', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '142', type: 'CHANGE IN BUSINESS ADDRESS', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '152', type: 'CHANGE IN RESIDENCE ADDRESS', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '92', type: 'NEVER APPLIED AS PER VERIFICAT', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '06A', type: 'SLC MNEMONIC CODE OR COMPANY COD', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '91', type: 'NOT INTERESTED', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '422', type: 'OFFICE LANDMARK REQUIRED', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
  { code: '86L', type: 'NO ELIGIBILITY C4C LB PROGRAM', designation: CURING_DESIGNATIONS.EMAIL_CURABLE },
];

export const HDFC_DECLINE_CODES_MAP = {};
HDFC_DECLINE_CODES.forEach(item => {
  const normKey = String(item.code).trim().toUpperCase();
  HDFC_DECLINE_CODES_MAP[normKey] = {
    ...item,
    designationLabel: CURING_DESIGNATION_LABELS[item.designation] || item.designation,
    label: `${item.code} - ${item.type}`,
  };
});

// Special decline options
export const HDFC_SPECIAL_DECLINE_OPTIONS = [
  { code: 'None', type: 'None', label: 'None' },
  { code: 'CIBIL decline', type: 'CIBIL decline', label: 'CIBIL decline' },
];

HDFC_DECLINE_CODES_MAP['NONE'] = {
  code: 'None',
  type: 'None',
  description: 'None',
  designation: null,
  designationLabel: 'None',
  label: 'None',
};

HDFC_DECLINE_CODES_MAP['CIBIL DECLINE'] = {
  code: 'CIBIL decline',
  type: 'CIBIL decline',
  description: 'CIBIL decline',
  designation: null,
  designationLabel: 'Non-Curable',
  label: 'CIBIL decline',
};

/**
 * Get curing designation for an HDFC decline code
 * @param {string} code 
 * @returns {'PHYSICAL_CURABLE' | 'DIGITAL_CURABLE' | 'EMAIL_CURABLE' | null}
 */
export function getHdfcCuringDesignation(code) {
  if (!code) return null;
  const norm = String(code).trim().toUpperCase();
  const found = HDFC_DECLINE_CODES_MAP[norm];
  return found ? found.designation : null;
}

/**
 * Get full decline code item for an HDFC decline code
 * @param {string} code 
 */
export function getHdfcDeclineCodeInfo(code) {
  if (!code) return null;
  const norm = String(code).trim().toUpperCase();
  return HDFC_DECLINE_CODES_MAP[norm] || null;
}
