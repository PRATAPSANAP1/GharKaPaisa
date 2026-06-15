import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import api from "../../api/api";
import logo from "../../logo.jpeg";
import { Icons } from "./PartnerIcons";

export default function PartnerLogin() {
  const { C } = useTheme();
  const S = makeS(C);
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
        // 3. Set global state and redirect
        login(response.data.user, idToken);
        
        const role = response.data.user.role.toLowerCase();
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'superadmin') navigate('/superadmin/dashboard');
        else navigate('/partner/dashboard');
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

  const inputStyle = { ...S.input };

  return (
    <div style={{ height: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 99 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img src={logo} alt="Logo" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.teal}`, marginBottom: "16px" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: C.text, margin: 0 }}>Welcome Back</h2>
          <p style={{ color: C.textSecondary, marginTop: "8px" }}>Sign in to your Partner portal</p>
        </div>

        <form onSubmit={handleSubmit} style={S.card}>
          {err && <div style={{ background: `${C.danger}15`, color: C.danger, padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", textAlign: "center" }}>{err}</div>}

          <div style={{ marginBottom: "20px" }}>
            <label style={S.label}>Email Address</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                <Icons.User size={18} />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                style={{ ...inputStyle, paddingLeft: "42px" }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={S.label}>Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{ background: "none", border: "none", color: C.teal, fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                {resetLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                <Icons.Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                style={{ ...inputStyle, paddingLeft: "42px", paddingRight: "42px" }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...S.buttonPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
