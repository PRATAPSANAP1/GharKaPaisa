import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { MdFilterList, MdSearch, MdCheckCircle, MdLocalOffer, MdAccessTime, MdInfoOutline } from 'react-icons/md';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'credit_card', label: 'Credit Cards' },
  { id: 'personal_loan', label: 'Personal Loans' },
  { id: 'business_loan', label: 'Business Loans' },
  { id: 'home_loan', label: 'Home Loans' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'demat', label: 'Demat Accounts' },
];

const BANKS = ['All Banks', 'HDFC', 'SBI', 'Axis', 'ICICI', 'BOB', 'IndusInd', 'AU Small Finance', 'IDFC'];

export default function PartnerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBank, setActiveBank] = useState("All Banks");

  // Lead modal/form state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { is_active: 'true', limit: 100 } });
      if (res.data?.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setError("Failed to load available products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApply = (product) => {
    setSelectedProduct(product);
    setCustomerName("");
    setMobile("");
    setCity("");
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !mobile.trim() || !city.trim()) {
      return alert("Customer Name, Mobile number, and City are required.");
    }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return alert("Please enter a valid 10-digit mobile number.");
    }

    setSubmitting(true);
    try {
      const res = await api.post('/leads', {
        productId: selectedProduct.id,
        customerName: customerName.trim(),
        mobile: mobile.trim(),
        city: city.trim()
      });

      if (res.data?.success) {
        alert("Lead submitted successfully! Check your Lead Management timeline.");
        setSelectedProduct(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit lead. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchBank = activeBank === 'All Banks' || p.bank_code === activeBank || p.name.includes(activeBank);
    
    return matchSearch && matchCategory && matchBank;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto pb-10">
      
      {/* SIDEBAR FILTERS */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <MdFilterList /> Filter Market
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h4>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat.id 
                      ? 'bg-[#0D5CAB] text-white' 
                      : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Filter by Bank</h4>
              <div className="flex flex-col gap-1">
                {BANKS.map(bank => (
                  <label key={bank} className="flex items-center gap-3 px-2 py-1.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      activeBank === bank ? 'bg-[#0D5CAB] border-[#0D5CAB]' : 'border-slate-300 group-hover:border-[#0D5CAB]'
                    }`}>
                      {activeBank === bank && <MdCheckCircle className="text-white text-xs" />}
                    </div>
                    <span className={`text-sm font-medium ${activeBank === bank ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{bank}</span>
                    {/* Hidden actual radio input for accessibility */}
                    <input 
                      type="radio" 
                      name="bankFilter" 
                      value={bank}
                      checked={activeBank === bank}
                      onChange={(e) => setActiveBank(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Features</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">High Approval</span>
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">Lifetime Free</span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">Highest Payout</span>
              </div>
            </div>

          </div>
        </div>
      </aside>

      {/* MAIN CONTENT GRID */}
      <main className="flex-1 space-y-6">
        
        {/* Header Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products, cards, loans..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium"
            />
          </div>
          <div className="text-sm font-bold text-slate-500 shrink-0">
            Showing <span className="text-[#0F172A]">{filteredProducts.length}</span> Products
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin w-8 h-8 border-4 border-[#0D5CAB] border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
               <MdSearch size={32} />
             </div>
             <h3 className="text-lg font-bold text-[#0F172A] mb-1">No products found</h3>
             <p className="text-[#64748B]">Try adjusting your filters or search terms.</p>
             <button 
               onClick={() => { setActiveCategory('all'); setActiveBank('All Banks'); setSearch(''); }}
               className="mt-6 text-[#0D5CAB] font-bold hover:underline"
             >
               Clear all filters
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-[#0D5CAB]/30 transition-all flex flex-col justify-between group">
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-[#0D5CAB] rounded-lg uppercase tracking-wide">
                      {product.category?.replace(/_/g, ' ') || 'Finance'}
                    </span>
                    <span className="text-xs font-bold text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {product.bank_code || 'BANK'}
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* Placeholder image box */}
                    <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <MdLocalOffer className="text-slate-300 text-2xl" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] mb-1 group-hover:text-[#0D5CAB] transition-colors">{product.name}</h3>
                      <p className="text-sm text-[#64748B] line-clamp-2">{product.description || 'No specific details provided for this product.'}</p>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div className="flex items-center gap-4 mt-5 mb-5 p-3 bg-[#F8FAFC] rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MdCheckCircle /> Approval</span>
                       <span className="text-sm font-extrabold text-[#0F172A]">82%</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MdAccessTime /> Time</span>
                       <span className="text-sm font-extrabold text-[#0F172A]">2 Days</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MdInfoOutline /> CIBIL</span>
                       <span className="text-sm font-extrabold text-[#0F172A]">750+</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Your Payout</span>
                    <span className="text-xl font-extrabold text-[#22C55E]">₹{parseFloat(product.commission_value).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white text-[#0D5CAB] border border-[#0D5CAB]/30 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-sm hidden sm:block">
                      Details
                    </button>
                    <button
                      onClick={() => handleApply(product)}
                      className="px-6 py-2 bg-[#0D5CAB] text-white font-bold rounded-xl hover:bg-[#083E7A] transition-colors text-sm shadow-md"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Apply Lead Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#0F172A] transition bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">Add Customer Lead</h3>
              <p className="text-sm text-[#64748B]">
                Applying for <strong className="text-[#0D5CAB]">{selectedProduct.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmitLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#334155] mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5CAB]/20 focus:border-[#0D5CAB] font-medium transition-all"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#64748B] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 bg-[#0D5CAB] text-white text-sm font-bold rounded-xl hover:bg-[#083E7A] shadow-md transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
