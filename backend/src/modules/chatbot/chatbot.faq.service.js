const logger = require('../../config/logger');
const securityService = require('./chatbot.security.service');

/**
 * Chatbot FAQ Service - Comprehensive FAQ knowledge base with role-aware responses
 * Implements security-first FAQ handling as per specification
 */
class ChatbotFAQService {
  /**
   * Comprehensive FAQ knowledge base
   * Questions are normalized to lowercase for matching
   */
  getFAQKnowledgeBase() {
    return {
      // Platform Information
      'what is gharkapaisa': {
        question: 'What is GharKaPaisa?',
        answer: 'GharKaPaisa is a financial services platform that helps users explore financial products, submit applications, track applications, and access partner and employee-assisted financial services.',
        chips: [
          { label: 'Explore Credit Cards', action: 'go_cards' },
          { label: 'Explore Loans', action: 'go_loans' },
          { label: 'Track Application', action: 'public_check_status' },
          { label: 'Partner Login', action: 'go_login' },
          { label: 'Contact Support', action: 'go_contact' }
        ],
        requiresAuth: false,
        category: 'platform'
      },

      // Partner Registration
      'how can i become a partner': {
        question: 'How can I become a Partner?',
        answer: 'Sure! You can register as a GharKaPaisa Partner and access partner features such as lead creation, product applications, application tracking, and referral-based workflows. Would you like to register now?',
        chips: [
          { label: 'Register as Partner', action: 'go_register' },
          { label: 'Already a Partner? Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'partner'
      },
      'i want to become a partner': {
        question: 'I want to become a partner',
        answer: 'Sure! You can register as a GharKaPaisa Partner and access partner features such as lead creation, product applications, application tracking, and referral-based workflows. Would you like to register now?',
        chips: [
          { label: 'Register as Partner', action: 'go_register' },
          { label: 'Already a Partner? Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'partner'
      },
      'partner registration': {
        question: 'Partner registration',
        answer: 'You can register as a GharKaPaisa Partner and access partner features such as lead creation, product applications, application tracking, and referral-based workflows.',
        chips: [
          { label: 'Register as Partner', action: 'go_register' },
          { label: 'Already a Partner? Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'partner'
      },

      // Partner Login
      'i already have a partner account': {
        question: 'I already have a Partner account',
        answer: 'Great! Please log in to your Partner account to access your dashboard, leads, applications, products, and other authorized Partner features.',
        chips: [
          { label: 'Partner Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'partner'
      },

      // Lead Creation
      'i want to create a new lead': {
        question: 'I want to create a new lead',
        answer: 'To create a lead, you need an authorized Partner or Employee account. Do you already have a Partner account?',
        chips: [
          { label: 'Yes, Login', action: 'go_login' },
          { label: 'Register as Partner', action: 'go_register' }
        ],
        requiresAuth: false,
        category: 'lead',
        roleBased: {
          'PARTNER': {
            answer: 'You can create a new lead from your Partner panel.',
            chips: [{ label: 'Create New Lead', action: 'go_add_lead_card' }]
          },
          'TEAM_MEMBER': {
            answer: 'You can create a new lead from your Partner panel.',
            chips: [{ label: 'Create New Lead', action: 'go_add_lead_card' }]
          },
          'EMPLOYEE': {
            answer: 'You can create a lead from your Employee panel.',
            chips: [{ label: 'Create New Lead', action: 'go_add_lead_card' }]
          },
          'ADMIN': {
            answer: 'As an Admin, you can access the CRM and Lead Management tools.',
            chips: [{ label: 'Manage Leads', action: 'go_admin_leads' }]
          },
          'SUPER_ADMIN': {
            answer: 'As Super Admin, you have full access to all lead management tools.',
            chips: [{ label: 'Manage Leads', action: 'go_admin_leads' }]
          }
        }
      },

      // Application Tracking
      'how can i track my application': {
        question: 'How can I track my application?',
        answer: 'I can help you track your application. If you\'re logged in, I can take you to your authorized application list. Your access is limited to applications you\'re permitted to view.',
        chips: [
          { label: 'Track Application', action: 'public_check_status' },
          { label: 'Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'application',
        roleBased: {
          'PARTNER': {
            answer: 'I can help you track your applications. Your access is limited to applications you\'re permitted to view.',
            chips: [{ label: 'View My Applications', action: 'go_applications' }]
          },
          'EMPLOYEE': {
            answer: 'I can help you track your applications. Your access is limited to applications you\'re permitted to view.',
            chips: [{ label: 'View My Applications', action: 'go_applications' }]
          }
        }
      },
      'track my application': {
        question: 'Track my application',
        answer: 'I can help you track your application. If you\'re logged in, I can take you to your authorized application list.',
        chips: [
          { label: 'Track Application', action: 'public_check_status' },
          { label: 'Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'application'
      },

      // View Applications
      'show my applications': {
        question: 'Show my applications',
        answer: 'Here are the applications available to you. You can select an application to view its current status and permitted details.',
        chips: [
          { label: 'Open My Applications', action: 'go_applications' }
        ],
        requiresAuth: true,
        category: 'application',
        roleBased: {
          'PARTNER': {
            answer: 'Here are the applications available to you. You can select an application to view its current status and permitted details.',
            chips: [{ label: 'Open My Applications', action: 'go_applications' }]
          },
          'EMPLOYEE': {
            answer: 'Here are your authorized applications. You can view your application status and available details.',
            chips: [{ label: 'My Applications', action: 'go_applications' }]
          }
        }
      },
      'my applications': {
        question: 'My applications',
        answer: 'Here are the applications available to you. You can select an application to view its current status and permitted details.',
        chips: [
          { label: 'Open My Applications', action: 'go_applications' }
        ],
        requiresAuth: true,
        category: 'application'
      },

      // Security: Cross-user access
      'can i see another partner\'s application': {
        question: 'Can I see another Partner\'s application?',
        answer: 'Sorry, you don\'t have permission to access another Partner\'s applications. I can only show applications that you\'re authorized to access.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'security'
      },
      'show me another partner\'s application': {
        question: 'Show me another partner\'s application',
        answer: 'Sorry, you don\'t have permission to access another Partner\'s applications. I can only show applications that you\'re authorized to access.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'security'
      },

      // Credit Cards
      'i want a credit card': {
        question: 'I want a credit card',
        answer: 'Sure! I can help you explore available credit card products. Select an option below:',
        chips: [
          { label: 'View Credit Cards', action: 'go_cards' },
          { label: 'Compare Cards', action: 'cards_start' },
          { label: 'Track Application', action: 'public_check_status' }
        ],
        requiresAuth: false,
        category: 'credit_card'
      },
      'need a credit card': {
        question: 'I need a credit card',
        answer: 'Sure! I can help you explore available credit card products.',
        chips: [
          { label: 'View Credit Cards', action: 'go_cards' },
          { label: 'Compare Cards', action: 'cards_start' }
        ],
        requiresAuth: false,
        category: 'credit_card'
      },
      'which credit card is best for me': {
        question: 'Which Credit Card is best for me?',
        answer: 'I can help you compare available cards based on their available features, eligibility criteria, benefits, and application requirements. Would you like to compare the available cards?',
        chips: [
          { label: 'Compare Credit Cards', action: 'cards_start' },
          { label: 'View All Cards', action: 'go_cards' }
        ],
        requiresAuth: false,
        category: 'credit_card'
      },
      'what documents are required for a credit card': {
        question: 'What documents are required for a Credit Card?',
        answer: 'Required documents can vary depending on the selected product. Typically, the product/application flow will show the documents required for that specific card. Select a card to view its requirements.',
        chips: [
          { label: 'View Credit Cards', action: 'go_cards' }
        ],
        requiresAuth: false,
        category: 'credit_card'
      },
      'where can i find credit cards': {
        question: 'Where can I find Credit Cards?',
        answer: 'You can explore available Credit Card products from the Credit Cards section.',
        chips: [
          { label: 'View Credit Cards', action: 'go_cards' }
        ],
        requiresAuth: false,
        category: 'credit_card'
      },

      // Loans
      'i want a loan': {
        question: 'I want a loan',
        answer: 'Sure. I can help you explore the available loan products. Please select the type of loan you\'re interested in.',
        chips: [
          { label: 'Personal Loan', action: 'loans_personal' },
          { label: 'Business Loan', action: 'loans_business' },
          { label: 'View All Loans', action: 'go_loans' }
        ],
        requiresAuth: false,
        category: 'loan'
      },
      'i need a loan': {
        question: 'I need a loan',
        answer: 'Sure. I can help you explore the available loan products. Please select the type of loan you\'re interested in.',
        chips: [
          { label: 'Personal Loan', action: 'loans_personal' },
          { label: 'Business Loan', action: 'loans_business' },
          { label: 'View All Loans', action: 'go_loans' }
        ],
        requiresAuth: false,
        category: 'loan'
      },
      'where can i find loans': {
        question: 'Where can I find Loans?',
        answer: 'You can explore the available loan products from the Loans section.',
        chips: [
          { label: 'View Loans', action: 'go_loans' }
        ],
        requiresAuth: false,
        category: 'loan'
      },

      // Application Process
      'how do i apply for a product': {
        question: 'How do I apply for a product?',
        answer: 'To apply, select the financial product you\'re interested in and follow the application process provided for that product. If you\'re using a Partner or Employee referral link, your application may be attributed to the relevant Partner or Employee.',
        chips: [
          { label: 'Explore Products', action: 'go_cards' }
        ],
        requiresAuth: false,
        category: 'application'
      },

      // Application Status
      'what is my application status': {
        question: 'What is my application status?',
        answer: 'Please log in to view the applications you\'re authorized to access. Once you\'re logged in, I can direct you to your application section.',
        chips: [
          { label: 'Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'application',
        roleBased: {
          'PARTNER': {
            answer: 'You can view your application status from your applications section.',
            chips: [{ label: 'View My Applications', action: 'go_applications' }]
          },
          'EMPLOYEE': {
            answer: 'You can view your application status from your applications section.',
            chips: [{ label: 'View My Applications', action: 'go_applications' }]
          }
        }
      },
      'what\'s the status of my application': {
        question: 'What\'s the status of my application?',
        answer: 'Please log in to view the applications you\'re authorized to access.',
        chips: [
          { label: 'Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'application'
      },
      'why is my application pending': {
        question: 'Why is my application pending?',
        answer: 'Your application may be pending because one or more verification or processing steps are still in progress. Please open your application details to view the latest available status and timeline.',
        chips: [
          { label: 'View Application', action: 'go_applications' }
        ],
        requiresAuth: true,
        category: 'application'
      },
      'my application is pending': {
        question: 'My application is pending',
        answer: 'Your application may be pending because one or more verification or processing steps are still in progress. Please open your application details to view the latest available status and timeline.',
        chips: [
          { label: 'View Application', action: 'go_applications' }
        ],
        requiresAuth: true,
        category: 'application'
      },
      'my application was rejected': {
        question: 'My application was rejected',
        answer: 'Your application status indicates that it has been rejected. For the specific reason and any available next steps, please check the application details or contact support.',
        chips: [
          { label: 'View Application', action: 'go_applications' },
          { label: 'Contact Support', action: 'go_contact' }
        ],
        requiresAuth: true,
        category: 'application'
      },
      'i want to know my application timeline': {
        question: 'I want to know my application timeline',
        answer: 'You can view the available application timeline to see the recorded progress and status updates.',
        chips: [
          { label: 'View Application Timeline', action: 'go_applications' }
        ],
        requiresAuth: true,
        category: 'application'
      },

      // Security: Sensitive Information
      'what is my pan number': {
        question: 'What is my PAN number?',
        answer: 'For your security, I can\'t display sensitive personal information unless your account and the requested information are authorized for viewing. Please use the secure application/profile section to access your information.',
        chips: [
          { label: 'View Profile', action: 'update_profile' }
        ],
        requiresAuth: true,
        category: 'security',
        sensitive: true
      },

      // KYC
      'i want to update my kyc': {
        question: 'I want to update my KYC',
        answer: 'You can manage your KYC information from the authorized KYC section of your account.',
        chips: [
          { label: 'Open KYC', action: 'go_employee_cards' }
        ],
        requiresAuth: true,
        category: 'kyc',
        roleBased: {
          'EMPLOYEE': {
            answer: 'You can manage your KYC information from the Employee KYC section.',
            chips: [{ label: 'Open KYC', action: 'go_employee_cards' }]
          },
          'PARTNER': {
            answer: 'You can manage your KYC information from your Partner profile section.',
            chips: [{ label: 'View Profile', action: 'update_profile' }]
          }
        }
      },
      'what documents are required for employee kyc': {
        question: 'What documents are required for Employee KYC?',
        answer: 'Employee KYC may require documents such as PAN, Aadhaar, bank proof, photograph, education certificates, resume, and applicable experience or relieving documents. You can upload the required documents from the Employee KYC/Onboarding section.',
        chips: [
          { label: 'Open KYC', action: 'go_employee_cards' }
        ],
        requiresAuth: true,
        category: 'kyc'
      },

      // Employee Onboarding
      'what is my employee onboarding status': {
        question: 'What is my Employee onboarding status?',
        answer: 'I can help you check your onboarding progress. Your onboarding may include Terms & Conditions, joining details, KYC, document verification, HR verification, product-link assignment, and activation.',
        chips: [
          { label: 'View Onboarding', action: 'update_profile' }
        ],
        requiresAuth: true,
        category: 'employee',
        roleBased: {
          'EMPLOYEE': {
            answer: 'I can help you check your onboarding progress. Your onboarding may include Terms & Conditions, joining details, KYC, document verification, HR verification, product-link assignment, and activation.',
            chips: [{ label: 'View Onboarding', action: 'update_profile' }]
          }
        }
      },
      'how much of my onboarding is completed': {
        question: 'How much of my onboarding is completed?',
        answer: 'I can help you check your onboarding progress. Your onboarding may include Terms & Conditions, joining details, KYC, document verification, HR verification, product-link assignment, and activation.',
        chips: [
          { label: 'View Onboarding', action: 'update_profile' }
        ],
        requiresAuth: true,
        category: 'employee'
      },

      // Employee Incentives
      'i want to see my incentives': {
        question: 'I want to see my incentives',
        answer: 'You can view your authorized incentive information and incentive history from the Employee Incentives section.',
        chips: [
          { label: 'View Incentives', action: 'go_incentives' }
        ],
        requiresAuth: true,
        category: 'employee',
        roleBased: {
          'EMPLOYEE': {
            answer: 'You can view your authorized incentive information and incentive history from the Employee Incentives section.',
            chips: [{ label: 'View Incentives', action: 'go_incentives' }]
          }
        }
      },
      'show my incentives': {
        question: 'Show my incentives',
        answer: 'You can view your authorized incentive information and incentive history from the Employee Incentives section.',
        chips: [
          { label: 'View Incentives', action: 'go_incentives' }
        ],
        requiresAuth: true,
        category: 'employee'
      },
      'can i withdraw money from the employee panel': {
        question: 'Can I withdraw money from the Employee panel?',
        answer: 'Employee accounts don\'t have access to Partner wallet withdrawal functionality. You can view your available Employee incentive information from the Incentives section.',
        chips: [
          { label: 'View Incentives', action: 'go_incentives' }
        ],
        requiresAuth: true,
        category: 'employee',
        roleBased: {
          'EMPLOYEE': {
            answer: 'Employee accounts don\'t have access to Partner wallet withdrawal functionality. You can view your available Employee incentive information from the Incentives section.',
            chips: [{ label: 'View Incentives', action: 'go_incentives' }]
          }
        }
      },
      'can an employee modify commission': {
        question: 'Can an Employee modify commission?',
        answer: 'Commission management is not available to Employee users. Employee incentive information is handled through the authorized Employee incentive workflow.',
        chips: [
          { label: 'View Incentives', action: 'go_incentives' }
        ],
        requiresAuth: true,
        category: 'employee'
      },

      // Employee Team
      'i want to see my team': {
        question: 'I want to see my team',
        answer: 'You can view your authorized team information from the My Team section.',
        chips: [
          { label: 'My Team', action: 'go_team' }
        ],
        requiresAuth: true,
        category: 'employee',
        roleBased: {
          'EMPLOYEE': {
            answer: 'You can view your authorized team information from the My Team section.',
            chips: [{ label: 'My Team', action: 'go_team' }]
          }
        }
      },
      'my team': {
        question: 'My Team',
        answer: 'You can view your authorized team information from the My Team section.',
        chips: [
          { label: 'My Team', action: 'go_team' }
        ],
        requiresAuth: true,
        category: 'employee',
        roleBased: {
          'EMPLOYEE': {
            answer: 'You can view your authorized team information from the My Team section.',
            chips: [{ label: 'My Team', action: 'go_team' }]
          }
        }
      },

      // Security: Cross-employee access
      'can i see another employee\'s application': {
        question: 'Can I see another Employee\'s application?',
        answer: 'You can only access applications you\'re authorized to view. Another Employee\'s application cannot be displayed without the required role and ownership permissions.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'security'
      },

      // Authentication
      'i want to login': {
        question: 'I want to login',
        answer: 'Sure. You can log in to your GharKaPaisa account here.',
        chips: [
          { label: 'Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'auth'
      },
      'i forgot my password': {
        question: 'I forgot my password',
        answer: 'You can use the password recovery option on the Login page to reset your credentials.',
        chips: [
          { label: 'Open Login', action: 'go_login' }
        ],
        requiresAuth: false,
        category: 'auth'
      },

      // Support
      'i want to contact support': {
        question: 'I want to contact support',
        answer: 'I\'m happy to help. If you need assistance that I can\'t resolve, you can contact the GharKaPaisa support team.',
        chips: [
          { label: 'Contact Support', action: 'go_contact' }
        ],
        requiresAuth: false,
        category: 'support'
      },
      'i have a technical problem': {
        question: 'I have a technical problem',
        answer: 'Please describe the issue you\'re experiencing. If it requires support-team assistance, I can direct you to the Contact Us page.',
        chips: [
          { label: 'Contact Support', action: 'go_contact' }
        ],
        requiresAuth: false,
        category: 'support'
      },

      // Role Capabilities
      'what can a partner do': {
        question: 'What can a Partner do?',
        answer: 'A Partner can access the features permitted for their account, including lead creation, permitted applications, product discovery, referral workflows, and application tracking. Access to other users\' data and restricted administrative/financial operations is not available.',
        chips: [
          { label: 'Partner Dashboard', action: 'go_dashboard' },
          { label: 'Create Lead', action: 'go_add_lead_card' },
          { label: 'My Applications', action: 'go_applications' },
          { label: 'Products', action: 'go_partner_products' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can an employee do': {
        question: 'What can an Employee do?',
        answer: 'Employee access includes the features permitted for your role, such as adding leads, viewing your authorized applications, accessing assigned products, managing onboarding/KYC, and viewing incentives. Some features depend on your designation and hierarchy.',
        chips: [
          { label: 'Employee Dashboard', action: 'go_dashboard' },
          { label: 'Add Lead', action: 'go_add_lead_card' },
          { label: 'My Applications', action: 'go_applications' },
          { label: 'Incentives', action: 'go_incentives' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can a manager do': {
        question: 'What can a Manager do?',
        answer: 'A Manager can access their own permitted Employee information and authorized team-level information according to the organization hierarchy and assigned permissions.',
        chips: [
          { label: 'My Team', action: 'go_team' },
          { label: 'My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can a tl do': {
        question: 'What can a TL do?',
        answer: 'A Team Leader can access their own information and authorized team information according to the assigned hierarchy and permissions.',
        chips: [
          { label: 'My Team', action: 'go_team' },
          { label: 'My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can a tc do': {
        question: 'What can a TC do?',
        answer: 'A Team Coordinator has access to their own authorized Employee operations and records. Team-level visibility is restricted according to the assigned role and permissions.',
        chips: [
          { label: 'My Applications', action: 'go_applications' },
          { label: 'My Incentives', action: 'go_incentives' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can hr do': {
        question: 'What can HR do?',
        answer: 'HR users can access authorized recruitment and employee-management workflows such as candidate review, interview management, selection/rejection, onboarding review, and related HR operations.',
        chips: [
          { label: 'HR Dashboard', action: 'go_hr_dashboard' },
          { label: 'Candidates', action: 'hr_candidates' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can an admin do': {
        question: 'What can an Admin do?',
        answer: 'Admin users can access the administrative functions permitted by their role, including authorized application, customer, product, and operational management features.',
        chips: [
          { label: 'Admin Dashboard', action: 'go_dashboard' }
        ],
        requiresAuth: false,
        category: 'roles'
      },
      'what can super admin do': {
        question: 'What can Super Admin do?',
        answer: 'Super Admin has the highest administrative access level and can manage authorized platform-wide configuration, employees, products, applications, permissions, and other administrative workflows.',
        chips: [
          { label: 'Super Admin Dashboard', action: 'go_dashboard' }
        ],
        requiresAuth: false,
        category: 'roles'
      },

      // Security: Unauthorized actions
      'delete another partner\'s application': {
        question: 'Delete another partner\'s application',
        answer: 'I can\'t perform that action because your account doesn\'t have permission to modify another user\'s application.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' },
          { label: 'Contact Support', action: 'go_contact' }
        ],
        requiresAuth: false,
        category: 'security',
        unauthorized: true
      },
      'show me all customers in the database': {
        question: 'Show me all customers in the database',
        answer: 'I can only provide information that your account is authorized to access. I can\'t expose the platform\'s internal database or another user\'s private information.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'security',
        unauthorized: true
      },
      'give me the pan and mobile number of this customer': {
        question: 'Give me the PAN and mobile number of this customer',
        answer: 'I can\'t provide another user\'s sensitive personal information. Please use the authorized application or customer-management workflow if you have the required permissions.',
        chips: [
          { label: 'View My Applications', action: 'go_applications' }
        ],
        requiresAuth: false,
        category: 'security',
        unauthorized: true,
        sensitive: true
      }
    };
  }

  /**
   * Search FAQ knowledge base
   * @param {string} query - User query
   * @param {string} userRole - User role
   * @param {boolean} isAuthenticated - User authentication status
   * @returns {Object} - FAQ response
   */
  searchFAQ(query, userRole = 'PUBLIC', isAuthenticated = false) {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      const knowledgeBase = this.getFAQKnowledgeBase();

      // Direct match
      if (knowledgeBase[normalizedQuery]) {
        return this.getFAQResponse(knowledgeBase[normalizedQuery], userRole, isAuthenticated);
      }

      // Fuzzy match
      const matchedKey = this.findBestMatch(normalizedQuery, Object.keys(knowledgeBase));
      if (matchedKey) {
        return this.getFAQResponse(knowledgeBase[matchedKey], userRole, isAuthenticated);
      }

      // Category-based match
      const categoryMatch = this.findCategoryMatch(normalizedQuery, knowledgeBase);
      if (categoryMatch) {
        return this.getFAQResponse(categoryMatch, userRole, isAuthenticated);
      }

      return this.getFallbackResponse();
    } catch (error) {
      logger.error('Error searching FAQ:', error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Get FAQ response with security checks
   * @param {Object} faqEntry - FAQ entry
   * @param {string} userRole - User role
   * @param {boolean} isAuthenticated - User authentication status
   * @returns {Object} - FAQ response
   */
  getFAQResponse(faqEntry, userRole, isAuthenticated) {
    // Security check for unauthorized actions
    if (faqEntry.unauthorized) {
      return {
        message: faqEntry.answer,
        chips: faqEntry.chips,
        category: faqEntry.category
      };
    }

    // Authentication check
    if (faqEntry.requiresAuth && !isAuthenticated) {
      return {
        message: 'Please login to access this information.',
        chips: [
          { label: 'Login', action: 'go_login' },
          { label: 'Register', action: 'go_register' }
        ],
        category: 'auth'
      };
    }

    // Role-based response
    if (faqEntry.roleBased && isAuthenticated) {
      const role = (userRole || 'PUBLIC').toUpperCase();
      if (faqEntry.roleBased[role]) {
        const roleResponse = faqEntry.roleBased[role];
        return {
          message: roleResponse.answer,
          chips: roleResponse.chips,
          category: faqEntry.category
        };
      }
    }

    // Default response
    return {
      message: faqEntry.answer,
      chips: faqEntry.chips,
      category: faqEntry.category
    };
  }

  /**
   * Find best fuzzy match
   * @param {string} query - Normalized query
   * @param {Array} keys - FAQ keys
   * @returns {string|null} - Best matching key
   */
  findBestMatch(query, keys) {
    let bestMatch = null;
    let highestScore = 0;

    for (const key of keys) {
      const score = this.calculateSimilarity(query, key);
      if (score > highestScore && score > 0.7) {
        highestScore = score;
        bestMatch = key;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  /**
   * Find category-based match
   * @param {string} query - Normalized query
   * @param {Object} knowledgeBase - FAQ knowledge base
   * @returns {Object|null} - Category-matched FAQ entry
   */
  findCategoryMatch(query, knowledgeBase) {
    const categoryKeywords = {
      'credit card': 'credit_card',
      'loan': 'loan',
      'application': 'application',
      'partner': 'partner',
      'employee': 'employee',
      'incentive': 'employee',
      'team': 'employee',
      'kyc': 'kyc',
      'support': 'support',
      'help': 'support',
      'login': 'auth',
      'password': 'auth',
      'security': 'security',
      'role': 'roles',
      'what can': 'roles'
    };

    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (query.includes(keyword)) {
        const categoryEntry = Object.values(knowledgeBase).find(entry => entry.category === category);
        if (categoryEntry) {
          return categoryEntry;
        }
      }
    }

    return null;
  }

  /**
   * Get fallback response for unknown questions
   * @returns {Object} - Fallback response
   */
  getFallbackResponse() {
    return {
      message: 'I\'m currently focused on helping you with GharKaPaisa services such as products, applications, leads, employee services, and support. What would you like help with?',
      chips: [
        { label: 'Create Lead', action: 'public_create_lead' },
        { label: 'Track Application', action: 'public_check_status' },
        { label: 'Credit Cards', action: 'go_cards' },
        { label: 'Loans', action: 'go_loans' },
        { label: 'Partner Login', action: 'go_login' },
        { label: 'Contact Support', action: 'go_contact' }
      ],
      category: 'fallback'
    };
  }

  /**
   * Get ambiguous question handler
   * @param {string} context - Context of the question
   * @returns {Object} - Clarification response
   */
  getAmbiguousResponse(context) {
    return {
      message: `Sure. What would you like to do with your ${context}?`,
      chips: [
        { label: 'Track Status', action: 'public_check_status' },
        { label: 'View Application', action: 'go_applications' },
        { label: 'View Timeline', action: 'go_applications' },
        { label: 'Contact Support', action: 'go_contact' }
      ],
      category: 'clarification'
    };
  }
}

module.exports = new ChatbotFAQService();
