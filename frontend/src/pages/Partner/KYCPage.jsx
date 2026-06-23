import React, { useState, useEffect, useRef } from 'react';
import { MdCloudUpload, MdCheckCircle, MdError, MdCameraAlt, MdCached, MdFolderOpen } from 'react-icons/md';
import { partnerService } from '../../api/partner.api';
import { useAuthStore } from '../../store/authStore';

export default function KYCPage() {
  const user = useAuthStore((state) => state.user);
  const [kycStatus, setKycStatus] = useState(user?.kyc_status || 'pending');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // File states
  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    pan: null,
    cancelled_cheque: null,
    gst_cert: null,
    address_proof: null,
  });

  // Previews
  const [previews, setPreviews] = useState({
    aadhaar_front: '',
    aadhaar_back: '',
    pan: '',
    cancelled_cheque: '',
    gst_cert: '',
    address_proof: '',
  });

  // Document numbers/inputs
  const [numbers, setNumbers] = useState({
    pan_number: '',
    aadhaar_number: '',
    gst_number: '',
  });

  // Selfie states
  const [selfieStream, setSelfieStream] = useState(null);
  const [selfieCapture, setSelfieCapture] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (docType) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [docType]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [docType]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field) => (e) => {
    setNumbers((prev) => ({ ...prev, [field]: e.target.value.toUpperCase() }));
  };

  // Camera Selfie Actions
  const startCamera = async () => {
    setCameraActive(true);
    setSelfieCapture('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setSelfieStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg('Failed to access camera. Please allow webcam permissions.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelfieCapture(dataUrl);
      
      // Stop webcam stream
      if (selfieStream) {
        selfieStream.getTracks().forEach((track) => track.stop());
      }
      setSelfieStream(null);
      setCameraActive(false);
    }
  };

  const cancelCamera = () => {
    if (selfieStream) {
      selfieStream.getTracks().forEach((track) => track.stop());
    }
    setSelfieStream(null);
    setCameraActive(false);
  };

  const handleUploadKyc = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Package up KYC files mapping to partner API endpoint
      const payloadFiles = {
        aadhaar: files.aadhaar_front,
        pan: files.pan,
        gst_cert: files.gst_cert,
        cancelled_cheque: files.cancelled_cheque,
      };

      const payloadFields = {
        pan_number: numbers.pan_number,
        aadhaar_number: numbers.aadhaar_number,
        gst_number: numbers.gst_number,
      };

      await partnerService.uploadKYC(user.PartnerId || user.id, payloadFiles, payloadFields);
      setSuccessMsg('KYC documents submitted successfully. Verification is pending approval.');
      setKycStatus('pending');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit KYC documents.');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    re_upload_required: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">KYC Compliance Center</h2>
          <p className="text-[#64748B] text-sm mt-1">Upload verified identity proofs to activate your payout wallet.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-bold capitalize flex items-center gap-2 ${statusColors[kycStatus] || statusColors.pending}`}>
          {kycStatus === 'approved' ? <MdCheckCircle size={18} /> : <MdError size={18} />}
          KYC Status: {kycStatus.replace('_', ' ')}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-bold animate-in fade-in duration-200">
          <MdCheckCircle size={20} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-bold animate-in fade-in duration-200">
          <MdError size={20} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleUploadKyc} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Document uploads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3">Identity & Bank Proofs</h3>

          {/* PAN Card */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#334155]">PAN Card Number *</label>
            <input 
              type="text" 
              maxLength={10} 
              required
              placeholder="ABCDE1234F"
              value={numbers.pan_number} 
              onChange={handleInputChange('pan_number')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 uppercase font-mono"
            />
            <div className="flex gap-4 items-center">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                <MdCloudUpload className="text-slate-400 mb-1" size={24} />
                <span className="text-xs text-slate-500 font-bold">Upload PAN Copy</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange('pan')} />
              </label>
              {previews.pan && (
                <div className="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                  <img src={previews.pan} alt="PAN preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Aadhaar Number */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#334155]">Aadhaar Card Number *</label>
            <input 
              type="text" 
              maxLength={12} 
              required
              placeholder="1234 5678 9012"
              value={numbers.aadhaar_number} 
              onChange={handleInputChange('aadhaar_number')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 font-mono"
            />
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <MdCloudUpload className="text-slate-400 mb-1" size={20} />
                <span className="text-[10px] text-slate-500 font-bold">Aadhaar Front</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange('aadhaar_front')} />
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <MdCloudUpload className="text-slate-400 mb-1" size={20} />
                <span className="text-[10px] text-slate-500 font-bold">Aadhaar Back</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange('aadhaar_back')} />
              </label>
            </div>
          </div>

          {/* Cancelled Cheque */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#334155]">Cancelled Cheque / Passbook Copy *</label>
            <div className="flex gap-4 items-center">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                <MdCloudUpload className="text-slate-400 mb-1" size={24} />
                <span className="text-xs text-slate-500 font-bold">Upload Cheque copy</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange('cancelled_cheque')} />
              </label>
              {previews.cancelled_cheque && (
                <div className="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                  <img src={previews.cancelled_cheque} alt="Cheque preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Selfie & Address optional verification */}
        <div className="space-y-6">
          
          {/* Selfie verification */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3">Selfie Live Photo Match</h3>
            
            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-100 relative min-h-[220px]">
              {cameraActive ? (
                <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-[#0D5CAB]">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full pointer-events-none"></div>
                </div>
              ) : selfieCapture ? (
                <div className="w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-green-500">
                  <img src={selfieCapture} alt="Capture preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                  <MdCameraAlt size={48} />
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="mt-4 flex gap-2">
                {cameraActive ? (
                  <>
                    <button type="button" onClick={capturePhoto} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">Capture Selfie</button>
                    <button type="button" onClick={cancelCamera} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-400 transition-colors">Cancel</button>
                  </>
                ) : (
                  <button type="button" onClick={startCamera} className="bg-[#0D5CAB] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#083E7A] transition-colors flex items-center gap-1.5 shadow-sm">
                    <MdCameraAlt /> {selfieCapture ? 'Recapture Selfie' : 'Start Camera'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Optional Business Document GST */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-3">GST details & Certificates (Optional)</h3>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#334155]">GSTIN Number</label>
              <input 
                type="text" 
                maxLength={15} 
                placeholder="22AAAAA1111A1Z1"
                value={numbers.gst_number} 
                onChange={handleInputChange('gst_number')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 font-mono uppercase"
              />
            </div>
            <div className="flex gap-4 items-center">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <MdFolderOpen className="text-slate-400 mb-1" size={20} />
                <span className="text-[10px] text-slate-500 font-bold">Upload GSTIN Copy</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange('gst_cert')} />
              </label>
              {previews.gst_cert && (
                <div className="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden shrink-0">
                  <img src={previews.gst_cert} alt="GST preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0D5CAB] hover:bg-[#083E7A] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-md"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                <MdCached /> Submit Documents
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}
