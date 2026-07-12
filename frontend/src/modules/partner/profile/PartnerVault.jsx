import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import {
  MdFolderSpecial, MdPictureAsPdf, MdDownload,
  MdVisibility, MdVerifiedUser, MdOutlineInsertDriveFile, MdAdd
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
    console.log('[Vault] handleViewOrDownload called with docId:', docId);
    console.log('[Vault] current documents state:', documents);
    if (!docId || docId === 'undefined') {
      alert('Secure document ID is missing. Please refresh the page or try re-logging.');
      return;
    }
    try {
      const res = await api.get(`/partner/kyc/documents/${docId}/view`);
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

      {/* Header card */}
      <div style={{ ...S.card, padding: '24px 28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${C.primary}15`, color: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MdFolderSpecial size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Document Vault")}</h2>
              <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0', fontWeight: 500 }}>
                Your uploaded KYC documents from the verification center.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'nowrap' }}>
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
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            Upload KYC Documents
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
                  background: doc.type === 'PDF' ? `${C.red}12` : `${C.primary}12`,
                  color: doc.type === 'PDF' ? C.red : C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {doc.type === 'PDF' ? <MdPictureAsPdf size={22} /> : <MdOutlineInsertDriveFile size={22} />}
                </div>
                {doc.verified && (
                  <span style={{ color: C.green }} title={t("Verified Document")}>
                    <MdVerifiedUser size={18} />
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{doc.title}</h3>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>
                {doc.type} • {doc.date}
              </p>
              {doc.docNumber && (
                <p style={{ fontSize: '12px', color: C.textMid, fontFamily: 'monospace', margin: '0 0 8px' }}>{doc.docNumber}</p>
              )}

              <div style={{
                display: 'flex', gap: '8px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, marginTop: 'auto'
              }}>
                <button
                  onClick={() => handleViewOrDownload(doc.id, false)}
                  style={{
                    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                    padding: '10px', background: C.bgSecondary, color: C.textMid,
                    borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    textDecoration: 'none', transition: 'all 0.15s ease', border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <MdVisibility size={16} /> View
                </button>
                <button
                  onClick={() => handleViewOrDownload(doc.id, true)}
                  style={{
                    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                    padding: '10px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                    color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    textDecoration: 'none', transition: 'all 0.15s ease', border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <MdDownload size={16} /> Download
                </button>
              </div>
            </div>
          ))}

          {/* Upload more CTA card */}
          <Link
            to="/partner/kyc"
            style={{
              border: `2px dashed ${C.border}`, borderRadius: '16px',
              padding: '20px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              textDecoration: 'none', minHeight: '200px',
              transition: 'all 0.15s ease', background: 'transparent'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: C.card,
              boxShadow: `0 2px 8px rgba(0,0,0,0.06)`, color: C.textLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
            }}>
              <MdAdd size={22} />
            </div>
            <h3 style={{ fontWeight: 700, color: C.text, fontSize: '14px', margin: '0 0 4px' }}>{t("Upload Document")}</h3>
            <p style={{ fontSize: '12px', color: C.textLight, maxWidth: '200px', margin: 0 }}>
              Manage KYC uploads from the KYC center.
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
