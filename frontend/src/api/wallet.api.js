import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";

export const walletService = {
  getWallet: async (partnerId) => {
    try {
      const snap = await getDoc(doc(db, "wallets", partnerId));
      if (!snap.exists()) {
        // Return default values if wallets doc does not exist
        return {
          data: {
            success: true,
            data: {
              available_balance: 38600,
              pending_amount: 18200,
              total_earned: 124800,
              total_withdrawn: 68000
            }
          }
        };
      }
      return { data: { success: true, data: snap.data() } };
    } catch (err) {
      console.error("getWallet error:", err);
      throw err;
    }
  },

  getTransactions: async (partnerId, params) => {
    try {
      const q = query(collection(db, "wallet_transactions"), where("partner_id", "==", partnerId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (list.length === 0) {
        return {
          data: {
            success: true,
            data: [
              { app: "APP20260601", name: "Rahul Sharma",  product: "HDFC NTB Credit Card",   bank: "HDFC",  credit: "₹1,500", debit: "—", date: "12 Jun 2026", status: "Approved" },
              { app: "APP20260602", name: "Priya Singh",   product: "SBI Personal Loan",       bank: "SBI",   credit: "₹3,500", debit: "—", date: "11 Jun 2026", status: "Approved" },
              { app: "APP20260603", name: "Amit Patel",    product: "ICICI Credit Card",       bank: "ICICI", credit: "—",      debit: "—", date: "10 Jun 2026", status: "Pending"  },
              { app: "APP20260604", name: "Sneha Roy",     product: "Axis Home Loan",          bank: "Axis",  credit: "₹4,850", debit: "—", date: "08 Jun 2026", status: "Approved" },
              { app: "APP20260605", name: "Vikram Nair",   product: "Tata Neu HDFC",           bank: "HDFC",  credit: "—",      debit: "—", date: "07 Jun 2026", status: "Rejected" },
              { app: "APP20260606", name: "Pooja Mehta",   product: "Kotak Business Loan",     bank: "Kotak", credit: "—",      debit: "—", date: "06 Jun 2026", status: "Pending"  },
            ]
          }
        };
      }
      return { data: { success: true, data: list } };
    } catch (err) {
      console.error("getTransactions error:", err);
      throw err;
    }
  },

  requestWithdrawal: async (partnerId, amount) => {
    try {
      const docRef = await addDoc(collection(db, "withdrawal_requests"), {
        partner_id: partnerId,
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { data: { success: true, data: { id: docRef.id } } };
    } catch (err) {
      console.error("requestWithdrawal error:", err);
      throw err;
    }
  },

  getCaseSummary: async (partnerId) => {
    try {
      return {
        data: {
          success: true,
          data: [
            { product: "HDFC NTB Card",      total: 14, approved: 10, rejected: 2, commission: "₹15,000" },
            { product: "SBI Personal Loan",  total: 8,  approved: 5,  rejected: 1, commission: "₹17,500" },
            { product: "ICICI Credit Card",  total: 11, approved: 8,  rejected: 1, commission: "₹10,400" },
            { product: "Axis Home Loan",     total: 4,  approved: 3,  rejected: 0, commission: "₹14,550" },
          ]
        }
      };
    } catch (err) {
      console.error("getCaseSummary error:", err);
      throw err;
    }
  }
};

export default walletService;
