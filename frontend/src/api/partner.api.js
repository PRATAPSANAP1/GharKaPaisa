import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const partnerService = {
  getProfile: async (id) => {
    try {
      const snap = await getDoc(doc(db, "partner_profiles", id));
      if (!snap.exists()) {
        throw new Error("Partner profile not found");
      }
      return { data: { success: true, data: snap.data() } };
    } catch (err) {
      console.error("getProfile error:", err);
      throw err;
    }
  },
  
  updateProfile: async (id, data) => {
    try {
      await updateDoc(doc(db, "partner_profiles", id), {
        ...data,
        updated_at: new Date().toISOString()
      });
      return { data: { success: true } };
    } catch (err) {
      console.error("updateProfile error:", err);
      throw err;
    }
  },

  getDashboard: async (id) => {
    // Return structured dashboard stats matching UI expectations
    return {
      data: {
        success: true,
        data: {
          total_submissions: 52,
          approved_cases: 37,
          earnings_paid: 68000,
          pending_approval: 11
        }
      }
    };
  },

  uploadKYC: async (id, files, numbers) => {
    try {
      const profileSnap = await getDoc(doc(db, "partner_profiles", id));
      if (!profileSnap.exists()) {
        throw new Error("Partner profile not found");
      }
      const profileData = profileSnap.data();
      const existingDocs = profileData.kyc_documents || [];
      
      const newDocs = [...existingDocs];

      // Upload each file to Firebase Storage
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        const fileRef = ref(storage, `kyc_documents/${id}/${key}_${Date.now()}`);
        const snap = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snap.ref);

        // Find and replace or add doc
        const existingIdx = newDocs.findIndex(d => d.doc_type === key);
        const docNum = key === 'aadhaar' ? (numbers.aadhaar_number || '') : (key === 'pan' ? (numbers.pan_number || '') : '');
        
        const docObj = {
          doc_type: key,
          file_url: downloadUrl,
          doc_number: docNum || ''
        };

        if (existingIdx >= 0) {
          newDocs[existingIdx] = docObj;
        } else {
          newDocs.push(docObj);
        }
      }

      // Update in Firestore
      await updateDoc(doc(db, "partner_profiles", id), {
        kyc_documents: newDocs,
        kyc_status: 'under_review',
        updated_at: new Date().toISOString()
      });

      return { data: { success: true, message: "KYC documents uploaded successfully! KYC is under review." } };
    } catch (err) {
      console.error("uploadKYC error:", err);
      throw err;
    }
  }
};

export default partnerService;
