import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePartnerStore } from '../../store/partnerStore';
import api from '../../api/api';
import { MdUploadFile, MdCheckCircle, MdPendingActions, MdError } from 'react-icons/md';

export default function PartnerKyc() {
  const user = useAuthStore((state) => state.user);
  const profile = usePartnerStore((state) => state.profile);
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [files, setFiles] = useState({
    pan: null,
    cancelled_cheque: null
  });

  const [documentNumbers, setDocumentNumbers] = useState({
    pan_number: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be less than 5MB');
        return;
      }
      setFiles(prev => ({ ...prev, [type]: file }));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.pan || !files.cancelled_cheque) {
      setErrorMsg('Please upload both PAN Card and Cancelled Cheque.');
      return;
    }
    if (!documentNumbers.pan_number.trim()) {
      setErrorMsg('Please enter your PAN Card number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('pan', files.pan);
    formData.append('cancelled_cheque', files.cancelled_cheque);
    formData.append('pan_number', documentNumbers.pan_number);

    try {
      await api.post('/partner/upload-docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Documents uploaded successfully! Your KYC is now under review.');
      setFiles({ pan: null, cancelled_cheque: null });
      fetchProfile(); // Refresh profile to update KYC status
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload documents. Ensure your AWS S3 config is correct.');
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = profile?.kyc_status || user?.kyc_status || 'pending';
  const isApproved = kycStatus === 'approved';
  const isUnderReview = kycStatus === 'under_review';
  const isRejected = kycStatus === 'rejected';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">KYC Center</h2>
        <p className="text-[#64748B] mt-1">Complete your identity verification to unlock full partner features.</p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl flex items-center gap-3 border ${
        isApproved ? 'bg-green-50 border-green-200 text-green-700' :
        isUnderReview ? 'bg-amber-50 border-amber-200 text-amber-700' :
        isRejected ? 'bg-red-50 border-red-200 text-red-700' :
        'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        {isApproved ? <MdCheckCircle size={24} /> : 
         isRejected ? <MdError size={24} /> : 
         <MdPendingActions size={24} />}
        
        <div>
          <h3 className="font-bold">
            Current Status: <span className="uppercase">{kycStatus}</span>
          </h3>
          <p className="text-sm mt-0.5 opacity-90">
            {isApproved ? 'Your KYC is verified. You have full access to the platform.' :
             isUnderReview ? 'Your documents are currently being reviewed by our team.' :
             isRejected ? `Your KYC was rejected. Reason: ${profile?.rejection_reason || 'Invalid documents'}. Please re-submit.` :
             'Please upload your required documents below to begin verification.'}
          </p>
        </div>
      </div>

      {/* Upload Form */}
      {(!isApproved && !isUnderReview) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#334155] mb-1">PAN Card Number *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20"
                placeholder="ABCDE1234F"
                value={documentNumbers.pan_number}
                onChange={(e) => setDocumentNumbers({...documentNumbers, pan_number: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#334155] mb-1">Upload PAN Card (Image/PDF) *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={(e) => handleFileChange(e, 'pan')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <MdUploadFile size={32} className="text-[#94A3B8] mb-2" />
                <span className="text-sm font-medium text-[#334155]">
                  {files.pan ? files.pan.name : 'Click or drag file to upload'}
                </span>
                <span className="text-xs text-[#64748B] mt-1">Max 5MB</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#334155] mb-1">Upload Cancelled Cheque (Image/PDF) *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={(e) => handleFileChange(e, 'cancelled_cheque')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <MdUploadFile size={32} className="text-[#94A3B8] mb-2" />
                <span className="text-sm font-medium text-[#334155]">
                  {files.cancelled_cheque ? files.cancelled_cheque.name : 'Click or drag file to upload'}
                </span>
                <span className="text-xs text-[#64748B] mt-1">Max 5MB</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#0D5CAB] text-white rounded-xl font-bold shadow-md hover:bg-[#083E7A] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {loading ? 'Uploading Documents...' : 'Submit KYC Documents'}
          </button>
        </form>
      )}
    </div>
  );
}
