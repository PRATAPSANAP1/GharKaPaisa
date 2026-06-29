import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/api';
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
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/kyc/me');
        const docs = response.data?.data?.documents || [];
        setDocuments(docs.map((doc) => ({
          id: doc.id,
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
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0D5CAB]/10 text-[#0D5CAB] rounded-full flex items-center justify-center">
              <MdFolderSpecial size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Document Vault</h2>
              <p className="text-[#64748B] font-medium mt-1">Your uploaded KYC documents from the verification center.</p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  filter === cat ? 'bg-[#0D5CAB] text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-[#0D5CAB] border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium">{error}</div>
      )}

      {!loading && !error && filteredDocs.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-slate-600 font-medium mb-4">No documents uploaded yet.</p>
          <Link to="/partner/kyc" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D5CAB] text-white rounded-xl text-sm font-bold">
            Upload KYC Documents
          </Link>
        </div>
      )}

      {!loading && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-[#0D5CAB]/30 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  {doc.type === 'PDF' ? <MdPictureAsPdf size={24} /> : <MdOutlineInsertDriveFile size={24} className="text-blue-500" />}
                </div>
                {doc.verified && (
                  <span className="text-[#25D366]" title="Verified Document">
                    <MdVerifiedUser size={20} />
                  </span>
                )}
              </div>

              <h3 className="font-bold text-[#0F172A] mb-1 group-hover:text-[#0D5CAB] transition-colors line-clamp-2">
                {doc.title}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {doc.type} • {doc.date}
              </p>
              {doc.docNumber && (
                <p className="text-xs text-slate-500 font-mono mb-4">{doc.docNumber}</p>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-slate-50 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
                >
                  <MdVisibility size={18} /> View
                </a>
                <a
                  href={doc.fileUrl}
                  download
                  className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-[#0D5CAB] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#083E7A] transition-colors"
                >
                  <MdDownload size={18} /> Download
                </a>
              </div>
            </div>
          ))}

          <Link
            to="/partner/kyc"
            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-slate-100 hover:border-[#0D5CAB]/50 transition-all min-h-[200px]"
          >
            <div className="w-12 h-12 bg-white shadow-sm text-slate-400 rounded-full flex items-center justify-center mb-3">
              <MdAdd size={24} />
            </div>
            <h3 className="font-bold text-[#0F172A] mb-1">Upload Document</h3>
            <p className="text-xs text-slate-500 max-w-[200px]">Manage KYC uploads from the KYC center.</p>
          </Link>
        </div>
      )}
    </div>
  );
}
