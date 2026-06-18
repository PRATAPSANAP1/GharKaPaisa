import React, { useState, useEffect } from 'react';
import api from '../../api/api';

const PartnerProducts = () => {
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState("products"); // "products" | "leads"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lead modal/form state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { is_active: 'true', limit: 100 } });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load available products.");
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.data?.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchLeads()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = (product) => {
    setSelectedProduct(product);
    setCustomerName("");
    setMobile("");
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !mobile.trim()) {
      return alert("Customer Name and Mobile number are required.");
    }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return alert("Please enter a valid 10-digit mobile number.");
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leads', {
        productId: selectedProduct.id,
        customerName: customerName.trim(),
        mobile: mobile.trim()
      });

      if (res.data?.success) {
        alert("Lead submitted successfully! Status: Pending.");
        setSelectedProduct(null);
        await fetchLeads();
        setActiveTab("leads");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Marketplace & Leads</h2>
        
        {/* Tab Controls */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg border">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
              activeTab === "products" 
                ? "bg-white text-gray-800 shadow-sm" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
              activeTab === "leads" 
                ? "bg-white text-gray-800 shadow-sm" 
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Submitted Leads
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading data...</div>
      ) : activeTab === "products" ? (
        /* Products Grid */
        products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border rounded-lg bg-white">
            No products available in the marketplace currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-150 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-full uppercase">
                      {product.category?.replace(/_/g, ' ') || 'Product'}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">
                      {product.bank_code || 'Partner Bank'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">{product.description || 'No description available.'}</p>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-4">
                  <div>
                    <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Payout</span>
                    <span className="text-xl font-extrabold text-green-600">₹{parseFloat(product.commission_value).toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => handleApply(product)}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-sm shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Leads Track List */
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              You haven't submitted any leads yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Mobile</th>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold">Payout</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{lead.customer_name}</td>
                      <td className="px-6 py-4 text-gray-500">{lead.mobile}</td>
                      <td className="px-6 py-4">{lead.product_name}</td>
                      <td className="px-6 py-4 font-bold text-green-600">₹{parseFloat(lead.product_commission).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                          lead.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          lead.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Apply Lead Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Submit Product Lead</h3>
            <p className="text-sm text-gray-500 mb-6">
              You are applying for <strong className="text-gray-700">{selectedProduct.name}</strong>. Entering lead details will create a new tracking record.
            </p>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter customer's complete name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerProducts;
