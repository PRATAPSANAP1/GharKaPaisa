import React from "react";
import logo from "../../logo.png";
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
