import { db, storage } from '../config/firebase';
import { collection, addDoc, getDoc, getDocs, updateDoc, doc, query, where, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const applicationService = {
  submit: async (data) => {
    try {
      const docRef = await addDoc(collection(db, "applications"), {
        ...data,
        app_number: `APP${Date.now()}`,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return { data: { success: true, data: { id: docRef.id } } };
    } catch (err) {
      console.error("Submit application error:", err);
      throw err;
    }
  },

  list: async (params) => {
    try {
      let q = collection(db, "applications");
      if (params && params.partnerId) {
        q = query(q, where("partner_id", "==", params.partnerId));
      }
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { data: { success: true, data: list } };
    } catch (err) {
      console.error("List applications error:", err);
      throw err;
    }
  },

  getById: async (id) => {
    try {
      const snap = await getDoc(doc(db, "applications", id));
      if (!snap.exists()) {
        throw new Error("Application not found");
      }
      return { data: { success: true, data: { id: snap.id, ...snap.data() } } };
    } catch (err) {
      console.error("getById application error:", err);
      throw err;
    }
  },

  updateStatus: async (id, data) => {
    try {
      await updateDoc(doc(db, "applications", id), {
        ...data,
        updated_at: new Date().toISOString()
      });
      return { data: { success: true } };
    } catch (err) {
      console.error("updateStatus application error:", err);
      throw err;
    }
  },

  uploadDoc: async (id, file, doc_type) => {
    try {
      const fileRef = ref(storage, `application_documents/${id}/${doc_type}_${Date.now()}`);
      const snap = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snap.ref);

      const docObj = {
        doc_type,
        file_url: downloadUrl,
        uploaded_at: new Date().toISOString()
      };

      await updateDoc(doc(db, "applications", id), {
        documents: arrayUnion(docObj),
        updated_at: new Date().toISOString()
      });

      return { data: { success: true, data: docObj } };
    } catch (err) {
      console.error("uploadDoc application error:", err);
      throw err;
    }
  }
};

export default applicationService;
