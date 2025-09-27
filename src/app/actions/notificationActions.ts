'use server';

import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, set, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

export async function storeAdminDeviceToken(token: string) {
  try {
    const db = getDatabase(getAdminApp());
    const tokenRef = ref(db, "adminDeviceToken");
    await set(tokenRef, token);
    console.log(`Stored latest admin device token.`);
    return { success: true };
  } catch (err: any) {
    console.error("Store token error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendNotification(title: string, body: string) {
  try {
    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);
    const tokenRef = ref(db, "adminDeviceToken");
    const snapshot = await get(tokenRef);

    if (!snapshot.exists()) {
      console.log('No admin device token found. Cannot send notification.');
      return { success: true, message: "No token found" };
    }

    const token = snapshot.val();
    
    if (!token) {
      console.log('Admin device token is empty. Cannot send notification.');
      return { success: true, message: "No token found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    const messaging = getMessaging(adminApp);
    const response = await messaging.send(message);
    
    console.log('Successfully sent message:', response);
    
  } catch (err: any) {
    console.error("Send notification error:", err);
    
    // If token is invalid, remove it from the database
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
       console.log("Invalid or expired token detected. Removing from database.");
       const db = getDatabase(getAdminApp());
       const tokenRef = ref(db, "adminDeviceToken");
       await set(tokenRef, null);
    }
    
    return { success: false, error: err.message };
  }
}
