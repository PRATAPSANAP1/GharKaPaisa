import React from "react";
import logo from "../logo.png";
import "./LoadingLogo.css";

export default function LoadingLogo() {
  return (
    <div className="loading-overlay">
      <img
        src={logo}
        alt="Loading"
        className="loading-logo"
      />
    </div>
  );
}
