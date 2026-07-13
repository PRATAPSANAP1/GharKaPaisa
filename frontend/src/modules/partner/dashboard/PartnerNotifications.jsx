import React, { useState, useEffect } from 'react';
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import api from "../../../services/api";
import {
  MdNotifications, MdCheckCircle, MdDeleteSweep,
  MdArrowBack, MdAccessTime, MdInfoOutline
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function PartnerNotifications() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit: 100 } });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      if (res.data?.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px", background: C.bgSecondary, border: `1.5px solid ${C.border}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <MdArrowBack size={18} style={{ color: C.text }} />
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: C.text, margin: 0 }}>Notification Center</h2>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0" }}>Stay updated on lead approval progress, wallet transactions, and commission payouts.</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
              background: C.bgSecondary, border: `1.5px solid ${C.border}`, color: C.text,
              borderRadius: "10px", fontWeight: 700, fontSize: "12px", cursor: "pointer"
            }}
            className="hover-item"
          >
            <MdCheckCircle size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ ...S.card, padding: "20px", borderRadius: "16px", minHeight: "300px" }}>
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: C.textLight, fontSize: "13px" }}>
            <span style={{
              width: "24px", height: "24px", borderRadius: "50%",
              border: `3px solid ${C.border}`, borderTopColor: C.primary,
              animation: "spin 0.8s linear infinite", display: "inline-block", marginBottom: "12px"
            }} />
            <div>Loading your alerts feed...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.bgSecondary, color: C.textLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MdNotifications size={28} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Inbox clean!</h3>
            <p style={{ fontSize: "13px", color: C.textLight, margin: 0 }}>You don't have any updates or system alerts at this moment.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: item.is_read ? "transparent" : `${C.primary}06`,
                  border: `1.5px solid ${item.is_read ? C.border : `${C.primary}20`}`,
                  borderLeft: `4px solid ${item.is_read ? C.textLight : C.primary}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ marginTop: "2px", color: item.is_read ? C.textLight : C.primary }}>
                    <MdInfoOutline size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: C.text }}>
                      {item.title || "GKP System Update"}
                    </h4>
                    <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: C.textMid, lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    <span style={{ fontSize: "10px", color: C.textLight, display: "flex", alignItems: "center", gap: "4px" }}>
                      <MdAccessTime size={12} /> {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    title="Mark as read"
                    style={{
                      background: "none", border: "none", padding: "6px",
                      color: C.primary, cursor: "pointer", display: "flex",
                      alignItems: "center", borderRadius: "50%", transition: "0.15s"
                    }}
                    className="hover-item"
                  >
                    <MdCheckCircle size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
