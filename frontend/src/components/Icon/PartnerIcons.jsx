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
  eyeOff: (props) => <Icon d={["M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24", "M1 1l22 22"]} {...props} />,
  User: (props) => <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 3a4 4 0 100 8 4 4 0 000-8z"]} {...props} />,
  Lock: (props) => <Icon d={["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z", "M7 11V7a5 5 0 0110 0v4"]} {...props} />,
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
  shield: (props) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />,
  arrowRight: (props) => <Icon d="M5 12h14M12 5l7 7-7 7" {...props} />,
  arrowLeft: (props) => <Icon d="M19 12H5M12 19l-7-7 7-7" {...props} />,
  mail: (props) => <Icon d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"]} {...props} />,
  phone: (props) => <Icon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" {...props} />,
  calendar: (props) => <Icon d={["M3 6h18", "M8 2v4", "M16 2v4", "M5 4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5z"]} {...props} />,
  university: (props) => <Icon d={["M2 20h20", "M12 2L2 7h20L12 2z", "M4 10v7", "M8 10v7", "M12 10v7", "M16 10v7", "M20 10v7"]} {...props} />,
  product: (props) => <Icon d={["M21 8l-9-5-9 5v8l9 5 9-5V8z", "M12 3v18", "M3 8l9 5 9-5"]} {...props} />,
  settings: (props) => <Icon d={["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"]} {...props} />
};
