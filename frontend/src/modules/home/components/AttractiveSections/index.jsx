import React from 'react';
import { FaRegCreditCard, FaMoneyCheckAlt, FaIdCard, FaShieldAlt, FaMobileAlt, FaMoneyBillWave } from "react-icons/fa";

export const attractiveCategories = [
  {
    id: "personal-loan",
    title: "Personal Loan",
    label: "Personal Loan",
    description: "Quick approval, minimal documentation and flexible repayment options.",
    icon: <FaMoneyBillWave />,
    gradient: "linear-gradient(135deg, #e0eaff 0%, #f3e8ff 100%)",
    type: "custom-page"
  },
  {
    id: "ltf-cards",
    title: "Lifetime Free Cards",
    label: "Lifetime Free Cards",
    description: "Enjoy zero annual fees and lifetime free benefits on premium credit cards.",
    icon: <FaRegCreditCard />,
    gradient: "linear-gradient(135deg, #166397 0%, #0F4F7A 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Popular Lifetime Free Cards",
        cards: [
          { name: "IDFC FIRST Millennia Credit Card", desc: "Lifetime free with high rewards on online spends" },
          { name: "Kotak League Platinum Card", desc: "Premium benefits with zero annual fee" },
          { name: "ICICI Platinum Chip Credit Card", desc: "Classic lifetime free shopping card" },
          { name: "AU LIT Credit Card", desc: "Customizable features with no annual fee" }
        ]
      }
    ]
  },
  {
    id: "cibil-loans",
    title: "CIBIL Loan",
    label: "CIBIL Loan",
    description: "Get personalized loan offers tailored specifically to your credit profile.",
    icon: <FaMoneyCheckAlt />,
    gradient: "linear-gradient(135deg, #27ae60 0%, #0c6b30 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Loan Categories",
        subcategories: [
          "Personal Loan based on CIBIL Score",
          "Pre-approved Personal Loan",
          "Instant Personal Loan"
        ]
      }
    ]
  },
  {
    id: "hdfc-cc-loan",
    title: "Loan on Credit Card",
    label: "Loan on Credit Card",
    description: "Unlock instant cash or loans against your existing credit card limit.",
    icon: <FaRegCreditCard />,
    gradient: "linear-gradient(135deg, #8e44ad 0%, #5b2c6f 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Loan Options",
        subcategories: [
          "Loan on Existing Credit Card",
          "Pre-approved Loan on Credit Card",
          "Cash on Credit Card"
        ]
      }
    ]
  },
  {
    id: "smart-emi",
    title: "Smart EMI Card",
    label: "Smart EMI Card",
    description: "Split your purchases into easy no-cost EMIs with instant approval.",
    icon: <FaIdCard />,
    gradient: "linear-gradient(135deg, #f39c12 0%, #d35400 100%)",
    type: "hierarchy",
    items: [
      {
        section: "EMI Card Options",
        subcategories: [
          "Bajaj Finserv EMI Card",
          "HDFC Consumer Durable Loan",
          "ICICI EMI Card"
        ]
      }
    ]
  },
  {
    id: "secured-cards",
    title: "FD Backed Card",
    label: "FD Backed Card",
    description: "Build or rebuild your credit score with high-approval FD-backed credit cards.",
    icon: <FaShieldAlt />,
    gradient: "linear-gradient(135deg, #16a085 0%, #117864 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Available Cards",
        cards: [
          { name: "IDFC FIRST WOW Credit Card", desc: "100% limit against FD with zero documentation" },
          { name: "Kotak 811 Dream Different Credit Card", desc: "Interest on FD and zero annual fee" },
          { name: "OneCard Secured Credit Card", desc: "Metal card backed by FD with premium rewards" },
          { name: "HDFC Secured Credit Card", desc: "Build credit relationship with India's largest bank" }
        ]
      }
    ]
  },
  {
    id: "upi-cards",
    title: "UPI Credit Card",
    label: "UPI Credit Card",
    description: "Make merchant payments directly via UPI using your RuPay credit card.",
    icon: <FaMobileAlt />,
    gradient: "linear-gradient(135deg, #c0392b 0%, #962d22 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Card Types",
        subcategories: [
          "RuPay Credit Cards",
          "UPI Linked Credit Cards"
        ]
      },
      {
        section: "Available Cards",
        cards: [
          { name: "HDFC Tata Neu Plus RuPay", desc: "2% back on Tata Neu spend via UPI" },
          { name: "HDFC Tata Neu Infinity RuPay", desc: "5% back on Tata Neu spend via UPI" },
          { name: "Kiwi RuPay Credit Card", desc: "UPI-first credit card with instant rewards" },
          { name: "IndusInd Platinum RuPay Card", desc: "Premium lounge access and RuPay benefits" },
          { name: "BOB Snapdeal RuPay Card", desc: "Co-branded shopping rewards on RuPay network" },
          { name: "ICICI Coral RuPay Card", desc: "BookMyShow discounts and dining rewards" }
        ]
      }
    ]
  }
];
