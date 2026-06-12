import React, { useState, useEffect } from "react";
import { Icons } from "./Agent/AgentIcons";
import { C, S } from "./Agent/AgentTheme";
import logo from "../logo.jpeg";
import AgentLogin from "./Agent/AgentLogin";
import AgentRegister from "./Agent/AgentRegister";
import AgentDashboard from "./Agent/AgentDashboard";
import AgentOffers from "./Agent/AgentOffers";
import AgentWallet from "./Agent/AgentWallet";
import AgentProfile from "./Agent/AgentProfile";

export default function AgentPanel({ onBackToMain }) {
  const [auth, setAuth] = useState("login"); // login | register | app
  const [page, setPage] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [agent] = useState({ name: "Rajesh Kumar", id: "AG-00123" });

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: <Icons.dashboard size={18} /> },
    { id: "home", label: "Offers", icon: <Icons.star size={18} /> },
    { id: "wallet", label: "Wallet", icon: <Icons.wallet size={18} /> },
    { id: "profile", label: "Profile", icon: <Icons.profile size={18} /> },
  ];

  if (auth === "login") {
    return (
      <AgentLogin 
        onLogin={() => setAuth("app")} 
        onRegisterNav={() => setAuth("register")} 
      />
    );
  }

  if (auth === "register") {
    return (
      <AgentRegister onBack={() => setAuth("login")} />
    );
  }

  const views = { 
    dashboard: () => <AgentDashboard agent={agent} onTabChange={setPage} />, 
    home: () => <AgentOffers />, 
    wallet: () => <AgentWallet />, 
    profile: () => <AgentProfile agent={agent} onLogout={() => { setAuth("login"); onBackToMain(); }} /> 
  };

  const RenderComp = views[page] || views.dashboard;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: C.bg, 
      display: "flex", 
      flexDirection: isMobile ? "column" : "row",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <div style={{
          width: "240px",
          background: C.navy,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          padding: "24px 16px",
          zIndex: 1000,
          boxSizing: "border-box"
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", padding: "0 6px" }}>
            <img 
              src={logo} 
              alt="GharKaPaisa Logo" 
              style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "8px", 
                objectFit: "contain",
                background: "#fff",
                padding: "2px"
              }} 
            />
            <div>
              <div style={{ fontSize: "16px", fontWeight: 900 }}>GharKaPaisa</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Agent Panel</div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            {NAV_ITEMS.map(n => {
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "rgba(0,180,216,0.15)" : "transparent",
                    color: active ? C.teal : "rgba(255,255,255,0.6)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "all 0.2s",
                    borderLeft: active ? `3px solid ${C.teal}` : "3px solid transparent"
                  }}
                >
                  {n.icon}
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>

          {/* Small Agent Summary Card at footer */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>RK</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>Rajesh Kumar</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>AG-00123</div>
              </div>
            </div>
            <button 
              onClick={() => { setAuth("login"); onBackToMain(); }} 
              style={{
                width: "100%",
                padding: "6px 0",
                borderRadius: "6px",
                border: "none",
                background: "rgba(230,57,70,0.15)",
                color: C.red,
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MOBILE HEADER */}
      {isMobile && (
        <div style={{
          background: C.navy,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img 
              src={logo} 
              alt="GharKaPaisa Logo" 
              style={{ 
                width: "30px", 
                height: "30px", 
                borderRadius: "6px", 
                objectFit: "contain",
                background: "#fff",
                padding: "2px"
              }} 
            />
            <span style={{ fontSize: "15px", fontWeight: 900 }}>GharKaPaisa Agent</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Icons.bell size={20} color="rgba(255,255,255,0.7)" />
            <div 
              onClick={() => setPage("profile")}
              style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
            >
              RK
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? "16px" : "32px",
        marginLeft: isMobile ? "0px" : "240px",
        paddingBottom: isMobile ? "80px" : "32px", // Safe area for mobile footer navigation
        boxSizing: "border-box"
      }}>
        <RenderComp />
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "10px 0",
          zIndex: 1000,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.03)",
          boxSizing: "border-box"
        }}>
          {NAV_ITEMS.map(n => {
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: active ? C.teal : C.textLight,
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: active ? 700 : 500,
                  transition: "all 0.15s"
                }}
              >
                {n.icon}
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
