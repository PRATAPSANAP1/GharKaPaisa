import React, { useEffect } from 'react';
import { usePartnerStore } from '../../store/partnerStore';

const PartnerApplications = () => {
  const fetchApplications = usePartnerStore((state) => state.fetchApplications);
  const applications = usePartnerStore((state) => state.applications);
  const isLoading = usePartnerStore((state) => state.isLoading);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
        <div className="p-0">
          {isLoading ? (
            <p className="p-4 text-gray-500">Loading applications...</p>
          ) : applications?.length === 0 ? (
            <p className="p-4 text-gray-500">No applications found.</p>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">App Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((app, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{app.app_number}</td>
                    <td className="px-4 py-3">{app.customer_name}</td>
                    <td className="px-4 py-3">{app.product_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full uppercase ${
                        app.status === 'approved' || app.status === 'disbursed' ? 'bg-green-100 text-green-800' : 
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerApplications;
