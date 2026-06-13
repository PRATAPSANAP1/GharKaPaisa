import React, { useState } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";

function StatCard({ label, value, sub, accent, icon, C, S }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...S.card,
        flex: "1 1 200px",
        minWidth: "160px",
        borderColor: hov ? accent : C.border,
        boxShadow: hov ? `0 8px 30px ${accent}20, 0 4px 12px rgba(0,0,0,0.05)` : S.card.boxShadow,
        transform: hov ? "translateY(-3px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>{label}</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>{value}</div>
          {sub && <div style={{ fontSize: "12px", color: C.textLight, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>{sub}</div>}
        </div>
        <div style={{ background: accent + "18", borderRadius: "12px", padding: "10px", color: accent }}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status, C, S }) {
  const map = {
    Approved: [C.green, <Icons.check size={14} />],
    Rejected: [C.red, <Icons.x size={14} />],
    Pending:  [C.gold, <Icons.clock size={14} />]
  };
  const [color, icon] = map[status] || [C.textLight, null];
  return <span style={S.tag(color)}>{icon}{status}</span>;
}

function SectionTitle({ title, sub, action, onActionClick, C, S }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: "13px", color: C.textLight, marginTop: "4px" }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onActionClick} style={{ ...S.btn("outline"), padding: "6px 14px", fontSize: "12px" }}>
          {action}
        </button>
      )}
    </div>
  );
}

const WALLET_STMT = [
  { app: "APP20260601", name: "Rahul Sharma",  product: "HDFC NTB Credit Card",   bank: "HDFC",  credit: "₹1,500", debit: "—", date: "12 Jun 2026", status: "Approved" },
  { app: "APP20260602", name: "Priya Singh",   product: "SBI Personal Loan",       bank: "SBI",   credit: "₹3,500", debit: "—", date: "11 Jun 2026", status: "Approved" },
  { app: "APP20260603", name: "Amit Patel",    product: "ICICI Credit Card",       bank: "ICICI", credit: "—",      debit: "—", date: "10 Jun 2026", status: "Pending"  },
  { app: "APP20260604", name: "Sneha Roy",     product: "Axis Home Loan",          bank: "Axis",  credit: "₹4,850", debit: "—", date: "08 Jun 2026", status: "Approved" },
  { app: "APP20260605", name: "Vikram Nair",   product: "Tata Neu HDFC",           bank: "HDFC",  credit: "—",      debit: "—", date: "07 Jun 2026", status: "Rejected" },
  { app: "APP20260606", name: "Pooja Mehta",   product: "Kotak Business Loan",     bank: "Kotak", credit: "—",      debit: "—", date: "06 Jun 2026", status: "Pending"  },
];

const CASE_PRODUCTS = [
  { product: "HDFC NTB Card",      total: 14, approved: 10, rejected: 2, commission: "₹15,000" },
  { product: "SBI Personal Loan",  total: 8,  approved: 5,  rejected: 1, commission: "₹17,500" },
  { product: "ICICI Credit Card",  total: 11, approved: 8,  rejected: 1, commission: "₹10,400" },
  { product: "Axis Home Loan",     total: 4,  approved: 3,  rejected: 0, commission: "₹14,550" },
];

export default function PartnerWallet() {
  const { C } = useTheme();
  const S = makeS(C);
  const [withdrawReq, setWithdrawReq] = useState(false);

  const handleWithdraw = () => {
    setWithdrawReq(true);
    setTimeout(() => {
      alert("Withdraw Request of ₹38,600 has been sent successfully to Admin approval.");
      setWithdrawReq(false);
    }, 1200);
  };

  return (
    <div>
      <SectionTitle title="Wallet Dashboard" sub="View, manage and request commissions" C={C} S={S} />

      {/* Payout summaries */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
        <StatCard label="Total Approved Commission" value="₹1,24,800" accent={C.green}      icon={<Icons.check    size={18} />} C={C} S={S} />
        <StatCard label="Total Withdrawn"           value="₹68,000"   accent={C.primaryDark} icon={<Icons.withdraw  size={18} />} C={C} S={S} />
        <StatCard label="Pending Commission"        value="₹18,200"   accent={C.gold}        icon={<Icons.clock    size={18} />} C={C} S={S} />
        <StatCard label="Available Balance"         value="₹38,600"   accent={C.teal}        icon={<Icons.wallet   size={18} />} C={C} S={S} />
      </div>

      {/* Action withdraw banner */}
      <div style={{
        ...S.card,
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        background: `linear-gradient(to right, ${C.card}, ${C.bgSecondary})`
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.textLight }}>Withdrawable Balance</div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: C.text, marginTop: "4px" }}>₹38,600</div>
          <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>Min payout limit: ₹500 · Directly transfers to verified bank accounts.</div>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={withdrawReq}
          style={{ ...S.btn("primary"), padding: "14px 28px", fontSize: "14px" }}
        >
          {withdrawReq ? "Processing..." : <><Icons.withdraw size={16} /> Request Withdrawal </>}
        </button>
      </div>

      {/* Case-wise payouts */}
      <SectionTitle title="Case-wise Earnings Summary" sub="Analytics broken down by active product types" C={C} S={S} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {CASE_PRODUCTS.map(c => (
          <div key={c.product} style={S.card}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "14px" }}>{c.product}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { l: "Total cases", v: c.total,      col: C.text       },
                { l: "Approved",    v: c.approved,   col: C.green      },
                { l: "Rejected",    v: c.rejected,   col: C.red        },
                { l: "Total Earned",v: c.commission, col: C.tealDim    },
              ].map(x => (
                <div key={x.l} style={{ background: C.bgSecondary, padding: "8px 10px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "10px", color: C.textLight, fontWeight: 700 }}>{x.l}</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: x.col, marginTop: "2px" }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Ledger */}
      <SectionTitle title="Wallet Transaction History" sub="Complete historical ledger of credits/debits" action="Export CSV" C={C} S={S} />
      <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: C.bgSecondary, borderBottom: `1.5px solid ${C.border}` }}>
              {["App ID","Customer Name","Product Line","Bank Provider","Credit Amount","Created Date","Verification Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: C.textMid }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WALLET_STMT.map((row, idx) => (
              <tr
                key={idx}
                style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgSecondary}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", color: C.tealDim }}>{row.app}</td>
                <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", color: C.text }}>{row.name}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>{row.product}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                  <span style={S.tag(C.primaryDark)}>{row.bank}</span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "13px", color: row.credit !== "—" ? C.green : C.textMid }}>
                  {row.credit}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textLight }}>{row.date}</td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusBadge status={row.status} C={C} S={S} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
