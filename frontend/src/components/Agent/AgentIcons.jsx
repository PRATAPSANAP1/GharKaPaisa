import React from "react";

const Icon = ({ d, size = 20, color = "currentColor", viewBox = "0 0 24 24" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox={viewBox} 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const Icons = {
  dashboard: (props) => <Icon d={["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"]} {...props} />,
  creditCard: (props) => <Icon d={["M1 4h22v16H1z", "M1 10h22"]} {...props} />,
  loan: (props) => <Icon d={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} {...props} />,
  insurance: (props) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />,
  investment: (props) => <Icon d={["M22 12h-4l-3 9L9 3l-3 9H2"]} {...props} />,
  wallet: (props) => <Icon d={["M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z", "M16 12a1 1 0 100 2 1 1 0 000-2z"]} {...props} />,
  profile: (props) => <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 3a4 4 0 100 8 4 4 0 000-8z"]} {...props} />,
  bell: (props) => <Icon d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"]} {...props} />,
  eye: (props) => <Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 100 6 3 3 0 000-6z"]} {...props} />,
  trending: (props) => <Icon d={["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]} {...props} />,
  withdraw: (props) => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} {...props} />,
  upload: (props) => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} {...props} />,
  check: (props) => <Icon d="M20 6L9 17l-5-5" {...props} />,
  x: (props) => <Icon d={["M18 6L6 18", "M6 6l12 12"]} {...props} />,
  clock: (props) => <Icon d={["M12 2a10 10 0 100 20A10 10 0 0012 2z", "M12 6v6l4 2"]} {...props} />,
  star: (props) => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...props} />,
  menu: (props) => <Icon d={["M3 12h18", "M3 6h18", "M3 18h18"]} {...props} />,
  logout: (props) => <Icon d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"]} {...props} />,
  gift: (props) => <Icon d={["M20 12v10H4V12", "M22 7H2v5h20V7z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z", "M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"]} {...props} />,
  arrowRight: (props) => <Icon d="M5 12h14M12 5l7 7-7 7" {...props} />,
  arrowLeft: (props) => <Icon d="M19 12H5M12 19l-7-7 7-7" {...props} />,
};
