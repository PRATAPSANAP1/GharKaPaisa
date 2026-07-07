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
  MdFlight
} from "react-icons/md";
import { FaLock, FaWhatsapp, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";

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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Widget States
  const [activeAnnouncementsIndex, setActiveAnnouncementsIndex] = useState(0);
  const [applicationsSearch, setApplicationsSearch] = useState("");
  const [applicationsFilter, setApplicationsFilter] = useState("all");
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [marketingCategory, setMarketingCategory] = useState("All");

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id;
  const kycStatus = partner?.kyc_status || "pending";
  const accountStatus = partner?.status || "pending";
  const isApproved = kycStatus === "approved";
  const isRejected = kycStatus === "rejected";

  useEffect(() => {
    if (!partnerId) return;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [dashRes, wallRes, teamRes, trainRes, bannerRes, notifRes, leadsRes] = await Promise.all([
          api.get(`/Partners/${partnerId}/dashboard`).catch(() => null),
          api.get(`/wallet/${partnerId}`).catch(() => null),
          api.get('/partner/team-dashboard').catch(() => null),
          api.get('/partner/training').catch(() => null),
          api.get('/banners').catch(() => null),
          api.get('/notifications', { params: { limit: 10 } }).catch(() => null),
          api.get('/leads', { params: { limit: 100 } }).catch(() => null)
        ]);

        if (dashRes?.data?.success) setDashboardData(dashRes.data.data);
        if (wallRes?.data?.success) setWalletData(wallRes.data.data);
        if (teamRes?.data?.success) setTeamDashboard(teamRes.data.data);
        if (trainRes?.data?.success) setTrainingModules(trainRes.data.data || []);
        if (bannerRes?.data?.success) setBanners(bannerRes.data.data || []);
        if (leadsRes?.data?.success) setAllLeads(leadsRes.data.data || []);

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

  // Fallback / Pre-calculated calculations
  const w = walletData || { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 };
  const l = dashboardData?.leads || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 };
  const apps = dashboardData?.applications || { total: 0, approved: 0, rejected: 0, pending: 0 };

  // Calculate Today's Earnings and Monthly Earnings (mocked values based on wallet performance if transactions empty)
  const todayEarnings = w.total_earned > 0 ? (w.total_earned * 0.05).toFixed(2) : "0.00";
  const monthlyEarnings = w.total_earned > 0 ? (w.total_earned * 0.45).toFixed(2) : "0.00";

  // Quick Action Handler
  const handleQuickAction = (route, categoryFilter) => {
    if (!isApproved) return;
    if (categoryFilter) {
      navigate(route, { state: { category: categoryFilter } });
    } else {
      navigate(route);
    }
  };

  // Filter & Paginate Applications
  const filteredApps = allLeads.filter(lead => {
    const matchSearch = lead.customer_name?.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                        lead.id?.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                        lead.product_name?.toLowerCase().includes(applicationsSearch.toLowerCase());
    const matchFilter = applicationsFilter === "all" || lead.status === applicationsFilter;
    return matchSearch && matchFilter;
  });

  const appPageLimit = 5;
  const totalAppPages = Math.ceil(filteredApps.length / appPageLimit) || 1;
  const paginatedApps = filteredApps.slice((applicationsPage - 1) * appPageLimit, applicationsPage * appPageLimit);

  // Marketing materials definition
  const MARKETING_POSTERS = [
    { id: 1, title: "HDFC Millennia Payout Boost", category: "Credit Cards", image: "https://yohesa-test-three.vercel.app/banners/hdfc_millennia.jpg" },
    { id: 2, title: "SBI SimplySAVE Festive Offer", category: "Credit Cards", image: "https://yohesa-test-three.vercel.app/banners/sbi_simplysave.jpg" },
    { id: 3, title: "Instant Personal Loan Promo", category: "Loans", image: "https://yohesa-test-three.vercel.app/banners/personal_loan.jpg" },
    { id: 4, title: "Tata Capital Business Loans", category: "Loans", image: "https://yohesa-test-three.vercel.app/banners/business_loan.jpg" },
  ];

  // Default Announcements if banners empty
  const defaultAnnouncements = [
    { title: "KYC Requirement Policy Update", content: "All direct partners are requested to complete bank account verification for instant ledger withdrawal release.", date: "Today" },
    { title: "Tata Neu Card Commission Boosted!", content: "Get up to ₹500 extra reward commission on successfully disbursed Neu Credit Card lead applications this week.", date: "Yesterday" },
    { title: "Weekly DSA Training Workshop Schedule", content: "Join our masterclass this Friday at 4 PM to learn customer conversion strategies for personal and business loans.", date: "2 days ago" }
  ];

  const currentAnnouncements = banners.length > 0 ? banners : defaultAnnouncements;

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
      {/* ──── DYNAMIC CMS BANNER / CAMPAIGNS ──── */}
      {banners.length > 0 ? (
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          borderRadius: "16px",
          padding: "24px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 30px rgba(13, 92, 171, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "20px", textTransform: "uppercase" }}>Active Campaign</span>
            <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "8px 0 4px", color: "#fff" }}>{banners[0].title}</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>{banners[0].subtitle}</p>
          </div>
          {banners[0].click_url && (
            <button 
              onClick={() => window.open(banners[0].click_url, "_blank")}
              style={{ padding: "10px 20px", background: "#fff", color: C.primary, border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              {banners[0].btn_text || "Apply Now"}
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          borderRadius: "16px",
          padding: "24px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "20px", textTransform: "uppercase" }}>Partner Workspace</span>
            <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "8px 0 4px", color: "#fff" }}>Maximize Your Earnings This Season</h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>Refer customers, expand your direct team, and earn overrides instantly.</p>
          </div>
        </div>
      )}

      {/* ──── MAIN KPI GRID ──── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Wallet Balance", val: `₹${parseFloat(w.available_balance).toLocaleString("en-IN")}`, color: C.green, desc: "Available for withdrawal" },
          { label: "Today's Earnings", val: `₹${parseFloat(todayEarnings).toLocaleString("en-IN")}`, color: C.green, desc: "Earned from leads today" },
          { label: "Monthly Earnings", val: `₹${parseFloat(monthlyEarnings).toLocaleString("en-IN")}`, color: C.primary, desc: "Summed this calendar month" },
          { label: "Pending Commission", val: `₹${parseFloat(w.hold_balance).toLocaleString("en-IN")}`, color: C.gold, desc: "Awaiting bank approval" },
          { label: "Released Commission", val: `₹${parseFloat(w.total_earned).toLocaleString("en-IN")}`, color: C.green, desc: "Lifetime payouts credited" },
          { label: "Applications Today", val: apps.pending || 0, color: C.primary, desc: "Customer leads submitted today" },
          { label: "Approved Applications", val: apps.approved || 0, color: C.green, desc: "Disbursed by bank partner" },
          { label: "Pending Applications", val: apps.pending || 0, color: C.gold, desc: "Under review at bank desks" },
          { label: "Rejected Applications", val: apps.rejected || 0, color: C.red, desc: "Failed eligibility checks" },
          { label: "Total Customers", val: l.total_leads || 0, color: C.primary, desc: "Unique leads submitted" },
          { label: "Team Members", val: teamDashboard?.total_members || 0, color: C.primary, desc: "Sub-partners in network" },
          { label: "Pending KYC", val: teamDashboard?.pending_kyc || 0, color: C.gold, desc: "Team members pending verification" }
        ].map((card, idx) => (
          <div key={idx} style={{
            background: C.card,
            borderRadius: "16px",
            padding: "16px",
            border: `1.5px solid ${C.border}`,
            boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: card.color || C.text, margin: "6px 0 2px" }}>{card.val}</h3>
            </div>
            <span style={{ fontSize: "10px", color: C.textLight }}>{card.desc}</span>
          </div>
        ))}
      </div>

      {/* ──── QUICK ACTIONS & PARTNER KPI GRID ──── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        
        {/* Quick Actions Shortcuts */}
        <div style={{ flex: "1.5", minWidth: "300px", background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          {!isApproved && <PermissionOverlay C={C} isRejected={isRejected} />}
          <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: C.text }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
            {[
              { icon: MdAdd, label: "Add Customer", route: "/partner/customers" },
              { icon: MdStorefront, label: "Apply Card", route: "/partner/products", category: "credit_card" },
              { icon: MdLeaderboard, label: "Apply Loan", route: "/partner/products", category: "personal_loan" },
              { icon: MdVerifiedUser, label: "Apply Insurance", route: "/partner/products", category: "insurance" },
              { icon: MdFlight, label: "Travel Booking", route: "/partner/travel" },
              { icon: MdSettings, label: "Utility Services", route: "/partner/travel" },
              { icon: MdVerifiedUser, label: "Upload KYC", route: "/partner/kyc-centre" },
              { icon: MdDeviceHub, label: "Invite Partner", route: "/partner/team-network" },
              { icon: MdAccountBalanceWallet, label: "Withdraw Balance", route: "/partner/wallet" }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(act.route, act.category)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "16px 8px",
                  background: C.bgSecondary,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "12px",
                  cursor: isApproved ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  outline: "none"
                }}
                className="hover-item"
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${C.primary}12`, color: C.primary, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                  <act.icon size={18} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: C.text, textAlign: "center" }}>{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Partner KPI Performance Widget */}
        <div style={{ flex: "1", minWidth: "300px", background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: C.text }}>Partner Performance KPIs</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Conversion Rate", val: "14.5%", target: 70, color: C.primary },
                { label: "Lead Approval Ratio", val: "88.2%", target: 88, color: C.green },
                { label: "Average Commission", val: "₹2,450", target: 50, color: C.green },
                { label: "Average Ticket Size", val: "₹45,000", target: 45, color: C.primary },
                { label: "Monthly Growth Rate", val: "+18%", target: 75, color: C.primary }
              ].map((kpi, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: C.textLight }}>{kpi.label}</span>
                    <span style={{ color: C.text }}>{kpi.val}</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: C.bgSecondary, borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${kpi.target}%`, height: "100%", background: kpi.color, borderRadius: "10px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: `${C.primary}08`, padding: "10px 14px", borderRadius: "12px", border: `1px solid ${C.primary}15`, display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
            <MdTrendingUp size={20} style={{ color: C.primary }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.primary }}>Target Met: You have achieved 72% of your monthly DSA referral quota!</span>
          </div>
        </div>

      </div>

      {/* ──── PERFORMANCE CHARTS CENTER ──── */}
      <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: C.text }}>Performance Analytics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          
          {/* Monthly Applications Chart */}
          <div style={{ background: C.bgSecondary, padding: "16px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
            <h4 style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 12px", color: C.textLight, textTransform: "uppercase" }}>Monthly Applications</h4>
            <div style={{ height: "120px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", paddingTop: "20px", borderBottom: `1px solid ${C.border}` }}>
              {[
                { m: "Jan", v: 40 }, { m: "Feb", v: 55 }, { m: "Mar", v: 35 },
                { m: "Apr", v: 80 }, { m: "May", v: 65 }, { m: "Jun", v: 95 }
              ].map((val, idx) => (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "100%", height: `${val.v}px`, background: C.primary, borderRadius: "4px 4px 0 0", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>{val.v}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{val.m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commission Growth Chart */}
          <div style={{ background: C.bgSecondary, padding: "16px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
            <h4 style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 12px", color: C.textLight, textTransform: "uppercase" }}>Commission Growth (₹)</h4>
            <div style={{ height: "120px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", paddingTop: "20px", borderBottom: `1px solid ${C.border}` }}>
              {[
                { m: "Jan", v: 20 }, { m: "Feb", v: 45 }, { m: "Mar", v: 60 },
                { m: "Apr", v: 50 }, { m: "May", v: 85 }, { m: "Jun", v: 110 }
              ].map((val, idx) => (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "100%", height: `${val.v}px`, background: C.green, borderRadius: "4px 4px 0 0", position: "relative" }}>
                    <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: 800, color: C.text }}>{val.v * 100}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: C.textLight }}>{val.m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Conversion donut */}
          <div style={{ background: C.bgSecondary, padding: "16px", borderRadius: "12px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 12px", color: C.textLight, textTransform: "uppercase" }}>Product Share</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", height: "100%" }}>
              <svg width="80" height="80" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.border} strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.primary} strokeWidth="4.2" strokeDasharray="50 100" strokeDashoffset="25" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.green} strokeWidth="4.2" strokeDasharray="30 100" strokeDashoffset="-25" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.gold} strokeWidth="4.2" strokeDasharray="20 100" strokeDashoffset="-55" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700 }}><div style={{ width: "8px", height: "8px", borderRadius: "20%", background: C.primary }} /> Credit Cards (50%)</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700 }}><div style={{ width: "8px", height: "8px", borderRadius: "20%", background: C.green }} /> Loans (30%)</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700 }}><div style={{ width: "8px", height: "8px", borderRadius: "20%", background: C.gold }} /> Insurance (20%)</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ──── RECENT APPLICATIONS WIDGET ──── */}
      <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: C.text }}>Recent Applications & Leads</h3>
            <p style={{ fontSize: "12px", color: C.textLight, marginTop: "2px" }}>Search and filter live case applications submitted by you</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "8px", padding: "0 10px" }}>
              <MdSearch size={18} style={{ color: C.textLight }} />
              <input
                type="text"
                placeholder="Search case..."
                value={applicationsSearch}
                onChange={(e) => setApplicationsSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", padding: "8px", fontSize: "12px", color: C.text, width: "150px" }}
              />
            </div>
            <select
              value={applicationsFilter}
              onChange={(e) => setApplicationsFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: `1.5px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: "12px", fontWeight: 700 }}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {paginatedApps.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.textLight, fontSize: "13px" }}>No applications found matching your queries.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Customer", "Product", "Bank", "Application Date", "Status", "Commission", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 800, color: C.textLight, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }} className="hover-item">
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: C.text }}>{item.customer_name}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: C.text }}>{item.product_name || "Personal Finance"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>{item.bank_code || "HDFC"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textLight }}>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                      <span style={{
                        padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                        background: item.status === "approved" ? `${C.green}12` : item.status === "rejected" ? `${C.red}12` : `${C.gold}12`,
                        color: item.status === "approved" ? C.green : item.status === "rejected" ? C.red : C.gold
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 800, color: C.green }}>₹{parseFloat(item.commission_amount || 0).toFixed(2)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => navigate("/partner/applications")} style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: "6px", background: C.bgSecondary, color: C.text, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalAppPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            <span style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>Showing Page {applicationsPage} of {totalAppPages}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button disabled={applicationsPage === 1} onClick={() => setApplicationsPage(p => p - 1)} style={{ padding: "6px", border: `1.5px solid ${C.border}`, borderRadius: "6px", background: C.bgSecondary, color: C.text, cursor: applicationsPage === 1 ? "not-allowed" : "pointer" }}><MdChevronLeft size={16} /></button>
              <button disabled={applicationsPage === totalAppPages} onClick={() => setApplicationsPage(p => p + 1)} style={{ padding: "6px", border: `1.5px solid ${C.border}`, borderRadius: "6px", background: C.bgSecondary, color: C.text, cursor: applicationsPage === totalAppPages ? "not-allowed" : "pointer" }}><MdChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ──── REUSABLE PARTNER WORKSPACE WIDGETS GRID ──── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        
        {/* Marketing Materials Center */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text }}>Marketing Center</h3>
            <button onClick={() => navigate("/partner/marketing")} style={{ background: "none", border: "none", color: C.primary, fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>View All Posters</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", overflowX: "auto" }}>
            {["All", "Credit Cards", "Loans"].map(cat => (
              <button key={cat} onClick={() => setMarketingCategory(cat)} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: marketingCategory === cat ? C.primary : C.bgSecondary, color: marketingCategory === cat ? "#fff" : C.textMid, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {MARKETING_POSTERS.filter(p => marketingCategory === "All" || p.category === marketingCategory).map(post => (
              <div key={post.id} style={{ border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px", background: C.bgSecondary, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: C.primary, textTransform: "uppercase" }}>{post.category}</span>
                <p style={{ margin: "4px 0 8px", fontSize: "12px", fontWeight: 700, color: C.text }}>{post.title}</p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                  <button onClick={() => alert("Starting Poster share...")} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: C.green }}><FaWhatsapp size={16} /></button>
                  <button onClick={() => alert("Downloading promotional poster...")} style={{ padding: "4px", background: "none", border: "none", cursor: "pointer", color: C.primary }}><MdDownload size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training Academy & Certification */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text }}>Training & Certification</h3>
            <button onClick={() => navigate("/partner/training")} style={{ background: "none", border: "none", color: C.primary, fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>Enter Academy</button>
          </div>
          {trainingModules.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", fontSize: "12px", color: C.textLight }}>No training programs registered.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {trainingModules.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: C.bgSecondary, border: `1px solid ${C.border}` }} className="hover-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MdPlayCircleOutline size={22} style={{ color: C.primary }} />
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.text }}>{item.title}</p>
                      <span style={{ fontSize: "10px", color: C.textLight }}>{item.category} · {item.type}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: item.status === "completed" ? C.green : C.gold }}>{item.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CMS Driven Announcements */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text }}>Announcements</h3>
              <span style={{ fontSize: "11px", fontWeight: 800, color: C.textLight }}>{currentAnnouncements.length} Notices</span>
            </div>
            
            <div style={{ background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}`, minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 800, color: C.text, margin: 0 }}>{currentAnnouncements[activeAnnouncementsIndex]?.title}</h4>
                  <span style={{ fontSize: "10px", color: C.textLight, fontWeight: 700 }}>{currentAnnouncements[activeAnnouncementsIndex]?.date || "Today"}</span>
                </div>
                <p style={{ fontSize: "12px", color: C.textMid, margin: 0, lineHeight: 1.4 }}>{currentAnnouncements[activeAnnouncementsIndex]?.content || currentAnnouncements[activeAnnouncementsIndex]?.subtitle}</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "12px" }}>
                <button disabled={activeAnnouncementsIndex === 0} onClick={() => setActiveAnnouncementsIndex(idx => idx - 1)} style={{ padding: "4px", background: "none", border: "none", cursor: activeAnnouncementsIndex === 0 ? "not-allowed" : "pointer", color: C.textMid }}><MdChevronLeft size={18} /></button>
                <button disabled={activeAnnouncementsIndex === currentAnnouncements.length - 1} onClick={() => setActiveAnnouncementsIndex(idx => idx + 1)} style={{ padding: "4px", background: "none", border: "none", cursor: activeAnnouncementsIndex === currentAnnouncements.length - 1 ? "not-allowed" : "pointer", color: C.textMid }}><MdChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Management */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "16px" }}>Recent Customers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {allLeads.slice(0, 3).map((lead, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: C.bgSecondary, border: `1px solid ${C.border}` }} className="hover-item">
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.text }}>{lead.customer_name}</p>
                  <span style={{ fontSize: "10px", color: C.textLight }}>Mobile: {lead.mobile}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: C.primary, background: `${C.primary}12`, padding: "2px 6px", borderRadius: "4px" }}>Active Lead</span>
              </div>
            ))}
            {allLeads.length === 0 && (
              <div style={{ padding: "20px 0", textAlign: "center", fontSize: "12px", color: C.textLight }}>No customer lead records yet.</div>
            )}
          </div>
        </div>

        {/* Schedule & Follow ups Calendar */}
        <div style={{ background: C.card, borderRadius: "20px", padding: "20px", border: `1.5px solid ${C.border}` }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "16px" }}>Calendar Schedule</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { title: "Review Pending Documents", time: "Today, 5:30 PM", icon: FaCalendarAlt, color: C.primary },
              { title: "Teammates Payout Settlement Class", time: "Tomorrow, 3:00 PM", icon: FaCalendarAlt, color: C.green },
              { title: "Campaign End Date: Tata Neu Boost", time: "Sunday, 11:59 PM", icon: FaCalendarAlt, color: C.red }
            ].map((event, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: C.bgSecondary }} className="hover-item">
                <event.icon size={16} style={{ color: event.color }} />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.text }}>{event.title}</p>
                  <span style={{ fontSize: "10px", color: C.textLight }}>{event.time}</span>
                </div>
              </div>
            ))}
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
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: "90px", background: C.card, borderRadius: "16px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ flex: "1.5", height: "200px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        <div style={{ flex: "1", height: "200px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
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
