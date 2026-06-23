import React, { useState, useEffect } from 'react';
import { 
  MdFolder, MdInsertDriveFile, MdRemoveRedEye, MdFileDownload, 
  MdDelete, MdRefresh, MdArrowBack, MdCloudUpload 
} from 'react-icons/md';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';

export default function DocumentVaultPage() {
  const user = useAuthStore((state) => state.user);
  const [activeFolder, setActiveFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchKycDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kyc/me');
      if (res.data?.success) {
        setDocuments(res.data.data.documents || []);
      }
    } catch (err) {
      console.error("Vault fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycDocs();
  }, []);

  const folders = [
    { id: 'kyc', name: 'KYC Documents', count: documents.length || 2, desc: 'Aadhaar, PAN, Selfie photos' },
    { id: 'bank', name: 'Bank Documents', count: 1, desc: 'Cancelled cheques, mandate forms' },
    { id: 'agreements', name: 'Agreements', count: 1, desc: 'Partner NDA, code of conduct' },
    { id: 'gst', name: 'GST Documents', count: 0, desc: 'GSTIN certificates' },
    { id: 'certificates', name: 'Certificates', count: 1, desc: 'Training Academy achievements' }
  ];

  // Resolve dummy items for folders if not populated from DB
  const getFolderItems = (folderId) => {
    if (folderId === 'kyc') {
      const dbItems = documents.map(d => ({
        id: d.id,
        name: `${d.doc_type.replace('_', ' ').toUpperCase()} Document`,
        type: 'Image/PDF',
        url: d.file_url,
        date: d.uploaded_at
      }));

      // Fallbacks if empty
      if (dbItems.length === 0) {
        return [
          { id: 1, name: 'PAN Card Copy.jpg', type: 'JPG Image', url: '#', date: new Date().toISOString() },
          { id: 2, name: 'Aadhaar Front Copy.jpg', type: 'JPG Image', url: '#', date: new Date().toISOString() }
        ];
      }
      return dbItems;
    }

    if (folderId === 'bank') {
      return [{ id: 101, name: 'Cancelled Cheque copy.pdf', type: 'PDF Document', url: '#', date: new Date().toISOString() }];
    }

    if (folderId === 'agreements') {
      return [{ id: 201, name: 'GKP Partner Agreement Signed.pdf', type: 'PDF Document', url: '#', date: new Date().toISOString() }];
    }

    if (folderId === 'certificates') {
      return [{ id: 301, name: 'Bronze Sales Certification.pdf', type: 'PDF Document', url: '#', date: new Date().toISOString() }];
    }

    return [];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Document Vault</h2>
          <p className="text-[#64748B] text-sm mt-1">Access, download, and update all secure documentation files stored in S3.</p>
        </div>
        <button 
          onClick={fetchKycDocs}
          className="p-2.5 text-slate-500 hover:text-[#0D5CAB] hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
        >
          <MdRefresh size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {activeFolder ? (
        // Inside Folder View
        <div className="space-y-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setActiveFolder(null)}
            className="flex items-center gap-1.5 text-sm font-bold text-[#0D5CAB] hover:underline"
          >
            <MdArrowBack /> Back to Folders
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <MdFolder className="text-[#0D5CAB]" /> {folders.find(f => f.id === activeFolder)?.name}
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {getFolderItems(activeFolder).length} files
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {getFolderItems(activeFolder).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  This folder is empty. Upload documents inside KYC to add items.
                </div>
              ) : (
                getFolderItems(activeFolder).map(item => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0D5CAB] flex items-center justify-center shrink-0">
                        <MdInsertDriveFile size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm sm:text-md truncate max-w-xs sm:max-w-md">{item.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {item.type} • Uploaded on {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setPreviewDoc(item)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-slate-200 text-xs font-bold text-[#0F172A] rounded-lg hover:bg-slate-100"
                      >
                        <MdRemoveRedEye /> Preview
                      </button>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0D5CAB] text-xs font-bold text-white rounded-lg hover:bg-[#083E7A]"
                      >
                        <MdFileDownload /> Download
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Folder Listing View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#0D5CAB]/30 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-blue-50 text-[#0D5CAB] rounded-xl flex items-center justify-center shrink-0">
                <MdFolder size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#0F172A] text-lg">{folder.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{folder.count} files</p>
                <p className="text-xs text-[#64748B] leading-relaxed pt-1">{folder.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden relative flex flex-col h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-[#0F172A] truncate">{previewDoc.name}</h4>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-[#0F172A] bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-slate-100 overflow-y-auto flex items-center justify-center p-4">
              {previewDoc.url !== '#' ? (
                previewDoc.url.endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} title="Document PDF Preview" className="w-full h-full border-none rounded-xl" />
                ) : (
                  <img src={previewDoc.url} alt="Document preview" className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
                )
              ) : (
                <div className="text-center p-8 text-slate-400 bg-white border border-slate-200 rounded-2xl max-w-sm">
                  <MdCloudUpload size={40} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-[#0F172A]">Mock Document Preview</p>
                  <p className="text-xs text-slate-400 mt-1">This is a system mock file. S3 integration serves verified uploads in production.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
