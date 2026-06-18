import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function ManageServices() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" or "gateways"

  // -- Catalog State --
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogService, setEditingCatalogService] = useState(null);
  const [catalogForm, setCatalogForm] = useState({
    name: "", icon: "", route: "", display_order: 1, status: "active"
  });
  const [submittingCatalog, setSubmittingCatalog] = useState(false);

  // -- Gateway State --
  const [settings, setSettings] = useState({});
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [gatewaysError, setGatewaysError] = useState("");
  const [activeGatewayService, setActiveGatewayService] = useState(null);
  const [gatewayForm, setGatewayForm] = useState({
    provider: "", api_key: "", endpoint: "", commission_rate: ""
  });
  const [submittingGateway, setSubmittingGateway] = useState(false);

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const res = await api.get("/service-catalog");
      if (res.data?.success) setCatalog(res.data.data);
    } catch (e) {
      setCatalogError("Failed to load service catalog.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchGateways = async () => {
    setLoadingGateways(true);
    setGatewaysError("");
    try {
      const res = await api.get("/settings");
      if (res.data?.success) setSettings(res.data.data);
    } catch (e) {
      setGatewaysError("Failed to load gateway settings.");
    } finally {
      setLoadingGateways(false);
    }
  };

  useEffect(() => {
    if (activeTab === "catalog") fetchCatalog();
    else fetchGateways();
  }, [activeTab]);

  // -- Catalog Handlers --
  const handleOpenCatalogModal = (service = null) => {
    if (service) {
      setEditingCatalogService(service);
      setCatalogForm({
        name: service.name, icon: service.icon, route: service.route,
        display_order: service.display_order, status: service.status
      });
    } else {
      setEditingCatalogService(null);
      setCatalogForm({ name: "", icon: "", route: "", display_order: 1, status: "active" });
    }
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    setSubmittingCatalog(true);
    try {
      if (editingCatalogService) {
        await api.put(`/service-catalog/${editingCatalogService.id}`, catalogForm);
      } else {
        await api.post("/service-catalog", catalogForm);
      }
      setIsCatalogModalOpen(false);
      fetchCatalog();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save service");
    } finally {
      setSubmittingCatalog(false);
    }
  };

  const handleDeleteCatalog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/service-catalog/${id}`);
      fetchCatalog();
    } catch (err) {
      alert("Failed to delete service.");
    }
  };

  const toggleCatalogStatus = async (service) => {
    try {
      const newStatus = service.status === "active" ? "inactive" : "active";
      await api.put(`/service-catalog/${service.id}`, { status: newStatus });
      fetchCatalog();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  // -- Gateway Handlers --
  const handleOpenGatewayModal = (svc) => {
    setActiveGatewayService(svc);
    setGatewayForm({
      provider: settings[`${svc.name}_provider`] || "",
      api_key: settings[`${svc.name}_api_key`] || "",
      endpoint: settings[`${svc.name}_endpoint`] || "",
      commission_rate: settings[`${svc.name}_commission_rate`] || ""
    });
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setSubmittingGateway(true);
    try {
      await Promise.all([
        api.post("/settings", { key: `${activeGatewayService.name}_provider`, value: gatewayForm.provider }),
        api.post("/settings", { key: `${activeGatewayService.name}_api_key`, value: gatewayForm.api_key }),
        api.post("/settings", { key: `${activeGatewayService.name}_endpoint`, value: gatewayForm.endpoint }),
        api.post("/settings", { key: `${activeGatewayService.name}_commission_rate`, value: gatewayForm.commission_rate })
      ]);
      alert("API Gateway configuration saved!");
      setActiveGatewayService(null);
      fetchGateways();
    } catch (e) {
      alert("Failed to save gateway config.");
    } finally {
      setSubmittingGateway(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Service Management API</h2>
          <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Control homepage service cards and third-party API gateways</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "16px", borderBottom: `1px solid ${C.border}`, marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            background: "none", border: "none", padding: "12px 16px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
            color: activeTab === "catalog" ? C.teal : C.textLight,
            borderBottom: activeTab === "catalog" ? `3px solid ${C.teal}` : "3px solid transparent"
          }}
        >
          Service Catalog
        </button>
        <button
          onClick={() => setActiveTab("gateways")}
          style={{
            background: "none", border: "none", padding: "12px 16px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
            color: activeTab === "gateways" ? C.teal : C.textLight,
            borderBottom: activeTab === "gateways" ? `3px solid ${C.teal}` : "3px solid transparent"
          }}
        >
          API Gateways & Commissions
        </button>
      </div>

      {/* CATALOG TAB */}
      {activeTab === "catalog" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: 0 }}>Public Service Cards</h3>
            <button onClick={() => handleOpenCatalogModal()} style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: "12px" }}>
              + Add New Service
            </button>
          </div>

          {loadingCatalog ? (
            <div style={{ padding: "48px", textAlign: "center", color: C.textLight }}>Loading catalog...</div>
          ) : catalogError ? (
            <div style={{ padding: "16px", color: C.red, background: `${C.red}15`, borderRadius: "8px" }}>{catalogError}</div>
          ) : (
            <div style={{ ...S.card, overflowX: "auto", padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, color: C.textLight, fontSize: "12px" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Order</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Service</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Route</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Clicks</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13px", color: C.text }}>
                  {catalog.map(svc => (
                    <tr key={svc.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: C.textLight }}>{svc.display_order}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        <span style={{ marginRight: "8px" }}>{svc.icon}</span> {svc.name}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.teal }}>{svc.route}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>{svc.clicks}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: svc.status === "active" ? `${C.green}20` : `${C.red}20`,
                          color: svc.status === "active" ? C.green : C.red,
                          padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase"
                        }}>
                          {svc.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button onClick={() => toggleCatalogStatus(svc)} style={{ ...S.btn("outline"), padding: "4px 8px", fontSize: "11px" }}>
                            {svc.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => handleOpenCatalogModal(svc)} style={{ ...S.btn("outline"), padding: "4px 8px", fontSize: "11px" }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteCatalog(svc.id)} style={{ background: "transparent", color: C.red, border: `1px solid ${C.red}50`, borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catalog.length === 0 && (
                    <tr><td colSpan="6" style={{ padding: "24px", textAlign: "center", color: C.textLight }}>No services found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GATEWAYS TAB */}
      {activeTab === "gateways" && (
        <div>
          <p style={{ fontSize: "13px", color: C.textLight, marginBottom: "16px" }}>Manage 3rd party API keys and default commissions for your services.</p>
          {loadingGateways ? (
            <div style={{ padding: "48px", textAlign: "center", color: C.textLight }}>Loading gateways...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {catalog.map(svc => (
                <div key={svc.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>{svc.icon} {svc.name} API</h4>
                    <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>
                      Provider: {settings[`${svc.name}_provider`] || "N/A"}<br/>
                      Commission: {settings[`${svc.name}_commission_rate`] ? `${settings[`${svc.name}_commission_rate`]}%` : "N/A"}
                    </div>
                  </div>
                  <button onClick={() => handleOpenGatewayModal(svc)} style={{ ...S.btn("outline"), fontSize: "12px", padding: "6px 12px" }}>
                    Configure
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {isCatalogModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              {editingCatalogService ? "Edit Service" : "Add Service"}
            </h3>
            <form onSubmit={handleSaveCatalog} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={S.label}>Name (e.g. Recharge)</label>
                <input required style={S.input} value={catalogForm.name} onChange={e => setCatalogForm({ ...catalogForm, name: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Icon (Emoji)</label>
                  <input style={S.input} value={catalogForm.icon} onChange={e => setCatalogForm({ ...catalogForm, icon: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Display Order</label>
                  <input type="number" required style={S.input} value={catalogForm.display_order} onChange={e => setCatalogForm({ ...catalogForm, display_order: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label style={S.label}>Route Path (e.g. /recharge)</label>
                <input required style={S.input} value={catalogForm.route} onChange={e => setCatalogForm({ ...catalogForm, route: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.input} value={catalogForm.status} onChange={e => setCatalogForm({ ...catalogForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsCatalogModalOpen(false)} style={S.btn("outline")}>Cancel</button>
                <button type="submit" disabled={submittingCatalog} style={S.btn("primary")}>{submittingCatalog ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeGatewayService && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ ...S.card, width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "0 0 16px 0" }}>
              Configure: {activeGatewayService.name} Gateway
            </h3>
            <form onSubmit={handleSaveGateway} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={S.label}>Provider Name</label>
                <input style={S.input} value={gatewayForm.provider} onChange={e => setGatewayForm({ ...gatewayForm, provider: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Endpoint URI</label>
                <input style={S.input} value={gatewayForm.endpoint} onChange={e => setGatewayForm({ ...gatewayForm, endpoint: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>API Key</label>
                <input type="password" style={S.input} value={gatewayForm.api_key} onChange={e => setGatewayForm({ ...gatewayForm, api_key: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Commission Rate (%)</label>
                <input type="number" step="0.01" style={S.input} value={gatewayForm.commission_rate} onChange={e => setGatewayForm({ ...gatewayForm, commission_rate: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveGatewayService(null)} style={S.btn("outline")}>Cancel</button>
                <button type="submit" disabled={submittingGateway} style={S.btn("primary")}>{submittingGateway ? "Saving..." : "Save Config"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
