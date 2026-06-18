import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function ManageSections() {
  const { C } = useTheme();
  const S = makeS(C);

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [savingKey, setSavingKey] = useState(null);

  const sectionsList = [
    { key: "section_visibility_money_transfer", label: "Money Transfer & Payments", icon: <Icons.wallet size={20} />, description: "Displays fast money transfer and domestic payout service buttons." },
    { key: "section_visibility_attractive_cards", label: "Attractive Cards & Loans", icon: <Icons.creditCard size={20} />, description: "Highlighted list of top converting bank credit cards and loan offers." },
    { key: "section_visibility_insurance", label: "Insurance Section", icon: <Icons.check size={20} />, description: "Life, health, and vehicle insurance policy application cards." },
    { key: "section_visibility_travel", label: "Travel Section", icon: <Icons.clock size={20} />, description: "Flight, train, bus, and hotel booking options." },
    { key: "section_visibility_recharge", label: "Recharge Section", icon: <Icons.trending size={20} />, description: "Mobile recharge, DTH, utility electricity bill pay widgets." },
    { key: "section_visibility_offers", label: "Offers Section", icon: <Icons.gift size={20} />, description: "Featured cashback, referral campaigns, and seasonal credit card promotions." }
  ];

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/settings");
      if (res.data?.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error("[ManageSections] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load homepage sections state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleSectionVisibility = async (key, currentValue) => {
    setSavingKey(key);
    const newValue = currentValue === "show" ? "hide" : "show";
    try {
      const res = await api.post("/settings", { key, value: newValue });
      if (res.data?.success) {
        setSettings(prev => ({ ...prev, [key]: newValue }));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update visibility status");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Homepage Layout Sections</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Control show/hide visibility rules and render permissions for dashboard sections in real-time</p>
      </div>

      {errorMsg && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading sections schema...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {sectionsList.map((item) => {
            const isVisible = settings[item.key] !== "hide"; // Show is default if key is missing/unconfigured
            return (
              <div
                key={item.key}
                style={{
                  ...S.card,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  opacity: isVisible ? 1 : 0.8
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: isVisible ? `${C.teal}15` : `${C.textLight}15`,
                      color: isVisible ? C.teal : C.textLight,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>
                        {item.label}
                      </h4>
                      <span style={{
                        display: "inline-block", fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase",
                        color: isVisible ? C.green : C.red, marginTop: "2px"
                      }}>
                        {isVisible ? "🟢 Visible (ON)" : "🔴 Masked (OFF)"}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: "12.5px", color: C.textLight, margin: "8px 0 0 0", lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ marginTop: "16px", borderTop: `1px solid ${C.border}50`, paddingTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => toggleSectionVisibility(item.key, isVisible ? "show" : "hide")}
                    disabled={savingKey === item.key}
                    style={{
                      background: isVisible ? `${C.red}15` : `${C.teal}15`,
                      color: isVisible ? C.red : C.teal,
                      border: `1px solid ${isVisible ? C.red : C.teal}30`,
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: 800,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      minWidth: "120px",
                      textAlign: "center",
                      transition: "all 0.2s"
                    }}
                  >
                    {savingKey === item.key ? "Updating..." : isVisible ? "Hide Section" : "Show Section"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
