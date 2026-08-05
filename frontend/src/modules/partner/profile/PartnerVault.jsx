import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import {
  MdFolderSpecial, MdPictureAsPdf, MdDownload,
  MdVisibility, MdVerifiedUser, MdOutlineInsertDriveFile
} from 'react-icons/md';

const DOC_LABELS = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  gst_cert: 'GST Certificate',
  cancelled_cheque: 'Cancelled Cheque',
};

const DOC_CATEGORIES = {
  aadhaar: 'KYC',
  pan: 'KYC',
  gst_cert: 'KYC',
  cancelled_cheque: 'KYC',
};

export default function PartnerVault() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleViewOrDownload = async (docId, shouldDownload = false) => {
    if (!docId || docId === 'undefined') {
      alert('Secure document ID is missing. Please refresh the page or try re-logging.');
      return;
    }
    try {
      const res = await api.get(`/kyc/documents/${docId}/view`);
      if (res.data?.success && res.data?.data?.url) {
        if (shouldDownload) {
          const link = document.createElement('a');
          link.href = res.data.data.url;
          link.setAttribute('download', '');
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.open(res.data.data.url, '_blank');
        }
      } else {
        alert('Failed to get secure link');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error generating secure link');
    }
  };

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/kyc/me');
        const docs = response.data?.data?.documents || [];
        setDocuments(docs.map((doc) => ({
          id: doc.id || doc.doc_type,
          title: DOC_LABELS[doc.doc_type] || doc.doc_type,
          type: (doc.file_url || '').toLowerCase().includes('.pdf') ? 'PDF' : 'Image',
          date: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—',
          category: DOC_CATEGORIES[doc.doc_type] || 'KYC',
          verified: doc.verified,
          fileUrl: doc.file_url,
          docNumber: doc.doc_number,
        })));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const categories = ['All', ...new Set(documents.map((d) => d.category))];
  const filteredDocs = filter === 'All' ? documents : documents.filter((d) => d.category === filter);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Filter Category Bar */}
      {categories.length > 1 && (
        <div style={{ ...S.card, padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  background: filter === cat ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.bgSecondary,
                  color: filter === cat ? '#fff' : C.textMid,
                  boxShadow: filter === cat ? `0 4px 14px ${C.primary}30` : 'none'
                }}
              >
                {cat === 'All' ? t('All') : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <span style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `3px solid ${C.border}`, borderTopColor: C.primary,
            animation: 'spin .8s linear infinite', display: 'inline-block'
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: `${C.red}12`, border: `1px solid ${C.red}25`,
          color: C.red, borderRadius: '12px', padding: '14px 18px',
          fontSize: '13px', fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredDocs.length === 0 && (
        <div style={{
          background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px',
          padding: '48px 24px', textAlign: 'center'
        }}>
          <p style={{ color: C.textMid, fontWeight: 600, marginBottom: '16px' }}>{t("No documents uploaded yet.")}</p>
          <Link to="/partner/kyc" style={{
            ...S.btn('primary'), textDecoration: 'none',
            padding: '10px 22px', fontSize: '13px', borderRadius: '10px'
          }}>
            {t("Upload KYC Documents")}
          </Link>
        </div>
      )}

      {/* Document grid */}
      {!loading && filteredDocs.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocs.map((doc) => (
            <div key={doc.id} style={{
              ...S.card, padding: '20px', borderRadius: '16px',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: doc.type === 'PDF' ? `${C.red}15` : `${C.blue}15`,
                  color: doc.type === 'PDF' ? C.red : C.blue,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {doc.type === 'PDF' ? <MdPictureAsPdf size={24} /> : <MdOutlineInsertDriveFile size={24} />}
                </div>
                {doc.verified && (
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: C.green,
                    background: `${C.green}15`, padding: '4px 10px', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <MdVerifiedUser size={14} /> {t("Verified")}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.title}
              </h3>
              <p style={{ fontSize: '12px', color: C.textLight, margin: '0 0 16px' }}>
                {t("Uploaded")}: {doc.date}
              </p>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleViewOrDownload(doc.id, false)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px',
                    border: `1px solid ${C.border}`, background: 'transparent',
                    color: C.text, fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '4px'
                  }}
                >
                  <MdVisibility size={16} /> {t("View")}
                </button>
                <button
                  onClick={() => handleViewOrDownload(doc.id, true)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px',
                    border: 'none', background: C.primary,
                    color: '#fff', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '4px'
                  }}
                >
                  <MdDownload size={16} /> {t("Download")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
