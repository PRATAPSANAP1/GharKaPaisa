import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";
import partnerService from "../../api/partner.api";

export default function PartnerProfile({ partner, onLogout }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  // KYC Upload form state
  const [kycForm, setKycForm] = useState({
    aadhaar_number: "",
    pan_number: "",
  });
  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null,
    gst_cert: null,
    cancelled_cheque: null,
  });

  // Keep track of which already-uploaded documents the user wants to update
  const [reupload, setReupload] = useState({
    aadhaar: false,
    pan: false,
    gst_cert: false,
    cancelled_cheque: false,
  });

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id || partner?.PartnerID;

  const fetchProfile = async (isMounted = true) => {
    if (!partnerId) {
      if (isMounted) {
        setErrorMsg("Partner ID is missing.");
        setLoading(false);
      }
      return;
    }
    try {
      if (isMounted) setLoading(true);
      const res = await partnerService.getProfile(partnerId);
      if (isMounted) {
        if (res.data?.success) {
          setProfile(res.data.data);
          const kycDocs = res.data.data.kyc_documents || [];
          const adDoc = kycDocs.find(d => d.doc_type === "aadhaar");
          const panDoc = kycDocs.find(d => d.doc_type === "pan");
          setKycForm({
            aadhaar_number: adDoc?.doc_number || "",
            pan_number: panDoc?.doc_number || "",
          });
          const initialReupload = {
            aadhaar: false,
            pan: false,
            gst_cert: false,
            cancelled_cheque: false,
          };
          setReupload(initialReupload);
        } else {
          setErrorMsg("Failed to load profile details.");
        }
      }
    } catch (err) {
      if (isMounted) setErrorMsg("Something went wrong. Please try again.");
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchProfile(isMounted);
    return () => { isMounted = false; };
  }, [partnerId]);

  const handleFileChange = (field) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrorMsg(`Invalid file type for ${field}. Only PDF, JPG, and PNG are allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max size is 5MB.`);
        return;
      }
      setErrorMsg("");
      setFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleTextChange = (field) => (e) => {
    setKycForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setUploadSuccess("");

    const activeFiles = {};
    const activeNumbers = {};

    // Issue 16: Enforce Aadhaar and PAN co-dependence if both are missing
    const hasAadhaarOnServer = profile?.kyc_documents?.some(d => d.doc_type === "aadhaar");
    const hasPanOnServer = profile?.kyc_documents?.some(d => d.doc_type === "pan");
    
    const needsAadhaar = !hasAadhaarOnServer || reupload.aadhaar;
    const needsPan = !hasPanOnServer || reupload.pan;

    if (needsAadhaar && needsPan) {
      if ((files.aadhaar && !files.pan) || (!files.aadhaar && files.pan)) {
        setErrorMsg("Both Aadhaar and PAN documents must be uploaded together for initial KYC.");
        return;
      }
    }

    // Only upload files that are selected
    if (files.aadhaar) {
      activeFiles.aadhaar = files.aadhaar;
      if (!/^\d{12}$/.test(kycForm.aadhaar_number.trim())) {
        setErrorMsg("Please enter a valid 12-digit Aadhaar Card number.");
        return;
      }
      activeNumbers.aadhaar_number = kycForm.aadhaar_number.trim();
    }

    if (files.pan) {
      activeFiles.pan = files.pan;
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(kycForm.pan_number.trim())) {
        setErrorMsg("Please enter a valid 10-character PAN Card number.");
        return;
      }
      activeNumbers.pan_number = kycForm.pan_number.trim().toUpperCase();
    }

    if (files.gst_cert) activeFiles.gst_cert = files.gst_cert;
    if (files.cancelled_cheque) activeFiles.cancelled_cheque = files.cancelled_cheque;

    if (Object.keys(activeFiles).length === 0) {
      setErrorMsg("Please choose at least one document to upload.");
      return;
    }

    setUploadLoading(true);
    try {
      const res = await partnerService.uploadKYC(partnerId, activeFiles, activeNumbers);
      if (res.data?.success) {
        setUploadSuccess(res.data.message || "KYC documents uploaded successfully! KYC is under review.");
        setFiles({
          aadhaar: null,
          pan: null,
          gst_cert: null,
          cancelled_cheque: null,
        });
        await fetchProfile();
      } else {
        setErrorMsg(res.data?.message || "KYC upload failed.");
      }
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const getCompanyTypeLabel = (type) => {
    const map = {
      proprietorship: "Sole Proprietorship",
      partnership: "Partnership Firm",
      pvt_ltd: "Private Limited Company",
      llp: "Limited Liability Partnership (LLP)",
      other: "Other Entity",
    };
    return map[type] || type || "Not Provided";
  };

  const renderKycBadge = () => {
    if (!profile) return null;
    const status = profile.kyc_status || "pending";
    const map = {
      approved: [C.green, "✓ KYC Approved"],
      under_review: [C.gold, "⏳ KYC Under Review"],
      rejected: [C.red, `❌ KYC Rejected: ${profile.rejection_reason || "Check requirements"}`],
      pending: [C.textLight, "⚠️ KYC Pending Uploads"],
    };
    const [color, label] = map[status] || [C.textLight, "Unknown"];
    return <span style={S.tag(color)}>{label}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
        <span style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.teal}`,
          animation: "spin 0.8s linear infinite",
          display: "inline-block"
        }} />
        <div style={{ fontSize: "14px", color: C.textMid, fontWeight: 600 }}>Loading profile...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const detailsSections = [
    {
      title: "Personal Information",
      items: [
        ["Full Legal Name", `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Not Provided"],
        ["Registered Mobile", profile?.mobile || "Not Provided"],
        ["Email Address", profile?.email || "Not Provided"],
        ["HQ City / Region", profile?.business_location || "Not Provided"]
      ]
    },
    {
      title: "Business Details",
      items: [
        ["Registered Shop Name", profile?.company_name || "Not Provided"],
        ["GSTIN Registry", profile?.gst_number || "Not Provided"],
        ["Organization Entity", getCompanyTypeLabel(profile?.company_type)],
        ["Shop/Office Address", profile?.current_address || "Not Provided"]
      ]
    },
    {
      title: "Settlement Bank Account",
      items: [
        ["Recipient Bank Name", profile?.bank_name || "Not Provided"],
        ["Account Number", profile?.account_number ? `XXXXXX${profile.account_number.slice(-4)}` : "Not Provided"],
        ["RTGS / IFSC Code", profile?.ifsc_code || "Not Provided"],
        ["Beneficiary Name", profile?.account_holder_name || "Not Provided"]
      ]
    }
  ];

  const docsMeta = {
    aadhaar: { title: "Aadhaar Card", hasNumber: true, desc: "Front & Back (PDF/Image)", numberLabel: "Aadhaar Card Number (12 digits)", key: "aadhar" },
    pan: { title: "PAN Card", hasNumber: true, desc: "PDF or Image", numberLabel: "PAN Card Number (10 alphanumeric)", key: "pan" },
    gst_cert: { title: "GST Certificate", hasNumber: false, desc: "Optional. PDF or Image", key: "gst_cert" },
    cancelled_cheque: { title: "Cancelled Cheque", hasNumber: false, desc: "Image of cheque leaf", key: "cancelled_cheque" },
  };

  return (
    <div>
      {/* Visual top card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navyMid}, ${C.navy})`,
        borderRadius: "20px",
        padding: "30px 20px",
        textAlign: "center",
        color: "#fff",
        marginBottom: "24px"
      }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          fontSize: "24px",
          fontWeight: 900,
          color: "#fff",
          boxShadow: `0 8px 24px rgba(0,180,216,0.3)`
        }}>
          {profile?.first_name?.charAt(0) || "P"}{profile?.last_name?.charAt(0) || ""}
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800 }}>{profile?.first_name} {profile?.last_name}</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
          Partner ID: {profile?.Partner_code || "N/A"} · {profile?.business_location || "Mumbai"} Hub
        </div>
        <div style={{ marginTop: "12px" }}>
          {renderKycBadge()}
        </div>
      </div>

      {/* Info grids */}
      {detailsSections.map(sec => (
        <div key={sec.title} style={{ ...S.card, marginBottom: "16px" }}>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: 800, 
            color: C.text, 
            marginBottom: "12px", 
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: "10px"
          }}>{sec.title}</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sec.items.map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>{lbl}</span>
                <span style={{ fontSize: "13px", color: C.text, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* KYC Documents & Upload Section */}
      <div style={{ ...S.card, marginBottom: "24px" }}>
        <div style={{ 
          fontSize: "14px", 
          fontWeight: 800, 
          color: C.text, 
          marginBottom: "16px", 
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: "10px"
        }}>
          Verification Documents (KYC)
        </div>

        {errorMsg && (
          <div style={{
            background: `${C.red}15`, border: `1px solid ${C.red}40`,
            borderRadius: "10px", padding: "10px 14px",
            fontSize: "13px", color: C.red,
            marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Icons.x size={14} /> {errorMsg}
          </div>
        )}

        {uploadSuccess && (
          <div style={{
            background: `${C.green}15`, border: `1px solid ${C.green}40`,
            borderRadius: "10px", padding: "10px 14px",
            fontSize: "13px", color: C.green,
            marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <Icons.check size={14} /> {uploadSuccess}
          </div>
        )}

        <form onSubmit={handleKycSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {Object.entries(docsMeta).map(([key, meta]) => {
              const existingDoc = profile?.kyc_documents?.find(d => d.doc_type === key);
              const wantToUpload = !existingDoc || reupload[key];

              if (!wantToUpload) {
                return (
                  <div key={key} style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: C.bgSecondary,
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                        {meta.title}
                      </div>
                      {existingDoc.doc_number && (
                        <div style={{ fontSize: "11px", color: C.textMid, marginTop: "2px" }}>
                          Number: <span style={{ fontWeight: 700 }}>{existingDoc.doc_number}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                        <span style={{ 
                          fontSize: "11px", 
                          color: existingDoc.verified ? C.green : C.gold, 
                          fontWeight: 700, 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px" 
                        }}>
                          {existingDoc.verified ? <Icons.check size={12} /> : <Icons.clock size={12} />}
                          {existingDoc.verified ? "Verified" : "Under Review"}
                        </span>
                        ·
                        <a 
                          href={existingDoc.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ fontSize: "11px", color: C.teal, fontWeight: 700, textDecoration: "none" }}
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReupload(prev => ({ ...prev, [key]: true }))}
                      style={{
                        ...S.btn("outline"),
                        padding: "6px 14px",
                        fontSize: "12px"
                      }}
                    >
                      Update / Re-upload
                    </button>
                  </div>
                );
              }

              // Upload Mode
              const fileSelected = files[key];
              const inputId = `kyc-input-${key}`;

              return (
                <div key={key} style={{
                  border: `1.5px dashed ${C.border}`,
                  borderRadius: "12px",
                  padding: "18px 20px",
                  background: C.bgSecondary,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{meta.title}</div>
                      <div style={{ fontSize: "11px", color: C.textLight, marginTop: "2px" }}>{meta.desc} · Max 5MB</div>
                    </div>
                    {existingDoc && (
                      <button
                        type="button"
                        onClick={() => setReupload(prev => ({ ...prev, [key]: false }))}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.textLight,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Keep Existing
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: meta.hasNumber ? "1fr 1fr" : "1fr", gap: "12px" }}>
                    {meta.hasNumber && (
                      <div>
                        <label style={S.label}>{meta.numberLabel}</label>
                        <input
                          type="text"
                          value={kycForm[`${key}_number`]}
                          onChange={handleTextChange(`${key}_number`)}
                          style={S.input}
                          maxLength={key === "aadhaar" ? 12 : 10}
                          placeholder={key === "aadhaar" ? "e.g. 123456789012" : "e.g. ABCDE1234F"}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <input
                        id={inputId}
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange(key)}
                      />
                      {fileSelected ? (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          border: `1.5px solid ${C.teal}`,
                          background: `${C.teal}08`,
                          borderRadius: "10px",
                          height: "44px",
                          boxSizing: "border-box"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                            <span style={{ color: C.green }}><Icons.check size={14} /></span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {fileSelected.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, [key]: null }))}
                            style={{
                              background: "none",
                              border: "none",
                              color: C.red,
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById(inputId).click()}
                          style={{
                            ...S.btn("outline"),
                            height: "44px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            fontSize: "13px"
                          }}
                        >
                          <Icons.upload size={16} /> Choose Document File
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Submit Button */}
            {(files.aadhaar || files.pan || files.gst_cert || files.cancelled_cheque) && (
              <button
                type="submit"
                disabled={uploadLoading}
                style={{
                  ...S.btn("primary"),
                  padding: "14px 0",
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "8px"
                }}
              >
                {uploadLoading ? (
                  <>
                    <span style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid #fff",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block"
                    }} />
                    Uploading Documents…
                  </>
                ) : (
                  <>
                    <Icons.upload size={18} /> Upload Staged Documents
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Log out */}
      <button 
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: "12px",
          border: `1.5px solid ${C.red}`,
          color: C.red,
          fontWeight: 700,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "14px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.red + "10"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <Icons.logout size={16} /> Sign Out of Terminal
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
