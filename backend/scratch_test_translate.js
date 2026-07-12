const fs = require('fs');
const path = require('path');

const files = [
  '../frontend/src/modules/partner/dashboard/PartnerDashboardComponent.jsx',
  '../frontend/src/modules/partner/dashboard/PartnerTeam.jsx',
  '../frontend/src/modules/partner/wallet/PartnerWallet.jsx',
  '../frontend/src/modules/partner/leads/PartnerCrm.jsx',
  '../frontend/src/modules/partner/leads/PartnerApplications.jsx',
  '../frontend/src/modules/partner/kyc/PartnerKyc.jsx',
  '../frontend/src/modules/partner/profile/PartnerProfile.jsx',
  '../frontend/src/modules/partner/profile/PartnerVault.jsx',
  '../frontend/src/modules/partner/products/PartnerProducts.jsx',
  '../frontend/src/modules/partner/products/TravelUtilitiesPage.jsx'
];

const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'p', 'td', 'th', 'label', 'option', 'li', 'a', 'strong', 'small', 'div'];

files.forEach(relPath => {
  const filePath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Ensure useTranslation import is present
  if (!content.includes('useTranslation') && !content.includes('react-i18next')) {
    // Inject import
    const importRegex = /import React[^\n]*from 'react';/g;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, "import React from 'react';\nimport { useTranslation } from 'react-i18next';");
    } else {
      content = "import { useTranslation } from 'react-i18next';\n" + content;
    }
  }

  // 2. Ensure const { t } = useTranslation() is defined inside the main component
  const componentRegex = /(export default function [A-Za-z0-9]+[^{]*{)/g;
  const arrowComponentRegex = /(const [A-Za-z0-9]+ = \([^)]*\) => {)/g;
  
  let hasTranslationInit = content.includes('useTranslation()');
  
  if (!hasTranslationInit) {
    if (componentRegex.test(content)) {
      content = content.replace(componentRegex, "$1\n  const { t } = useTranslation();");
    } else if (arrowComponentRegex.test(content)) {
      content = content.replace(arrowComponentRegex, "$1\n  const { t } = useTranslation();");
    }
  }

  let count = 0;

  // 3. Replace text inside tags
  tags.forEach(tag => {
    const regex = new RegExp(`(<${tag}[^>]*>)([^<>{}\\n\\t]+)(</${tag}>)`, 'g');
    content = content.replace(regex, (match, p1, p2, p3) => {
      const trimmed = p2.trim();
      // Skip empty, pure numeric/symbol, or already translated strings
      if (!trimmed || /^[^a-zA-Z]+$/.test(trimmed) || trimmed.startsWith('{t(')) {
        return match;
      }
      count++;
      // Safe string escaping for double quotes inside double quotes
      const escaped = trimmed.replace(/"/g, '\\"');
      return `${p1}{t("${escaped}")}${p3}`;
    });
  });

  // 4. Translate placeholders
  const placeholderRegex = /placeholder="([^"]+)"/g;
  content = content.replace(placeholderRegex, (match, p1) => {
    if (p1.startsWith('{t(') || /^[^a-zA-Z]+$/.test(p1)) return match;
    count++;
    return `placeholder={t("${p1.replace(/"/g, '\\"')}")}`;
  });

  // 5. Translate title attributes
  const titleRegex = /title="([^"]+)"/g;
  content = content.replace(titleRegex, (match, p1) => {
    if (p1.startsWith('{t(') || /^[^a-zA-Z]+$/.test(p1)) return match;
    count++;
    return `title={t("${p1.replace(/"/g, '\\"')}")}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}: Wrapped ${count} text nodes/attributes with t()`);
  } else {
    console.log(`No updates needed for ${path.basename(filePath)}`);
  }
});
