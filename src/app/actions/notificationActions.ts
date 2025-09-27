
'use server';

import { getDatabase, ref, set } from "firebase-admin/database";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export async function storeAdminDeviceToken(token: string) {
  try {
    const adminApp = getFirebaseAdmin();
    const db = getDatabase(adminApp);
    const tokenRef = ref(db, "adminDeviceToken");
    await set(tokenRef, token);
    console.log(`Stored latest admin device token.`);
    return { success: true };
  } catch (err: any) {
    console.error("Store token error:", err.message);
    return { success: false, error: err.message };
  }
}
