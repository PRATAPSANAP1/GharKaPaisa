import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdClose, MdSearch, MdCheckCircle, MdSelectAll, 
  MdDeselect, MdAccountBalance, MdPerson, MdCreditCard, MdLink 
} from 'react-icons/md';

export default function AssignEmployeeLinksModal({ isOpen, onClose, onSuccess, banks = [], products = [] }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [empSearch, setEmpSearch] = useState('');

  // Form State
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [selectAllEmps, setSelectAllEmps] = useState(false);

  const [selectedBankId, setSelectedBankId] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProdIds, setSelectedProdIds] = useState([]);
  const [selectAllProds, setSelectAllProds] = useState(false);

  const [customUrl, setCustomUrl] = useState('');
  const [incentiveAmount, setIncentiveAmount] = useState('500');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all active employees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await api.get('/employees?limit=500');
      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load employees for assignment:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // When Bank selection changes, update available products
  useEffect(() => {
    if (selectedBankId) {
      const filtered = products.filter(p => p.bank_id === selectedBankId);
      setAvailableProducts(filtered);
      setSelectedProdIds([]);
      setSelectAllProds(false);
    } else {
      setAvailableProducts(products);
      setSelectedProdIds([]);
      setSelectAllProds(false);
    }
  }, [selectedBankId, products]);

  // Handle Employee Select All
  const handleToggleSelectAllEmps = () => {
    if (selectAllEmps) {
      setSelectedEmpIds([]);
      setSelectAllEmps(false);
    } else {
      const filteredEmps = filteredEmployeesList.map(e => e.id);
      setSelectedEmpIds(filteredEmps);
      setSelectAllEmps(true);
    }
  };

  // Handle Product Select All
  const handleToggleSelectAllProds = () => {
    if (selectAllProds) {
      setSelectedProdIds([]);
      setSelectAllProds(false);
    } else {
      const allPIds = availableProducts.map(p => p.id);
      setSelectedProdIds(allPIds);
      setSelectAllProds(true);
    }
  };

  const handleEmpCheckboxChange = (empId) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter(id => id !== empId));
      setSelectAllEmps(false);
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  const handleProdCheckboxChange = (prodId) => {
    if (selectedProdIds.includes(prodId)) {
      setSelectedProdIds(selectedProdIds.filter(id => id !== prodId));
      setSelectAllProds(false);
    } else {
      setSelectedProdIds([...selectedProdIds, prodId]);
    }
  };

  const filteredEmployeesList = employees.filter(e => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase().trim();
    return (
      e.full_name?.toLowerCase().includes(q) ||
      e.employee_id?.toLowerCase().includes(q) ||
      e.mobile_number?.includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedEmpIds.length === 0) {
      setErrorMsg('Please select at least one employee');
      return;
    }
    if (selectedProdIds.length === 0) {
      setErrorMsg('Please select at least one product');
      return;
    }
    if (!customUrl.trim()) {
      setErrorMsg('Please enter the custom bank referral link URL');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_ids: selectAllEmps && selectedEmpIds.length === employees.length ? 'ALL' : selectedEmpIds,
        bank_id: selectedBankId || undefined,
        product_ids: selectedProdIds,
        custom_bank_url: customUrl.trim(),
        incentive_amount: parseFloat(incentiveAmount) || 0,
        status: 'ACTIVE'
      };

      const res = await api.post('/employees/assign-custom-product-links', payload);
      if (res.data?.success) {
        onSuccess(res.data.message || 'Custom bank links assigned successfully!');
        onClose();
      } else {
        setErrorMsg(res.data?.message || 'Failed to assign custom product links.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to assign product links.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        ...S.card,
        width: '100%', maxWidth: '820px', maxHeight: '90vh',
        overflowY: 'auto', padding: '28px', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', borderRadius: '20px'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: C.bgSecondary, border: 'none', cursor: 'pointer',
            width: '34px', height: '34px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight
          }}
        >
          <MdClose size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ padding: '6px', background: `${C.primary}15`, color: C.primary, borderRadius: '8px', display: 'flex' }}>
              <MdLink size={20} />
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>
              Assign Custom Bank Link to Employee(s)
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
            Select employees, bank partner, products, and specify custom referral link for each employee product card.
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: `${C.red}15`, color: C.red, borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STEP 1: EMPLOYEE SELECTION */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', background: C.bgSecondary }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MdPerson style={{ color: C.primary }} /> 1. Select Employee(s) *
                <span style={{ fontSize: '11px', fontWeight: 600, color: C.textLight, background: C.card, padding: '2px 8px', borderRadius: '12px', marginLeft: '6px' }}>
                  {selectedEmpIds.length} Selected
                </span>
              </label>
              <button 
                type="button" 
                onClick={handleToggleSelectAllEmps}
                style={{ fontSize: '12px', fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {selectAllEmps ? <><MdDeselect /> Deselect All</> : <><MdSelectAll /> Select All Employees</>}
              </button>
            </div>

            {/* Employee Search */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Search employee name or code (e.g. EMP10001)..." 
                style={{ ...S.input, paddingLeft: '32px', fontSize: '12.5px' }}
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
              />
              <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            </div>

            {/* Employee List Grid */}
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: '10px', background: C.card, padding: '8px' }}>
              {loadingEmployees ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: C.textLight }}>Loading active employees...</div>
              ) : filteredEmployeesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: C.textLight }}>No matching employees found</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                  {filteredEmployeesList.map(emp => {
                    const isChecked = selectedEmpIds.includes(emp.id);
                    return (
                      <label key={emp.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px',
                        cursor: 'pointer', background: isChecked ? `${C.primary}10` : C.bgSecondary,
                        border: `1px solid ${isChecked ? C.primary : C.border}`, transition: 'all 0.15s'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleEmpCheckboxChange(emp.id)}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {emp.full_name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: C.textLight }}>
                            {emp.employee_id || 'YOH-SE'} • {emp.designation || 'Staff'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 & 3: BANK & PRODUCT SELECTION */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', background: C.bgSecondary }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MdAccountBalance style={{ color: C.primary }} /> 2. Select Bank Partner *
                </label>
                <select 
                  style={{ ...S.input, fontWeight: 700 }}
                  value={selectedBankId}
                  onChange={e => setSelectedBankId(e.target.value)}
                >
                  <option value="">-- All Banks / Filter Products by Bank --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdCreditCard style={{ color: C.primary }} /> 3. Select Product(s) *
                    <span style={{ fontSize: '11px', fontWeight: 600, color: C.textLight, background: C.card, padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>
                      {selectedProdIds.length} Selected
                    </span>
                  </label>
                  <button 
                    type="button" 
                    onClick={handleToggleSelectAllProds}
                    style={{ fontSize: '12px', fontWeight: 700, color: C.primary, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {selectAllProds ? 'Deselect All' : 'Select All Products'}
                  </button>
                </div>
              </div>
            </div>

            {/* Product Checkboxes Grid */}
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: '10px', background: C.card, padding: '8px' }}>
              {availableProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: C.textLight }}>No products available for selected bank</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                  {availableProducts.map(p => {
                    const isChecked = selectedProdIds.includes(p.id);
                    return (
                      <label key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px',
                        cursor: 'pointer', background: isChecked ? `${C.primary}10` : C.bgSecondary,
                        border: `1px solid ${isChecked ? C.primary : C.border}`, transition: 'all 0.15s'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleProdCheckboxChange(p.id)}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: C.textLight, textTransform: 'capitalize' }}>
                            {p.category?.replace(/_/g, ' ')} • {p.bank_name || 'Bank'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: CUSTOM LINK & INCENTIVE */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '280px' }}>
              <label style={{ ...S.label, fontWeight: 800, fontSize: '13px' }}>
                4. Custom Bank Application URL *
              </label>
              <input 
                type="url"
                required
                placeholder="e.g. https://bank.com/apply/regalia?ref=EMP9923"
                style={{ ...S.input, fontFamily: 'monospace', fontSize: '12.5px' }}
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px', display: 'block' }}>
                Tip: You can use <code style={{ background: `${C.primary}15`, color: C.primary, padding: '1px 4px', borderRadius: '4px' }}>{"{emp_code}"}</code> placeholder to dynamically inject employee code per link.
              </span>
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <label style={{ ...S.label, fontWeight: 800, fontSize: '13px' }}>
                Per-Lead Incentive (₹)
              </label>
              <input 
                type="number"
                min="0"
                step="50"
                style={{ ...S.input, fontWeight: 700 }}
                value={incentiveAmount}
                onChange={e => setIncentiveAmount(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: C.textLight, marginTop: '4px', display: 'block' }}>
                Default: ₹500
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
            <button type="button" onClick={onClose} style={S.btn('outline')}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitting ? 'Assigning Links...' : 'Assign Custom Link(s)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
