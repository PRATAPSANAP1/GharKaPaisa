export const cardDetailsById = {
  "hdfc-pixel-go": {
    id: "hdfc-pixel-go",
    name: "HDFC Pixel Go Credit Card",
    specialOffers: {
      totalEarning: "Up to ₹1700",
      cardApprovalDispatch: "₹1200",
      dateOffer: {
        title: "May 2026 Offer",
        details: "Sale 5 cards: Extra ₹100 per card | Sale 10 cards: Extra ₹200 per card | Sale 50 cards: Extra ₹500 per card"
      }
    },
    features: [
      "Digital-first customizable credit card",
      "Zero joining fee and zero annual fee forever",
      "Custom rewards on shopping and dining apps"
    ],
    eligibility: {
      criteria: "Minimum age 21 years. Salaried or Self-Employed with stable income.",
      documentsRequired: ["PAN Card", "Aadhaar Card", "Last 3 months Salary Slips", "Bank Statement"]
    },
    trainingVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    howItWorks: [
      "Click on 'Apply Now' and fill in your details.",
      "Complete the V-KYC online.",
      "Get instant virtual card upon approval.",
      "Physical card dispatched within 7 working days."
    ],
    termsAndConditions: "Standard HDFC Bank terms and conditions apply. Reward points are valid for 2 years.",
    faqs: [
      { q: "Is this card lifetime free?", a: "Yes, it is lifetime free." },
      { q: "What is the forex markup fee?", a: "The forex markup fee is 3.5%." }
    ]
  }
};

// Generic fallback data generator for other cards
export const getCardDetails = (id, name = "Credit Card") => {
  if (cardDetailsById[id]) return cardDetailsById[id];
  
  return {
    id,
    name,
    specialOffers: {
      totalEarning: "",
      cardApprovalDispatch: "₹1000",
      dateOffer: {
        title: "May 2026 Offer",
        details: "Sale 5 cards: Extra ₹100 per card | Sale 10 cards: Extra ₹200 per card"
      }
    },
    features: [
      "Lifetime free with zero joining fee",
      "Reward points on every transaction",
      "Complimentary airport lounge access (select cards)"
    ],
    eligibility: {
      criteria: "Minimum age 21 years. Stable income required.",
      documentsRequired: ["PAN Card", "Aadhaar Card", "Income Proof"]
    },
    trainingVideoUrl: "", // No video
    howItWorks: [
      "Apply online securely.",
      "Complete documentation.",
      "Get card approved and dispatched."
    ],
    termsAndConditions: "Terms and conditions apply as per the issuing bank.",
    faqs: [
      { q: "Are there hidden charges?", a: "No, all charges are mentioned upfront." }
    ]
  };
};
