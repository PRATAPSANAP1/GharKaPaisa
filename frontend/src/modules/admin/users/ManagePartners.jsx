import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useAuthStore } from "../../../app/store/authStore";

export default function ManagePartners() {
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);

  // Listing State
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Details Modal State
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Actions State
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Wallet adjustment State
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [walletForm, setWalletForm] = useState({ amount: "", txn_type: "credit", description: "" });

  // Super Admin DSA Management State
  const [allPartnersList, setAllPartnersList] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [teamStatus, setTeamStatus] = useState("ACTIVE");
  const [allowTeamCreation, setAllowTeamCreation] = useState(true);
  const [updatingTeam, setUpdatingTeam] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/Partners", {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          kyc_status: kycStatus || undefined,
          status: accountStatus || undefined,
        },
      });
      if (res.data?.success) {
        setPartners(res.data.data);
        setTotal(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [page, kycStatus, accountStatus]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      api.get("/admin/partners", { params: { limit: 1000 } })
        .then((res) => {
          if (res.data?.success) setAllPartnersList(res.data.data);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPartners();
  };

  const handleViewDetails = async (partner) => {
    setSelectedPartner(partner);
    setProfile(null);
    setLoadingProfile(true);
    setShowRejectForm(false);
    setShowWalletForm(false);
    try {
      const res = await api.get(`/Partners/${partner.id}/profile`);
      if (res.data?.success) {
        const p = res.data.data;
        setProfile(p);
        setSelectedParentId(p.parent_partner_id || "");
        setTeamStatus(p.team_status || "ACTIVE");
        setAllowTeamCreation(p.allow_team_creation !== false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load partner profile details.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateParent = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to change this partner's parent? This will rebuild the entire hierarchy recursively.")) return;
    setUpdatingTeam(true);
    try {
      await api.patch(`/partner/${selectedPartner.id}/change-parent`, {
        new_parent_id: selectedParentId || null
      });
      alert("Parent partner changed successfully!");
      handleViewDetails(selectedPartner);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change parent partner.");
    } finally {
      setUpdatingTeam(false);
    }
  };

  const handleUpdateTeamControls = async (e) => {
    e.preventDefault();
    setUpdatingTeam(true);
    try {
      await api.patch(`/partner/${selectedPartner.id}/deactivate-team`, {
        team_status: teamStatus,
        allow_team_creation: allowTeamCreation
      });
      alert("Team controls updated successfully!");
      handleViewDetails(selectedPartner);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update team controls.");
    } finally {
      setUpdatingTeam(false);
    }
  };

  const handleApproveKYC = async () => {
    if (!window.confirm("Are you sure you want to approve this partner's KYC? This will activate their profile and create a wallet if not present.")) return;
    setActionLoading(true);
    try {
      const res = await api.post("/admin/approve-kyc", {
        partnerId: selectedPartner.id,
        approved: true,
      });
      if (res.data?.success) {
        alert("Partner KYC approved successfully!");
        // Refresh detail view
        handleViewDetails(selectedPartner);
        fetchPartners();
      }
    } catch (e) {
      alert(e.response?.data?.message || "KYC approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKYC = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return alert("Rejection reason is required.");
    setActionLoading(true);
    try {
      const res = await api.post("/admin/approve-kyc", {
        partnerId: selectedPartner.id,
        approved: false,
        rejection_reason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        alert("Partner KYC rejected.");
        setShowRejectForm(false);
        setRejectionReason("");
        handleViewDetails(selectedPartner);
        fetchPartners();
      }
    } catch (e) {
      alert(e.response?.data?.message || "KYC rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalletAdjust = async (e) => {
    e.preventDefault();
    const amt = parseFloat(walletForm.amount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount.");
    setActionLoading(true);
    try {
      const res = await api.post("/admin/wallet/adjust", {
        partner_id: selectedPartner.id,
        amount: amt,
        txn_type: walletForm.txn_type,
        description: walletForm.description.trim() || undefined,
      });
      if (res.data?.success) {
        alert(res.data.message || "Wallet adjusted successfully.");
        setShowWalletForm(false);
        setWalletForm({ amount: "", txn_type: "credit", description: "" });
        // Refresh profile to see any updated balance if needed, or simply reload details
        handleViewDetails(selectedPartner);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Wallet adjustment failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = async (docId) => {
    if (!docId || docId === 'undefined') {
      alert("Document not available.");
      return;
    }
    try {
      const res = await api.get(`/kyc/documents/${docId}/view`);
      if (res.data?.success && res.data?.data?.url) {
        window.open(res.data.data.url, '_blank');
      } else {
        alert("Failed to generate secure view link.");
      }
    } catch (e) {
      alert(e.response?.data?.message || "Error generating secure view link.");
    }
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>Partners Management</h2>
        <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Manage partner onboarding, review KYC compliance documents, and update wallet balances</p>
      </div>

      {/* Filters & Search Form */}
      <div style={{ ...S.card, padding: "16px", marginBottom: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <input
              style={{ ...S.input, paddingLeft: "16px" }}
              placeholder="Search by name, email, mobile, partner code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{ ...S.input, width: "auto", minWidth: "150px" }}
            value={kycStatus}
            onChange={(e) => { setKycStatus(e.target.value); setPage(1); }}
          >
            <option value="">All KYC Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            style={{ ...S.input, width: "auto", minWidth: "150px" }}
            value={accountStatus}
            onChange={(e) => { setAccountStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Account Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button type="submit" style={{ ...S.btn("primary", false), padding: "10px 20px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Partners List Table */}
      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading partners list...
          </div>
        ) : partners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No partners found matching criteria.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Partner Info</th>
                  <th style={{ padding: "14px 16px" }}>Partner Code</th>
                  <th style={{ padding: "14px 16px" }}>Contact</th>
                  <th style={{ padding: "14px 16px" }}>KYC Status</th>
                  <th style={{ padding: "14px 16px" }}>Account Status</th>
                  <th style={{ padding: "14px 16px" }}>Created At</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px", color: C.text }}>
                {partners.map((partner) => (
                  <tr key={partner.id} style={{ borderBottom: `1px solid ${C.border}60` }} className="hover:bg-gray-50/10">
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                      {partner.first_name} {partner.last_name}
                      {partner.company_name && <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 500 }}>{partner.company_name}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontMono: true }}>
                      <div>{partner.Partner_code || partner.partner_code}</div>
                      {partner.parent_code && (
                        <div style={{ fontSize: "11px", color: C.textLight, marginTop: "4px" }}>
                          <span style={{ background: C.bgSecondary, padding: "2px 6px", borderRadius: "4px", border: `1px solid ${C.border}` }}>
                            Child of: {partner.parent_code}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div>{partner.email}</div>
                      <div style={{ fontSize: "11px", color: C.textLight }}>{partner.mobile}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                        background: partner.kyc_status === "approved" ? `${C.green}15` : partner.kyc_status === "rejected" ? `${C.red}15` : partner.kyc_status === "under_review" ? `${C.gold}15` : `${C.border}`,
                        color: partner.kyc_status === "approved" ? C.green : partner.kyc_status === "rejected" ? C.red : partner.kyc_status === "under_review" ? C.gold : C.textMid,
                      }}>
                        {partner.kyc_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                        background: 
                          partner.status === "active" ? `${C.green}15` : 
                          partner.status === "inactive" ? `${C.textLight}15` : 
                          (partner.status === "pending" || partner.status === "pending_verification") ? `${C.gold}15` : 
                          partner.status === "suspended" ? `${C.red}15` : 
                          partner.status === "rejected" ? `${C.red}15` : 
                          partner.status === "blocked" ? `${C.red}15` : `${C.border}`,
                        color: 
                          partner.status === "active" ? C.green : 
                          partner.status === "inactive" ? C.textLight : 
                          (partner.status === "pending" || partner.status === "pending_verification") ? C.gold : 
                          partner.status === "suspended" ? C.red : 
                          partner.status === "rejected" ? C.red : 
                          partner.status === "blocked" ? C.red : C.textMid,
                      }}>
                        {partner.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: C.textLight }}>
                      {new Date(partner.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleViewDetails(partner)}
                        style={{ background: "none", border: "none", color: C.teal, fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Details */}
      {selectedPartner && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "680px", maxHeight: "90%", overflowY: "auto", padding: "24px", position: "relative"
          }}>
            {/* Close */}
            <button
              onClick={() => setSelectedPartner(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <Icons.x size={20} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "4px" }}>
              Partner Details: {selectedPartner.first_name} {selectedPartner.last_name}
            </h3>
            <p style={{ fontSize: "12px", color: C.textLight, marginBottom: "20px" }}>Code: {selectedPartner.Partner_code || selectedPartner.partner_code}</p>

            {loadingProfile ? (
              <div style={{ textAlign: "center", padding: "32px", color: C.textLight }}>Loading partner data...</div>
            ) : profile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Info block */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: C.bgSecondary, padding: "14px", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>Email Address</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.text }}>{profile.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>Mobile Phone</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.text }}>{profile.mobile}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>GST Number</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.text }}>{profile.gst_number || "Not provided"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>KYC Status</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "capitalize", color: profile.kyc_status === "approved" ? C.green : profile.kyc_status === "rejected" ? C.red : C.gold }}>
                      {profile.kyc_status}
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>Bank Account Details</h4>
                  {profile.account_number ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: C.card, border: `1px solid ${C.border}`, padding: "12px", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textLight }}>Bank Name</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{profile.bank_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textLight }}>Account Number</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{profile.account_number}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textLight }}>IFSC Code</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{profile.ifsc_code}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textLight }}>Account Holder</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{profile.account_holder_name}</div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: C.textLight, margin: 0 }}>Bank details not set up yet.</p>
                  )}
                </div>

                {/* KYC Documents */}
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>KYC Uploaded Documents</h4>
                  {profile.kyc_documents && profile.kyc_documents.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {profile.kyc_documents.map((doc, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bgSecondary, border: `1px solid ${C.border}`, padding: "10px 14px", borderRadius: "10px", width: "100%" }}>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "capitalize", color: C.text }}>{doc.doc_type.replace("_", " ")}</div>
                            <div style={{ fontSize: "10px", color: C.textLight }}>No: {doc.doc_number || "N/A"} • Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                          </div>
                          <button
                            onClick={() => handleViewDocument(doc.id)}
                            disabled={!doc.id || doc.id === 'undefined'}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: (!doc.id || doc.id === 'undefined') ? C.textLight : C.teal, fontWeight: 700, textDecoration: "none", background: "transparent", border: "none", cursor: (!doc.id || doc.id === 'undefined') ? "not-allowed" : "pointer" }}
                          >
                            <Icons.eye size={14} /> View File
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: C.textLight, margin: 0 }}>No documents uploaded yet.</p>
                  )}
                </div>

                {/* DSA Team Network controls (Super Admin only) */}
                {user?.role === "SUPER_ADMIN" && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "12px" }}>DSA Team Management</h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      {/* Change Parent */}
                      <form onSubmit={handleUpdateParent} style={{ background: C.bgSecondary, padding: "12px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight }}>Parent Partner (DSA Uplink)</label>
                        <select 
                          value={selectedParentId}
                          onChange={e => setSelectedParentId(e.target.value)}
                          style={S.input}
                        >
                          <option value="">None (Direct Root Partner)</option>
                          {allPartnersList
                            .filter(p => p.id !== selectedPartner.id)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.first_name} {p.last_name} ({p.Partner_code || p.partner_code})
                              </option>
                            ))
                          }
                        </select>
                        <button 
                          type="submit" 
                          disabled={updatingTeam}
                          style={{
                            ...S.btn("outline"),
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: updatingTeam ? "not-allowed" : "pointer"
                          }}
                        >
                          Update Parent Relation
                        </button>
                      </form>

                      {/* Team status and creation controls */}
                      <form onSubmit={handleUpdateTeamControls} style={{ background: C.bgSecondary, padding: "12px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: C.textLight }}>Team Status & Access</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <select 
                            value={teamStatus}
                            onChange={e => setTeamStatus(e.target.value)}
                            style={S.input}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE (Frozen)</option>
                          </select>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", marginTop: "4px" }}>
                            <input 
                              type="checkbox"
                              checked={allowTeamCreation}
                              onChange={e => setAllowTeamCreation(e.target.checked)}
                              style={{ accentColor: C.teal }}
                            />
                            Allow creating child partners
                          </label>
                        </div>
                        <button 
                          type="submit" 
                          disabled={updatingTeam}
                          style={{
                            ...S.btn("outline"),
                            padding: "6px 12px",
                            fontSize: "12px",
                            cursor: updatingTeam ? "not-allowed" : "pointer",
                            marginTop: "auto"
                          }}
                        >
                          Update Team Controls
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Actions Panel */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {profile.kyc_status !== "approved" && (
                    <button
                      onClick={handleApproveKYC}
                      disabled={actionLoading}
                      style={{ ...S.btn("primary"), padding: "10px 18px", fontSize: "13px" }}
                    >
                      Approve KYC & Activate
                    </button>
                  )}
                  {profile.kyc_status !== "rejected" && !showRejectForm && (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      style={{ ...S.btn("outline"), padding: "10px 18px", fontSize: "13px", color: C.red, borderColor: C.red }}
                    >
                      Reject KYC
                    </button>
                  )}
                  <button
                    onClick={() => setShowWalletForm(!showWalletForm)}
                    disabled={actionLoading}
                    style={{ ...S.btn("outline"), padding: "10px 18px", fontSize: "13px" }}
                  >
                    {showWalletForm ? "Hide Wallet Adjust" : "Manual Wallet Adjustment"}
                  </button>
                </div>

                {/* Account Status management (Super Admin Only) */}
                {user?.role === "SUPER_ADMIN" && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px", marginTop: "4px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>Account Status Management</h4>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <select
                        style={{ ...S.input, width: "240px", margin: 0 }}
                        value={profile.status || selectedPartner.status || "pending"}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (window.confirm(`Are you sure you want to change this partner's status to "${newStatus.replace('_', ' ').toUpperCase()}"?`)) {
                            setActionLoading(true);
                            try {
                              const res = await api.post("/superadmin/update-partner-status", {
                                userId: selectedPartner.id,
                                status: newStatus
                              });
                              if (res.data?.success) {
                                alert("Partner account status updated successfully!");
                                setProfile(prev => ({ ...prev, status: newStatus }));
                                fetchPartners();
                              }
                            } catch (err) {
                              alert(err.response?.data?.message || "Failed to update partner status.");
                            } finally {
                              setActionLoading(false);
                            }
                          }
                        }}
                        disabled={actionLoading}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending Verification</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Rejection Form */}
                {showRejectForm && (
                  <form onSubmit={handleRejectKYC} style={{ background: `${C.red}05`, border: `1px solid ${C.red}20`, padding: "16px", borderRadius: "12px" }}>
                    <h5 style={{ fontSize: "13px", fontWeight: 700, color: C.red, margin: "0 0 10px 0" }}>Specify Rejection Reason</h5>
                    <textarea
                      style={{ ...S.input, minHeight: "60px", marginBottom: "10px", background: C.card }}
                      placeholder="Explain what was wrong (e.g. Blurred PAN Card upload)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" disabled={actionLoading} style={{ ...S.btn("primary"), background: C.red, padding: "8px 14px", fontSize: "12px" }}>
                        Submit Rejection
                      </button>
                      <button type="button" onClick={() => setShowRejectForm(false)} style={{ ...S.btn("outline"), padding: "8px 14px", fontSize: "12px", border: "none", color: C.textLight }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Wallet adjustment Form */}
                {showWalletForm && (
                  <form onSubmit={handleWalletAdjust} style={{ background: `${C.teal}05`, border: `1px solid ${C.teal}20`, padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h5 style={{ fontSize: "13px", fontWeight: 700, color: C.teal, margin: 0 }}>Adjust Wallet Balance</h5>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "11px", color: C.textLight }}>Amount (₹)</label>
                        <input
                          type="number"
                          style={S.input}
                          placeholder="e.g. 500"
                          value={walletForm.amount}
                          onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: C.textLight }}>Adjustment Type</label>
                        <select
                          style={S.input}
                          value={walletForm.txn_type}
                          onChange={(e) => setWalletForm({ ...walletForm, txn_type: e.target.value })}
                        >
                          <option value="credit">Credit (Add Balance)</option>
                          <option value="debit">Debit (Deduct Balance)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: C.textLight }}>Description / Memo</label>
                      <input
                        style={S.input}
                        placeholder="Reason for adjustment (e.g. Promo reward)"
                        value={walletForm.description}
                        onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" disabled={actionLoading} style={{ ...S.btn("primary"), padding: "8px 14px", fontSize: "12px" }}>
                        Apply Balance Update
                      </button>
                      <button type="button" onClick={() => setShowWalletForm(false)} style={{ ...S.btn("outline"), padding: "8px 14px", fontSize: "12px", border: "none", color: C.textLight }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
