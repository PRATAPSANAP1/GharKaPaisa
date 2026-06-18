import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function ManageServices() {
  const { C } = useTheme();
  const S = makeS(C);

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [savingKey, setSavingKey] = useState(null);
  
  // Custom API configuration form state
  const [activeService, setActiveService] = useState(null);
  const [form, setForm] = useState({
    provider: "",
    api_key: "",
    endpoint: "",
    commission_rate: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const servicesList = [
    // Travel Services
    { key: "service_flight", label: "Flight Booking API", category: "Travel", icon: "✈️" },
    { key: "service_train", label: "Train Booking API", category: "Travel", icon: "🎛️" },
    { key: "service_bus", label: "Bus Booking API", category: "Travel", icon: "🚍" },
    { key: "service_hotel", label: "Hotel Booking API", category: "Travel", icon: "🏨" },
    // Payment Services
    { key: "service_mobile", label: "Mobile Recharge API", category: "Payments", icon: "📱" },
    { key: "service_dth", label: "DTH Recharge API", category: "Payments", icon: "📡" },
    { key: "service_electricity", label: "Electricity Bill API", category: "Payments", icon: "⚡" },
    { key: "service_fastag", label: "FASTag Recharge API", category: "Payments", icon: "🚗" },
    { key: "service_loan_repay", label: "Loan Repayment API", category: "Payments", icon: "💰" }
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
      console.error("[ManageServices] Fetch Error:", e);
      setErrorMsg(e.response?.data?.message || "Failed to load services settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleServiceStatus = async (key, currentValue) => {
    setSavingKey(key);
    const newValue = currentValue === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.post("/settings", { key: `${key}_status`, value: newValue });
      if (res.data?.success) {
        setSettings(prev => ({ ...prev, [`${key}_status`]: newValue }));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update service status");
    } finally {
      setSavingKey(null);
    }
  };

  const openConfigModal = (service) => {
    setActiveService(service);
    setForm({
      provider: settings[`${service.key}_provider`] || "",
      api_key: settings[`${service.key}_api_key`] || "",
      endpoint: settings[`${service.key}_endpoint`] || "",
      commission_rate: settings[`${service.key}_commission_rate`] || ""
    });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Promise.all([
        api.post("/settings", { key: `${activeService.key}_provider`, value: form.provider.trim() }),
        api.post("/settings", { key: `${activeService.key}_api_key`, value: form.api_key.trim() }),
        api.post("/settings", { key: `${activeService.key}_endpoint`, value: form.endpoint.trim() }),
        api.post("/settings", { key: `${activeService.key}_commission_rate`, value: form.commission_rate.trim() })
      ]);
      alert(`${activeService.label} API configuration saved successfully!`);
      setActiveService(null);
      fetchSettings();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save API configurations.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>API Integration Settings</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Configure third-party service providers, commission payout rates, and API keys globally</p>
      </div>

      {errorMsg && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
          <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
          Loading service integrations...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Travel Services */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "14px", borderBottom: `1px solid ${C.border}`, paddingBottom: "6px" }}>Travel Service API Gateways</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {servicesList.filter(s => s.category === "Travel").map((item) => {
                const status = settings[`${item.key}_status`] || "Active";
                const isOnline = status === "Active";
                return (
                  <div key={item.key} style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{item.icon}</span>
                        <div>
                          <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>{item.label}</h4>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, color: isOnline ? C.green : C.red }}>
                            {status === "Active" ? "🟢 ACTIVE" : "🔴 INACTIVE"}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: C.textLight, marginTop: "6px" }}>
                        <strong>Provider:</strong> {settings[`${item.key}_provider`] || "Not Configured"}<br/>
                        <strong>Endpoint:</strong> <code style={{ fontSize: "10.5px" }}>{settings[`${item.key}_endpoint`] || "N/A"}</code>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px", borderTop: `1px solid ${C.border}50`, paddingTop: "12px" }}>
                      <button
                        onClick={() => toggleServiceStatus(item.key, status)}
                        disabled={savingKey === item.key}
                        style={{
                          background: isOnline ? `${C.red}10` : `${C.green}10`,
                          color: isOnline ? C.red : C.green,
                          border: "none", borderRadius: "6px", padding: "6px 12px",
                          fontSize: "12px", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {isOnline ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => openConfigModal(item)}
                        style={{
                          background: "none", border: `1px solid ${C.border}`,
                          color: C.text, borderRadius: "6px", padding: "6px 12px",
                          fontSize: "12px", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Services */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "14px", borderBottom: `1px solid ${C.border}`, paddingBottom: "6px" }}>Payment & Utility Recharges</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {servicesList.filter(s => s.category === "Payments").map((item) => {
                const status = settings[`${item.key}_status`] || "Active";
                const isOnline = status === "Active";
                return (
                  <div key={item.key} style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{item.icon}</span>
                        <div>
                          <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>{item.label}</h4>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, color: isOnline ? C.green : C.red }}>
                            {status === "Active" ? "🟢 ACTIVE" : "🔴 INACTIVE"}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: C.textLight, marginTop: "6px" }}>
                        <strong>Provider:</strong> {settings[`${item.key}_provider`] || "Not Configured"}<br/>
                        <strong>Commission:</strong> {settings[`${item.key}_commission_rate`] ? `${settings[`${item.key}_commission_rate`]}%` : "Not Configured"}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px", borderTop: `1px solid ${C.border}50`, paddingTop: "12px" }}>
                      <button
                        onClick={() => toggleServiceStatus(item.key, status)}
                        disabled={savingKey === item.key}
                        style={{
                          background: isOnline ? `${C.red}10` : `${C.green}10`,
                          color: isOnline ? C.red : C.green,
                          border: "none", borderRadius: "6px", padding: "6px 12px",
                          fontSize: "12px", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {isOnline ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => openConfigModal(item)}
                        style={{
                          background: "none", border: `1px solid ${C.border}`,
                          color: C.text, borderRadius: "6px", padding: "6px 12px",
                          fontSize: "12px", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* CONFIG MODAL */}
      {activeService && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            ...S.card, width: "100%", maxWidth: "450px", padding: "24px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.15)", position: "relative"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              Configure: {activeService.label}
            </h3>

            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={S.label}>API Provider Name</label>
                <input
                  style={S.input}
                  placeholder="e.g. TravelPort, Razorpay, Twilio"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>API Gateway Endpoint URI</label>
                <input
                  style={S.input}
                  placeholder="https://api.provider.com/v1"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Secret API Key / Authentication Token</label>
                <input
                  type="password"
                  style={S.input}
                  placeholder="••••••••••••••••••••••••••••••"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Default Commission Rate Override (%)</label>
                <input
                  type="number"
                  step="0.01"
                  style={S.input}
                  placeholder="e.g. 1.25"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setActiveService(null)}
                  style={S.btn("outline")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={S.btn("primary")}
                >
                  {submitting ? "Saving..." : "Save Gateways"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
