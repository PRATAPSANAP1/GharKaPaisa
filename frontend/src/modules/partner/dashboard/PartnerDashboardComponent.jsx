import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import api from "../../../services/api";
import {
  MdDashboard, MdStorefront, MdLeaderboard, MdPeople,
  MdAccountBalanceWallet, MdDeviceHub, MdSchool, MdCampaign,
  MdNotifications, MdSupportAgent, MdVerifiedUser, MdSettings,
  MdCheckCircle, MdCancel, MdPending, MdChevronLeft, MdChevronRight,
  MdSearch, MdFilterList, MdShare, MdDownload, MdLock, MdPlayCircleOutline,
  MdAdd, MdDescription, MdEvent, MdTimeline, MdArrowUpward, MdTrendingUp,
  MdFlight, MdAccessTime, MdShield, MdCreditCard, MdGroup, MdEmojiEvents, MdContentCopy
} from "react-icons/md";
import { FaLock, FaWhatsapp, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";

// Bank logos
import hdfcLogo from "../../home/components/banks/hdfc_bank.png";
import axisLogo from "../../home/components/banks/axis_bank.png";
import kotakLogo from "../../home/components/banks/kotak_bank.png";
import sbiLogo from "../../home/components/banks/sbi_card.png";
import iciciLogo from "../../home/components/banks/icici_bank.png";
import yesLogo from "../../home/components/banks/yes_bank.png";
import idfcLogo from "../../home/components/banks/idfc_first_bank.png";
import bobLogo from "../../home/components/banks/bank_of_baroda.png";

export default function PartnerDashboard({ partner, onTabChange }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [teamDashboard, setTeamDashboard] = useState(null);
  const [trainingModules, setTrainingModules] = useState([]);
  const [banners, setBanners] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id;
  const kycStatus = partner?.kyc_status || "pending";
  const accountStatus = partner?.status || "pending";
  const partnerCode = partner?.partner_code || partner?.Partner_code || "";

  useEffect(() => {
    if (!partnerId) return;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [dashRes, wallRes, teamRes, trainRes, bannerRes, notifRes, leadsRes, prodRes] = await Promise.all([
          api.get(`/Partners/${partnerId}/dashboard`).catch(() => null),
          api.get(`/wallet/${partnerId}`).catch(() => null),
          api.get('/partner/team-dashboard').catch(() => null),
          api.get('/partner/training').catch(() => null),
          api.get('/banners').catch(() => null),
          api.get('/notifications', { params: { limit: 10 } }).catch(() => null),
          api.get('/leads', { params: { limit: 100 } }).catch(() => null),
          api.get('/products', { params: { is_active: 'true', limit: 100 } }).catch(() => null)
        ]);

        if (dashRes?.data?.success) setDashboardData(dashRes.data.data);
        if (wallRes?.data?.success) setWalletData(wallRes.data.data);
        if (teamRes?.data?.success) setTeamDashboard(teamRes.data.data);
        if (trainRes?.data?.success) setTrainingModules(trainRes.data.data || []);
        if (bannerRes?.data?.success) setBanners(bannerRes.data.data || []);
        if (leadsRes?.data?.success) setAllLeads(leadsRes.data.data || []);
        if (prodRes?.data?.success) setProducts(prodRes.data.data || []);

        if (notifRes?.data?.success) {
          setNotifications(notifRes.data.data.notifications || []);
          setUnreadNotificationsCount(notifRes.data.data.unread_count || 0);
        }
      } catch (err) {
        console.error("Dashboard data load failure", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [partnerId]);

  if (loading) {
    return <DashboardSkeleton C={C} />;
  }

  // Dynamic values & fallbacks directly from DB
  const w = walletData || { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 };
  const l = dashboardData?.leads || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 };

  const walletBalance = `₹${parseFloat(w.available_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  const pendingAmount = `₹${parseFloat(w.hold_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  const totalEarned = `₹${parseFloat(w.total_earned || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  
  // Real App counts for KPI Cards
  const kpiTotalApps = allLeads.length;
  const kpiApprovedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'approved').length;
  const kpiPendingApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'pending' || lead.status?.toLowerCase() === 'under_review').length;
  const kpiRejectedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'rejected').length;
  const kpiDisbursedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'disbursed').length;

  // Donut chart calculations
  const approvedPct = kpiTotalApps > 0 ? Math.round((kpiApprovedApps / kpiTotalApps) * 100) : 0;
  const pendingPct = kpiTotalApps > 0 ? Math.round((kpiPendingApps / kpiTotalApps) * 100) : 0;
  const rejectedPct = kpiTotalApps > 0 ? Math.round((kpiRejectedApps / kpiTotalApps) * 100) : 0;
  const disbursedPct = kpiTotalApps > 0 ? Math.round((kpiDisbursedApps / kpiTotalApps) * 100) : 0;

  const deg1 = (approvedPct / 100) * 360;
  const deg2 = deg1 + (pendingPct / 100) * 360;
  const deg3 = deg2 + (rejectedPct / 100) * 360;

  // Month-over-month calculation for application trends
  const getLeadsTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const thisMonthLeads = allLeads.filter(l => new Date(l.created_at || l.uploaded_at) >= thirtyDaysAgo).length;
    const lastMonthLeads = allLeads.filter(l => {
      const d = new Date(l.created_at || l.uploaded_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;

    if (lastMonthLeads === 0) {
      return thisMonthLeads > 0 ? `+${thisMonthLeads} leads this month` : "0% change";
    }
    const pct = Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100);
    return pct >= 0 ? `↑ ${pct}% vs last month` : `↓ ${Math.abs(pct)}% vs last month`;
  };

  const getApprovedTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const approvedLeads = allLeads.filter(l => l.status?.toLowerCase() === 'approved');
    const thisMonthApproved = approvedLeads.filter(l => new Date(l.created_at || l.uploaded_at) >= thirtyDaysAgo).length;
    const lastMonthApproved = approvedLeads.filter(l => {
      const d = new Date(l.created_at || l.uploaded_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;

    if (lastMonthApproved === 0) {
      return thisMonthApproved > 0 ? `+${thisMonthApproved} approved this month` : "0% change";
    }
    const pct = Math.round(((thisMonthApproved - lastMonthApproved) / lastMonthApproved) * 100);
    return pct >= 0 ? `↑ ${pct}% vs last month` : `↓ ${Math.abs(pct)}% vs last month`;
  };

  // dynamic greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // dynamic partner rank based on total leads count
  const getPartnerRank = () => {
    const count = allLeads.length;
    if (count >= 20) return "Gold Partner";
    if (count >= 5) return "Silver Partner";
    return "Bronze Partner";
  };
  const partnerRank = getPartnerRank();

  // Target goals scaled to rank
  const getTargetGoal = () => {
    const rank = getPartnerRank();
    if (rank === "Gold Partner") return 200000;
    if (rank === "Silver Partner") return 100000;
    return 50000;
  };
  const targetGoal = getTargetGoal();
  const currentEarnings = parseFloat(w.total_earned || 0);
  const targetPercent = targetGoal > 0 ? Math.min(100, Math.round((currentEarnings / targetGoal) * 100)) : 0;

  // dynamic profile completion score
  const getProfileCompletion = () => {
    let score = 30; // base score
    if (partner?.pan_number) score += 20;
    if (partner?.kyc_status === 'approved') score += 30;
    if (partner?.bank_name) score += 20;
    return score;
  };

  const handleCopyPartnerCode = () => {
    if (!partnerCode) {
      alert("Partner profile code not found.");
      return;
    }
    navigator.clipboard.writeText(partnerCode);
    alert("Partner Code copied to clipboard!");
  };

  const handleCopyCampaignLink = (prod) => {
    if (!partnerCode) {
      alert("Partner profile code not found. Make sure you are fully onboarded.");
      return;
    }
    const trackingLink = `${window.location.origin}/redirect/${prod.category}?id=${prod.id}&partner=${partnerCode}`;
    navigator.clipboard.writeText(trackingLink);
    alert(`Tracking link for ${prod.name} copied to clipboard!`);
  };

  // Get active products for Campaigns list
  const getActiveCampaigns = () => {
    if (!products || products.length === 0) {
      return [];
    }
    return [...products]
      .filter(p => p.is_active !== false)
      .sort((a, b) => parseFloat(b.commission_value || 0) - parseFloat(a.commission_value || 0))
      .slice(0, 4);
  };
  const activeCampaignsList = getActiveCampaigns();

  // Match brand logo from file assets
  const getBankLogoForProduct = (productName) => {
    const nameLower = (productName || "").toLowerCase();
    if (nameLower.includes("hdfc")) return hdfcLogo;
    if (nameLower.includes("axis")) return axisLogo;
    if (nameLower.includes("kotak")) return kotakLogo;
    if (nameLower.includes("sbi")) return sbiLogo;
    if (nameLower.includes("icici")) return iciciLogo;
    if (nameLower.includes("yes")) return yesLogo;
    if (nameLower.includes("idfc")) return idfcLogo;
    if (nameLower.includes("baroda") || nameLower.includes("bob")) return bobLogo;
    return null;
  };

  // Format dynamic recent applications list
  const getRecentApplications = () => {
    if (!allLeads || allLeads.length === 0) {
      return [];
    }

    return allLeads.slice(0, 5).map(lead => {
      const name = lead.customer_name || "Customer";
      const names = name.split(" ");
      const initials = names.map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      const colors = [
        { bg: "#E0F2FE", color: "#0369A1" },
        { bg: "#F3E8FF", color: "#7E22CE" },
        { bg: "#FCE7F3", color: "#BE185D" },
        { bg: "#DCFCE7", color: "#15803D" },
        { bg: "#FEE2E2", color: "#B91C1C" }
      ];
      const colorIndex = name.length % colors.length;
      const themeColors = colors[colorIndex];

      const statusRaw = lead.status || "Pending";
      let status = "Under Review";
      if (statusRaw.toLowerCase() === 'approved') status = "Approved";
      if (statusRaw.toLowerCase() === 'rejected') status = "Rejected";

      const amount = lead.amount ? `₹${parseFloat(lead.amount).toLocaleString("en-IN")}` : "—";

      return {
        initials,
        name,
        product: lead.product_name || "Financial Product",
        amount,
        status,
        color: status === "Approved" ? "#10B981" : status === "Rejected" ? "#EF4444" : "#3B82F6",
        bg: status === "Approved" ? "#ECFDF5" : status === "Rejected" ? "#FEE2E2" : "#EFF6FF",
        ...themeColors
      };
    });
  };

  const recentAppsList = getRecentApplications();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* ──── STATUS / KYC WARNING BANNERS ──── */}
      {kycStatus !== 'approved' && (
        <div style={{
          background: kycStatus === 'rejected' ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
          border: `1.5px solid ${kycStatus === 'rejected' ? "#EF4444" : "#F59E0B"}`,
          borderRadius: "16px",
          padding: "20px 24px",
          color: C.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "280px" }}>
            <span style={{ fontSize: "28px" }}>{kycStatus === 'rejected' ? "🔴" : "🟡"}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: kycStatus === 'rejected' ? "#DC2626" : "#D97706" }}>
                {kycStatus === 'rejected' ? "KYC Rejected" : kycStatus === 'under_review' ? "KYC Under Verification" : "KYC Pending"}
              </h4>
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.textMid, margin: 0, lineHeight: 1.4 }}>
                {kycStatus === 'rejected' ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: C.text }}>Reason:</div>
                    {(partner?.rejection_reason || partner?.kyc_rejection_reason) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: `3px solid #EF4444`, marginBottom: "4px" }}>
                        {(partner.rejection_reason || partner.kyc_rejection_reason).split('; ').map((reason, idx) => (
                          <div key={idx} style={{ color: "#EF4444", fontWeight: 700 }}>• {reason}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: C.textMid, marginBottom: "4px" }}>Your documents require correction.</div>
                    )}
                    <div style={{ fontSize: "13px", color: C.textLight }}>Please upload corrected documents.</div>
                  </div>
                ) : kycStatus === 'under_review' ? (
                  <p style={{ margin: 0 }}>Your KYC documents have been submitted and are under verification by the Super Admin.</p>
                ) : (
                  <p style={{ margin: 0 }}>Complete your KYC verification to unlock Products, Wallet, Customers, Reports, and Applications.</p>
                )}
              </div>
            </div>
          </div>
          {kycStatus !== 'under_review' && (
            <button
              onClick={() => navigate("/partner/kyc-centre")}
              style={{
                padding: "10px 20px",
                background: kycStatus === 'rejected' ? "#EF4444" : "#F59E0B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: kycStatus === 'rejected' ? "0 4px 12px rgba(239,68,68,0.3)" : "0 4px 12px rgba(245,158,11,0.3)",
                transition: "all 0.2s"
              }}
            >
              {kycStatus === 'rejected' ? "Re-upload Documents" : "Complete KYC"}
            </button>
          )}
        </div>
      )}

      {/* Account Inactive Banner (only shown if KYC is approved but account status is inactive) */}
      {kycStatus === 'approved' && accountStatus === 'inactive' && (
        <div style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: "1.5px solid #EF4444",
          borderRadius: "16px",
          padding: "20px 24px",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
          <span style={{ fontSize: "28px" }}>🟠</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#DC2626" }}>
              Account Inactive
            </h4>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: C.textMid, margin: 0, lineHeight: 1.4 }}>
              Your account is inactive. Please contact support.
            </p>
          </div>
        </div>
      )}

      {/* ──── HEADER BAR ──── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", margin: "4px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Partner Dashboard</h1>
        {partnerCode && (
          <div 
            onClick={handleCopyPartnerCode}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#1E40AF",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 700,
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(30,64,175,0.2)",
              transition: "transform 0.15s"
            }}
            className="hover-scale"
          >
            <span>Partner Code</span>
            <span style={{ background: "#3B82F6", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>{partnerCode}</span>
            <MdContentCopy size={14} />
          </div>
        )}
      </div>


      {/* ──── KPI CARDS ROW ──── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        
        {/* Total Applications */}
        <div style={{
          background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>Total Applications</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "6px" }}>{kpiTotalApps}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", marginTop: "6px" }}>{getLeadsTrend()}</div>
          </div>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", background: "#EFF6FF", color: "#3B82F6",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdDescription size={22} />
          </div>
        </div>

        {/* Approved Applications */}
        <div style={{
          background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>Approved Applications</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "6px" }}>{kpiApprovedApps}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", marginTop: "6px" }}>{getApprovedTrend()}</div>
          </div>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", background: "#ECFDF5", color: "#10B981",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdCheckCircle size={22} />
          </div>
        </div>

        {/* Total Earnings */}
        <div style={{
          background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>Total Earnings</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "6px" }}>{totalEarned}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", marginTop: "6px" }}>Calculated live</div>
          </div>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", background: "#F3E8FF", color: "#8B5CF6",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdAccountBalanceWallet size={22} />
          </div>
        </div>

        {/* Available Balance */}
        <div style={{
          background: "#FFFFFF", borderRadius: "16px", padding: "20px", border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B" }}>Available Balance</span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "6px" }}>{walletBalance}</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>Withdraw anytime</div>
          </div>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", background: "#EFF6FF", color: "#3B82F6",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdAccountBalanceWallet size={22} />
          </div>
        </div>

      </div>

      {/* ──── MIDDLE SECTION (3 COLUMNS) ──── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        
        {/* Column 1: Active Campaigns & Payout Boosts (100% Dynamic) */}
        <div style={{
          flex: "1.2",
          minWidth: "300px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Active Campaigns</h3>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#3B82F6", background: "#EFF6FF", padding: "2px 8px", borderRadius: "4px" }}>LIVE OFFERS</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            {activeCampaignsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#64748B", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <MdCampaign size={36} style={{ color: "#CBD5E1", marginBottom: "8px" }} />
                <div style={{ fontSize: "13px", fontWeight: 700 }}>No active offers</div>
                <p style={{ fontSize: "11px", margin: "4px 0 0" }}>Check back later for active campaigns.</p>
              </div>
            ) : (
              activeCampaignsList.map((camp, idx) => {
                const logo = getBankLogoForProduct(camp.name);
                const payoutValText = camp.commission_type === 'percentage' 
                  ? `${parseFloat(camp.commission_value)}% Commission` 
                  : `₹${parseFloat(camp.commission_value).toLocaleString("en-IN")} Payout`;
                return (
                  <div key={idx} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px", borderRadius: "12px", border: "1px solid #F1F5F9",
                    background: "#FAFAFA"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {logo ? (
                        <img src={logo} alt="" style={{ height: "24px", width: "24px", objectFit: "contain" }} />
                      ) : (
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#EFF6FF", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>🏦</div>
                      )}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{camp.name}</div>
                        <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>{payoutValText}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopyCampaignLink(camp)}
                      style={{
                        background: "#FFFFFF", color: "#1E40AF", border: "1px solid #BFDBFE",
                        padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      Share Link
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Application Status (Donut Chart) */}
        <div style={{
          flex: "1",
          minWidth: "280px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>Application Status</h3>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "center", flex: 1 }}>
            
            {/* Pure CSS Donut Chart */}
            <div style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: kpiTotalApps > 0 
                ? `conic-gradient(#10B981 0deg ${deg1}deg, #3B82F6 ${deg1}deg ${deg2}deg, #EF4444 ${deg2}deg ${deg3}deg, #8B5CF6 ${deg3}deg 360deg)`
                : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>{kpiTotalApps}</span>
                <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Total</span>
              </div>
            </div>

            {/* Labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ color: "#64748B" }}>Approved</span>
                <span style={{ color: "#0F172A", marginLeft: "auto" }}>{kpiApprovedApps} ({approvedPct}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} />
                <span style={{ color: "#64748B" }}>Review</span>
                <span style={{ color: "#0F172A", marginLeft: "auto" }}>{kpiPendingApps} ({pendingPct}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                <span style={{ color: "#64748B" }}>Rejected</span>
                <span style={{ color: "#0F172A", marginLeft: "auto" }}>{kpiRejectedApps} ({rejectedPct}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6" }} />
                <span style={{ color: "#64748B" }}>Disbursed</span>
                <span style={{ color: "#0F172A", marginLeft: "auto" }}>{kpiDisbursedApps} ({disbursedPct}%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Column 3: Recent Applications (100% Dynamic) */}
        <div style={{
          flex: "1",
          minWidth: "280px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Recent Applications</h3>
            <button 
              onClick={() => navigate("/partner/applications")}
              style={{ background: "none", border: "none", color: "#1E40AF", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
            >
              View All
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "center" }}>
            {recentAppsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#64748B" }}>
                <MdDescription size={40} style={{ color: "#CBD5E1", marginBottom: "8px" }} />
                <div style={{ fontSize: "13px", fontWeight: 700 }}>No applications yet</div>
                <p style={{ fontSize: "11px", margin: "4px 0 0" }}>Start applying for products to submit leads.</p>
              </div>
            ) : (
              recentAppsList.map((app, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: idx === recentAppsList.length - 1 ? "none" : "1px solid #F8FAFC"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", background: app.bg, color: app.color,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700
                    }}>
                      {app.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>{app.product} · {app.amount}</span>
                    </div>
                  </div>
                  <span style={{
                    color: app.color, background: `${app.color}15`, padding: "2px 8px", borderRadius: "20px",
                    fontSize: "10px", fontWeight: 700
                  }}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ──── BOTTOM SECTION (3 COLUMNS) ──── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        
        {/* Quick Actions (takes more width) */}
        <div style={{
          flex: "1.2",
          minWidth: "300px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "Apply Product", icon: MdStorefront, color: "#3B82F6", route: "/partner/products" },
              { label: "Add Customer", icon: MdPeople, color: "#10B981", route: "/partner/crm" },
              { label: "Check Status", icon: MdTimeline, color: "#F59E0B", route: "/partner/applications" },
              { label: "My Wallet", icon: MdAccountBalanceWallet, color: "#3B82F6", route: "/partner/wallet" },
              { label: "Training", icon: MdSchool, color: "#EC4899", route: "/partner/training" },
              { label: "Marketing Tools", icon: MdCampaign, color: "#D97706", route: "/partner/marketing" }
            ].map((act, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(act.route)}
                style={{
                  border: "1px solid #F1F5F9", borderRadius: "12px", padding: "14px 10px",
                  textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "8px", background: "#FFFFFF", transition: "transform 0.15s"
                }}
                className="hover-scale"
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", background: `${act.color}15`,
                  color: act.color, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <act.icon size={20} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{act.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance (100% Dynamic) */}
        <div style={{
          flex: "1",
          minWidth: "260px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: "0 0 16px" }}>Team Performance</h3>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
            <div>
              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A" }}>
                    {teamDashboard?.total_team_members || 0}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Total Members</span>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#10B981" }}>
                    {teamDashboard?.active_team_members || 0}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Active Members</span>
                </div>
              </div>
            </div>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%", background: "#EFF6FF", color: "#3B82F6",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <MdGroup size={24} />
            </div>
          </div>

          <button 
            onClick={() => navigate("/partner/team")}
            style={{
              background: "none", border: "none", color: "#1E40AF", fontSize: "13px", fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0, marginTop: "16px"
            }}
          >
            Manage Team <MdChevronRight size={16} />
          </button>
        </div>

        {/* Monthly Target (100% Dynamic) */}
        <div style={{
          flex: "1",
          minWidth: "260px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid #F1F5F9`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Monthly Target</h3>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", background: "#EFF6FF", color: "#3B82F6",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <MdCampaign size={18} />
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>₹{currentEarnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>of ₹{targetGoal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} target achieved</span>
            
            <div style={{ marginTop: "16px" }}>
              <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden", marginBottom: "6px" }}>
                <div style={{ width: `${targetPercent}%`, height: "100%", background: "#3B82F6", borderRadius: "10px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#3B82F6", fontWeight: 700 }}>{targetPercent}% completed</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// ── PERMISSION LOCK OVERLAY ─────────────────────────────────
function PermissionOverlay({ C, isRejected }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "rgba(255, 255, 255, 0.12)",
      backdropFilter: "blur(4px)",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: isRejected ? `${C.red}12` : `${C.gold}12`,
        color: isRejected ? C.red : C.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <MdLock size={24} />
      </div>
      <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Action Blocked</h4>
      <p style={{ fontSize: "11px", color: C.textLight, margin: 0, maxWidth: "220px", fontWeight: 600 }}>
        {isRejected 
          ? "Your KYC documents were rejected. Please fix and re-upload documents in the KYC Centre." 
          : "Your KYC verification is currently pending. Some features will remain disabled until approval."}
      </p>
    </div>
  );
}

// ── SKELETON LOADER COMPONENT ───────────────────────────────
function DashboardSkeleton({ C }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      <div style={{ height: "120px", background: C.card, borderRadius: "16px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: "90px", background: C.card, borderRadius: "16px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ flex: "1.5", height: "350px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        <div style={{ flex: "1", height: "350px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
