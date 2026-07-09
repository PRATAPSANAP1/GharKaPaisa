import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useAuthStore } from "../../../app/store/authStore";

export default function ManagePartners() {
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);

  // Listing State (Two Tables: New Onboarding Requests vs Processed Partners)
  const [partnersNew, setPartnersNew] = useState([]);
  const [partnersProcessed, setPartnersProcessed] = useState([]);
  const [totalNew, setTotalNew] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [pageNew, setPageNew] = useState(1);
  const [pageProcessed, setPageProcessed] = useState(1);
  const [search, setSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingProcessed, setLoadingProcessed] = useState(true);
  const [err, setErr] = useState("");

  // Details Modal State
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [videoPlayUrl, setVideoPlayUrl] = useState('');

  // Actions State
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [docCorrections, setDocCorrections] = useState({ pan: false, cancelled_cheque: false, video: false });
  const [docReviews, setDocReviews] = useState({ pan: null, cancelled_cheque: null, video: null });
  const [docRejectReasons, setDocRejectReasons] = useState({ pan: "", cancelled_cheque: "", video: "" });
  const [activeRejectDoc, setActiveRejectDoc] = useState(null);
  const [rejectText, setRejectText] = useState("");

  // Wallet adjustment State
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [walletForm, setWalletForm] = useState({ amount: "", txn_type: "credit", description: "" });

  // Super Admin DSA Management State
  const [allPartnersList, setAllPartnersList] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [teamStatus, setTeamStatus] = useState("ACTIVE");
  const [allowTeamCreation, setAllowTeamCreation] = useState(true);
  const [updatingTeam, setUpdatingTeam] = useState(false);

  const fetchNewPartners = async () => {
    setLoadingNew(true);
    setErr("");
    try {
      const res = await api.get("/Partners", {
        params: {
          page: pageNew,
          limit: 10,
          search: search || undefined,
          kyc_status: kycStatus || undefined,
          status: accountStatus || undefined,
          kyc_filter: "new",
        },
      });
      if (res.data?.success) {
        setPartnersNew(res.data.data);
        setTotalNew(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load new requests");
    } finally {
      setLoadingNew(false);
    }
  };

  const fetchProcessedPartners = async () => {
    setLoadingProcessed(true);
    setErr("");
    try {
      const res = await api.get("/Partners", {
        params: {
          page: pageProcessed,
          limit: 10,
          search: search || undefined,
          kyc_status: kycStatus || undefined,
          status: accountStatus || undefined,
          kyc_filter: "old",
        },
      });
      if (res.data?.success) {
        setPartnersProcessed(res.data.data);
        setTotalProcessed(res.data.pagination?.total || res.data.data.length);
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load processed partners");
    } finally {
      setLoadingProcessed(false);
    }
  };

  const fetchPartners = () => {
    fetchNewPartners();
    fetchProcessedPartners();
  };

  useEffect(() => {
    fetchNewPartners();
  }, [pageNew, kycStatus, accountStatus]);

  useEffect(() => {
    fetchProcessedPartners();
  }, [pageProcessed, kycStatus, accountStatus]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      api.get("/admin/partners", { params: { limit: 1000 } })
        .then((res) => {
          if (res.data?.success) setAllPartnersList(res.data.data);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageNew(1);
    setPageProcessed(1);
    fetchNewPartners();
    fetchProcessedPartners();
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

        const videoDoc = p.partner_video;
        
        setVideoPlayUrl('');
        if (videoDoc && videoDoc.id) {
          try {
            const videoViewRes = await api.get(`/partner/kyc/documents/${videoDoc.id}/view`);
            if (videoViewRes.data?.success && videoViewRes.data?.data?.url) {
              setVideoPlayUrl(videoViewRes.data.data.url);
            }
          } catch (vidErr) {
            console.error("Failed to generate secure video link", vidErr);
          }
        }

        const initialReviews = {};
        const initialReasons = {};
        
        initialReviews['video'] = videoDoc?.verification_status || null;
        initialReasons['video'] = videoDoc?.rejection_reason || '';

        p.kyc_documents?.forEach(d => {
          initialReviews[d.doc_type] = d.verification_status || null;
          initialReasons[d.doc_type] = d.rejection_reason || '';
        });

        setDocReviews(initialReviews);
        setDocRejectReasons(initialReasons);
        setActiveRejectDoc(null);
        setRejectText('');
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
      const res = await api.post("/superadmin/kyc/approve", {
        partnerId: selectedPartner.id,
      });
      if (res.data?.success) {
        alert("Partner KYC approved successfully!");
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

    const rejectedDocs = Object.keys(docCorrections).filter(k => docCorrections[k]);

    try {
      let res;
      if (rejectedDocs.length > 0) {
        res = await api.post("/superadmin/kyc/request-changes", {
          partnerId: selectedPartner.id,
          rejection_reason: rejectionReason.trim(),
          rejected_documents: rejectedDocs
        });
      } else {
        res = await api.post("/superadmin/kyc/reject", {
          partnerId: selectedPartner.id,
          rejection_reason: rejectionReason.trim(),
        });
      }

      if (res.data?.success) {
        alert(rejectedDocs.length > 0 ? "KYC correction requested." : "Partner KYC rejected.");
        setShowRejectForm(false);
        setRejectionReason("");
        setDocCorrections({ pan: false, cancelled_cheque: false, video: false });
        handleViewDetails(selectedPartner);
        fetchPartners();
      }
    } catch (e) {
      alert(e.response?.data?.message || "KYC action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocReviewChange = async (docType, newStatus, reason = null) => {
    if (newStatus === 'rejected') {
      if (!window.confirm(`Mark ${docType.replace('_', ' ').toUpperCase()} as rejected and request changes?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Mark ${docType.replace('_', ' ').toUpperCase()} as verified?`)) {
        return;
      }
    }
    
    setActionLoading(true);
    try {
      const res = await api.post("/superadmin/kyc/verify-document", {
        partnerId: selectedPartner.id,
        docType,
        status: newStatus,
        rejectionReason: reason
      });
      if (res.data?.success) {
        alert(newStatus === 'approved' ? "Document marked as verified." : "Document marked as rejected.");
        handleViewDetails(selectedPartner);
        fetchPartners();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update document status.");
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
      const res = await api.get(`/partner/kyc/documents/${docId}/view`);
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
            onChange={(e) => { setKycStatus(e.target.value); setPageNew(1); setPageProcessed(1); }}
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
            onChange={(e) => { setAccountStatus(e.target.value); setPageNew(1); setPageProcessed(1); }}
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

      {err && (
        <div style={{ padding: "16px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      {/* ==================== TABLE 1: NEW REQUESTS ==================== */}
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>New Onboarding Requests</h3>
        <span style={{ background: `${C.teal}15`, color: C.teal, fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "30px" }}>
          {totalNew} pending
        </span>
      </div>

      <div style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: "32px" }}>
        {loadingNew ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading new onboarding requests...
          </div>
        ) : partnersNew.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No new onboarding requests found.</div>
        ) : (
          <div>
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
                  {partnersNew.map((partner) => (
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

            {/* Table 1 Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "12px", color: C.textLight }}>
                Showing page {pageNew} of {Math.ceil(totalNew / 10) || 1} ({totalNew} total requests)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={pageNew <= 1}
                  onClick={() => setPageNew(pageNew - 1)}
                  style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px", cursor: pageNew <= 1 ? "not-allowed" : "pointer" }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageNew * 10 >= totalNew}
                  onClick={() => setPageNew(pageNew + 1)}
                  style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px", cursor: pageNew * 10 >= totalNew ? "not-allowed" : "pointer" }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== TABLE 2: PROCESSED PARTNERS ==================== */}
      <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>Processed Partners & History</h3>
        <span style={{ background: `${C.textLight}15`, color: C.textMid, fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "30px" }}>
          {totalProcessed} total
        </span>
      </div>

      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {loadingProcessed ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>
            <div className="animate-spin" style={{ width: "24px", height: "24px", border: `3px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }}></div>
            Loading processed partners history...
          </div>
        ) : partnersProcessed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: C.textLight }}>No processed partners found.</div>
        ) : (
          <div>
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
                  {partnersProcessed.map((partner) => (
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

            {/* Table 2 Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "12px", color: C.textLight }}>
                Showing page {pageProcessed} of {Math.ceil(totalProcessed / 10) || 1} ({totalProcessed} total partners)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={pageProcessed <= 1}
                  onClick={() => setPageProcessed(pageProcessed - 1)}
                  style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px", cursor: pageProcessed <= 1 ? "not-allowed" : "pointer" }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageProcessed * 10 >= totalProcessed}
                  onClick={() => setPageProcessed(pageProcessed + 1)}
                  style={{ ...S.btn("outline", false), padding: "6px 12px", fontSize: "12px", cursor: pageProcessed * 10 >= totalProcessed ? "not-allowed" : "pointer" }}
                >
                  Next
                </button>
              </div>
            </div>
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
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "11px", color: C.textLight, marginBottom: "6px" }}>KYC Status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      {/* Status Badge */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 12px", borderRadius: "20px", fontWeight: 700, fontSize: "12px",
                        textTransform: "capitalize",
                        background: profile.kyc_status === "approved" ? `${C.green}18` : profile.kyc_status === "rejected" ? `${C.red}18` : `${C.gold}18`,
                        color: profile.kyc_status === "approved" ? C.green : profile.kyc_status === "rejected" ? C.red : C.gold,
                        border: `1.5px solid ${profile.kyc_status === "approved" ? C.green : profile.kyc_status === "rejected" ? C.red : C.gold}`
                      }}>
                        {profile.kyc_status === "approved" ? "✓" : profile.kyc_status === "rejected" ? "✕" : "⏳"} {profile.kyc_status}
                      </span>

                      {/* Approve Button */}
                      <button
                        onClick={handleApproveKYC}
                        disabled={actionLoading || profile.kyc_status === "approved"}
                        style={{
                          padding: "5px 14px", borderRadius: "7px", fontWeight: 700, fontSize: "12px",
                          cursor: (actionLoading || profile.kyc_status === "approved") ? "not-allowed" : "pointer",
                          background: profile.kyc_status === "approved" ? `${C.green}20` : `${C.green}15`,
                          color: C.green,
                          border: `1.5px solid ${C.green}`,
                          opacity: profile.kyc_status === "approved" ? 0.5 : 1,
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          transition: "all 0.15s"
                        }}
                      >
                        ✓ {profile.kyc_status === "approved" ? "Approved" : "Approve KYC"}
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={actionLoading || profile.kyc_status === "rejected"}
                        style={{
                          padding: "5px 14px", borderRadius: "7px", fontWeight: 700, fontSize: "12px",
                          cursor: (actionLoading || profile.kyc_status === "rejected") ? "not-allowed" : "pointer",
                          background: profile.kyc_status === "rejected" ? `${C.red}20` : `${C.red}10`,
                          color: C.red,
                          border: `1.5px solid ${C.red}`,
                          opacity: profile.kyc_status === "rejected" ? 0.5 : 1,
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          transition: "all 0.15s"
                        }}
                      >
                        ✕ {profile.kyc_status === "rejected" ? "Rejected" : "Reject KYC"}
                      </button>
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
                      {profile.kyc_documents.map((doc, idx) => {
                        const isDocVer = docReviews[doc.doc_type] === 'approved';
                        const isDocRej = docReviews[doc.doc_type] === 'rejected';
                        return (
                          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px", background: C.bgSecondary, border: `1px solid ${C.border}`, padding: "12px", borderRadius: "10px", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "capitalize", color: C.text }}>{doc.doc_type.replace("_", " ")}</div>
                                <div style={{ fontSize: "10px", color: C.textLight }}>
                                  No: {doc.doc_number || "N/A"} • Status: <span style={{ fontWeight: 700, color: isDocVer ? C.green : isDocRej ? C.red : C.gold }}>{docReviews[doc.doc_type] || 'pending'}</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => handleViewDocument(doc.id)}
                                  disabled={!doc.id || doc.id === 'undefined'}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: (!doc.id || doc.id === 'undefined') ? C.textLight : C.teal, fontWeight: 700, textDecoration: "none", background: "transparent", border: "none", cursor: (!doc.id || doc.id === 'undefined') ? "not-allowed" : "pointer", marginRight: "12px" }}
                                >
                                  <Icons.eye size={14} /> View File
                                </button>
                                
                                <button 
                                  onClick={() => handleDocReviewChange(doc.doc_type, 'approved')}
                                  style={{
                                    padding: '5px 12px',
                                    background: isDocVer ? C.green : `${C.green}15`,
                                    color: isDocVer ? '#fff' : C.green,
                                    border: `1.5px solid ${C.green}`,
                                    borderRadius: '7px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {isDocVer ? '✓ Approved' : '✓ Approve'}
                                </button>
                                <button 
                                  onClick={() => { setActiveRejectDoc(doc.doc_type); setRejectText(docRejectReasons[doc.doc_type] || ''); }}
                                  style={{
                                    padding: '4px 10px',
                                    background: isDocRej ? C.red : 'transparent',
                                    color: isDocRej ? '#fff' : C.red,
                                    border: `1px solid ${C.red}`,
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                            {isDocRej && docRejectReasons[doc.doc_type] && (
                              <div style={{ fontSize: "11px", color: C.red, background: `${C.red}08`, padding: "6px 10px", borderRadius: "6px", marginTop: "2px" }}>
                                <strong>Rejection Reason:</strong> {docRejectReasons[doc.doc_type]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: C.textLight, margin: 0 }}>No documents uploaded yet.</p>
                  )}
                </div>

                {/* KYC Verification Video */}
                {profile.partner_video && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: C.text, margin: 0 }}>KYC Verification Video</h4>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button 
                          onClick={() => handleDocReviewChange('video', 'approved')}
                          style={{
                            padding: '5px 12px',
                            background: docReviews.video === 'approved' ? C.green : `${C.green}15`,
                            color: docReviews.video === 'approved' ? '#fff' : C.green,
                            border: `1.5px solid ${C.green}`,
                            borderRadius: '7px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            transition: 'all 0.15s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {docReviews.video === 'approved' ? '✓ Approved' : '✓ Approve Video'}
                        </button>
                        <button 
                          onClick={() => { setActiveRejectDoc('video'); setRejectText(docRejectReasons.video || ''); }}
                          style={{
                            padding: '4px 10px',
                            background: docReviews.video === 'rejected' ? C.red : 'transparent',
                            color: docReviews.video === 'rejected' ? '#fff' : C.red,
                            border: `1px solid ${C.red}`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            transition: 'all 0.15s'
                          }}
                        >
                          Reject Video
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${C.border}`, background: "#000", height: "200px" }}>
                      <video 
                        src={videoPlayUrl || profile.partner_video.video_url} 
                        controls 
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <div style={{ fontSize: "11px", color: C.textLight, marginTop: "6px" }}>
                      Duration: {profile.partner_video.video_duration}s • Status: <span style={{ fontWeight: 700, color: docReviews.video === 'approved' ? C.green : docReviews.video === 'rejected' ? C.red : C.gold }}>{docReviews.video || 'pending'}</span>
                    </div>
                    {docReviews.video === 'rejected' && docRejectReasons.video && (
                      <div style={{ fontSize: "11px", color: C.red, background: `${C.red}08`, padding: "6px 10px", borderRadius: "6px", marginTop: "4px" }}>
                        <strong>Rejection Reason:</strong> {docRejectReasons.video}
                      </div>
                    )}
                  </div>
                )}

                {/* KYC Timeline */}
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "8px" }}>KYC Timeline</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: C.textLight }}>
                    <div>📥 Submitted At: {profile.kyc_submitted_at ? new Date(profile.kyc_submitted_at).toLocaleString() : 'N/A'}</div>
                    {profile.kyc_reviewed_at && (
                      <div>🔍 Reviewed At: {new Date(profile.kyc_reviewed_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                {/* Removed DSA Team Management section as per request */}

                {/* Rejection reason inline prompt */}
                {activeRejectDoc && (
                  <div style={{ margin: "16px 0", padding: "12px", background: `${C.red}05`, border: `1px solid ${C.red}20`, borderRadius: "10px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: C.red, marginBottom: "8px" }}>
                      Specify Rejection Reason for {activeRejectDoc.replace("_", " ").toUpperCase()}:
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text" 
                        value={rejectText} 
                        onChange={e => setRejectText(e.target.value)}
                        placeholder="e.g. Details are blurry or signature mismatch"
                        style={{ ...S.input, flex: 1, margin: 0 }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!rejectText.trim()) return alert("Rejection reason is required.");
                          handleDocReviewChange(activeRejectDoc, 'rejected', rejectText.trim());
                          setActiveRejectDoc(null);
                        }}
                        style={{ ...S.btn("primary"), background: C.red, padding: "8px 16px", fontSize: "12px", border: "none" }}
                      >
                        Save
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveRejectDoc(null)}
                        style={{ ...S.btn("outline"), padding: "8px 16px", fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions Panel */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
