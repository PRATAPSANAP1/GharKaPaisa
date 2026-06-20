import React, { useEffect } from 'react';
import { usePartnerStore } from '../../store/partnerStore';

const PartnerProfile = () => {
  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const isLoading = usePartnerStore((state) => state.isLoading);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>

      {isLoading ? (
        <p className="text-gray-500">Loading profile...</p>
      ) : profile ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h3>
              <p className="text-gray-500 text-sm mt-1">Partner Code: <span className="font-mono text-blue-600">{profile.Partner_code}</span></p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
                profile.kyc_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                KYC: {profile.kyc_status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal Details</h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500 block text-xs">Email</span><span className="font-medium text-gray-800">{profile.email || 'N/A'}</span></li>
                <li><span className="text-gray-500 block text-xs">Mobile</span><span className="font-medium text-gray-800">{profile.mobile}</span></li>
                <li><span className="text-gray-500 block text-xs">Address</span><span className="font-medium text-gray-800">{profile.current_address || 'N/A'}</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Details</h4>
              <ul className="space-y-3">
                <li><span className="text-gray-500 block text-xs">Company Name</span><span className="font-medium text-gray-800">{profile.company_name || 'N/A'}</span></li>
                <li><span className="text-gray-500 block text-xs">Business Type</span><span className="font-medium text-gray-800">{profile.company_type || 'N/A'}</span></li>
                <li><span className="text-gray-500 block text-xs">GST Number</span><span className="font-medium text-gray-800">{profile.gst_number || 'N/A'}</span></li>
                <li><span className="text-gray-500 block text-xs">Pincode</span><span className="font-medium text-gray-800">{profile.pincode || 'N/A'}</span></li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">Failed to load profile.</p>
      )}
    </div>
  );
};

export default PartnerProfile;
