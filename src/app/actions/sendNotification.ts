
'use server';

import { getDatabase, ref, get, set } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";

export async function sendNotification(title: string, body: string) {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
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

    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    
    console.log('Successfully sent message:', response);
    return { success: true, message: "Notification sent" };
    
  } catch (err: any) {
    console.error("Send notification error:", err);
    
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
       console.log("Invalid or expired token detected. Removing from database.");
       try {
         const db = getDatabase(getFirebaseAdmin());
         const tokenRef = ref(db, "adminDeviceToken");
         await set(tokenRef, null);
       } catch (dbError) {
         console.error("Failed to remove token from database:", dbError);
       }
    }
    
    return { success: false, error: err.message };
  }
}
