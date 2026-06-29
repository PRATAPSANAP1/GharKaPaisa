import React from "react";
import logo from "../../assets/logos/logo.png";
import "./GkpLoader.css";

export default function GkpLoader() {
  return (
    <div className="loader-container">
      <img
        src={logo}
        alt="GharKaPaisa"
        className="loader-logo"
      />
    </div>
  );
}
