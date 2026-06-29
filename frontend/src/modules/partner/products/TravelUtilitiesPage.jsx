import React, { useState } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdFlight, MdHotel, MdDirectionsBus, MdTrain, 
  MdSmartphone, MdTv, MdFlashOn, MdLocalAtm, 
  MdHistory 
} from 'react-icons/md';

const SERVICES = [
  { id: 'flights', label: 'Flight Booking', icon: MdFlight },
  { id: 'hotels', label: 'Hotel Booking', icon: MdHotel },
  { id: 'bus', label: 'Bus Booking', icon: MdDirectionsBus },
  { id: 'train', label: 'Train Booking', icon: MdTrain }
];

const UTILITIES = [
  { id: 'recharge', label: 'Mobile Recharge', icon: MdSmartphone },
  { id: 'dth', label: 'DTH Recharge', icon: MdTv },
  { id: 'electricity', label: 'Electricity Bill', icon: MdFlashOn },
  { id: 'fastag', label: 'FASTag Recharge', icon: MdLocalAtm }
];

export default function TravelUtilitiesPage() {
  const { C } = useTheme();
  const S = makeS(C);

  const [activeTab, setActiveTab] = useState('flights');
  const [transactions, setTransactions] = useState([
    { id: 'TXN-0931', service: 'Mobile Recharge', customer: '9823012930', amount: '₹299', date: '23/06/2026', status: 'Success', commission: '₹4.50' }
  ]);

  // Form states
  const [form, setForm] = useState({ field1: '', field2: '', amount: '' });

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    if (!form.field1 || !form.amount) return alert('Please enter required details.');

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      service: activeTab.toUpperCase(),
      customer: form.field1,
      amount: `₹${form.amount}`,
      date: new Date().toLocaleDateString(),
      status: 'Success',
      commission: `₹${(parseFloat(form.amount) * 0.015).toFixed(2)}` // 1.5% commission
    };

    setTransactions([newTxn, ...transactions]);
    setForm({ field1: '', field2: '', amount: '' });
    alert('Transaction processed successfully! Commission credited to wallet.');
  };

  const getLabel1 = () => {
    if (activeTab === 'flights' || activeTab === 'hotels') return 'Traveler Name / Hotel City';
    if (activeTab === 'recharge' || activeTab === 'dth') return 'Mobile / Customer ID';
    if (activeTab === 'electricity') return 'Consumer Number';
    return 'FASTag Vehicle Number';
  };

  const getLabel2 = () => {
    if (activeTab === 'flights') return 'Destination Code';
    if (activeTab === 'recharge' || activeTab === 'dth') return 'Operator / Circle';
    if (activeTab === 'electricity') return 'State Electricity Board';
    return 'Optional details';
  };

  const allTabs = [...SERVICES, ...UTILITIES];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Title Card */}
      <div style={{ ...S.card, padding: '24px 28px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MdFlight style={{ color: C.primary }} /> Travel & Utility Services
        </h2>
        <p style={{ fontSize: '14px', color: C.textMid, margin: 0 }}>
          Book travel tickets or process bills for clients to earn instant margin payouts.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

        {/* Form Area */}
        <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>

          {/* Tab strip */}
          <div style={{
            padding: '14px 18px', background: C.bgSecondary,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', flexWrap: 'wrap', gap: '6px'
          }}>
            {allTabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setForm({ field1: '', field2: '', amount: '' }); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px', fontSize: '12px',
                    fontWeight: 700, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.card,
                    color: isActive ? '#fff' : C.textMid,
                    boxShadow: isActive ? `0 4px 14px ${C.primary}30` : 'none',
                    ...(isActive ? {} : { border: `1px solid ${C.border}` })
                  }}
                >
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleServiceSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
              {activeTab.replace('_', ' ').toUpperCase()} Form
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={S.label}>{getLabel1()} *</label>
                <input
                  type="text"
                  required
                  value={form.field1}
                  onChange={e => setForm({ ...form, field1: e.target.value })}
                  style={S.input}
                />
              </div>
              <div>
                <label style={S.label}>{getLabel2()}</label>
                <input
                  type="text"
                  value={form.field2}
                  onChange={e => setForm({ ...form, field2: e.target.value })}
                  style={S.input}
                />
              </div>
            </div>

            <div>
              <label style={S.label}>Transaction Amount (₹) *</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                style={S.input}
              />
            </div>

            <button type="submit" style={{
              ...S.btn('primary'), padding: '12px 24px', fontSize: '14px',
              border: 'none', borderRadius: '10px', cursor: 'pointer', alignSelf: 'flex-start'
            }}>
              Submit Transaction
            </button>
          </form>
        </div>

        {/* Right: Ledger sidebar */}
        <div style={{ ...S.card, padding: '24px', borderRadius: '16px', alignSelf: 'flex-start' }}>
          <h3 style={{
            fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 16px',
            paddingBottom: '12px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <MdHistory /> Utility Ledger
          </h3>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              background: C.bgSecondary, border: `1px solid ${C.border}`,
              padding: '12px', borderRadius: '12px', textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Total Volume</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: C.text }}>
                ₹{transactions.reduce((acc, t) => acc + parseInt(t.amount.replace('₹', '')), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{
              background: C.bgSecondary, border: `1px solid ${C.border}`,
              padding: '12px', borderRadius: '12px', textAlign: 'center'
            }}>
              <span style={{ fontSize: '10px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Commission</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: C.green }}>
                ₹{transactions.reduce((acc, t) => acc + parseFloat(t.commission.replace('₹', '')), 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.map(t => (
              <div key={t.id} style={{
                fontSize: '12px', padding: '12px', background: C.bgSecondary,
                border: `1px solid ${C.border}`, borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: C.text }}>{t.service}</span>
                  <p style={{ fontSize: '10px', color: C.textLight, fontFamily: 'monospace', margin: '3px 0 0' }}>{t.id} • {t.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: C.text }}>{t.amount}</span>
                  <p style={{ fontSize: '10px', color: C.green, fontWeight: 700, margin: '3px 0 0' }}>+{t.commission}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
