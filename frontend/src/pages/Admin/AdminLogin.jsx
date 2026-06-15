import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import api from "../../api/api";
import logo from "../../logo.jpeg";
import { Icons } from "../../components/Partner/PartnerIcons";

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.email.trim() || !form.password) {
      return setErr("Please enter both email and password.");
    }

    setLoading(true);
    try {
      // 1. Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Fetch Profile from Backend
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success && response.data.user) {
        const role = response.data.user.role.toLowerCase();
        
        // Ensure only admin or superadmin can log in here
        if (role !== 'admin' && role !== 'superadmin' && role !== 'super_admin') {
           auth.signOut();
           throw new Error("Access denied. You do not have admin privileges.");
        }

        // 3. Set global state and redirect
        login(response.data.user, idToken);
        
        if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/superadmin/dashboard');
      } else {
        throw new Error("Failed to fetch user profile.");
      }
    } catch (e) {
      setErr(e.code ? e.message.replace("Firebase: ", "") : e.message || "Invalid credentials. Please try again.");
      auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      return setErr("Please enter your email address first to reset your password.");
    }
    setResetLoading(true);
    setErr("");
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      setErr("Password reset email sent! Please check your inbox.");
    } catch (e) {
      setErr(e.code ? e.message.replace("Firebase: ", "") : "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#1e293b",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s, box-shadow 0.2s"
  };

  return (
    <div style={{ height: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src={logo} alt="Logo" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `2px solid #0f172a`, marginBottom: "16px" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>System Administration</h2>
          <p style={{ color: "#64748b", marginTop: "8px" }}>Sign in to Admin / SuperAdmin portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          {err && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", textAlign: "center" }}>{err}</div>}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Admin Email</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                <Icons.User size={18} />
              </div>
              <input
                type="email"
                placeholder="admin@example.com"
                style={{ ...inputStyle, paddingLeft: "42px" }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                {resetLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                <Icons.Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                style={{ ...inputStyle, paddingLeft: "42px", paddingRight: "42px" }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
