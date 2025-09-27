'use server';

import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, set, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

const MAX_TOKENS = 5;

export async function storeAdminDeviceToken(token: string) {
  try {
    const db = getDatabase(getAdminApp());
    const tokensRef = ref(db, "deviceTokens");
    
    const snapshot = await get(tokensRef);
    let currentTokens: string[] = snapshot.val() ? Object.values(snapshot.val()) : [];

    if (currentTokens.includes(token)) {
      console.log("Token already exists.");
      return { success: true, message: "Token already exists." };
    }
    
    // Add the new token
    const newTokensRef = push(tokensRef);
    await set(newTokensRef, token);
    
    // Check if over limit after adding, and remove oldest if so
    const allTokensSnapshot = await get(tokensRef);
    const allTokens = allTokensSnapshot.val();
    const tokenKeys = Object.keys(allTokens);
    
    if(tokenKeys.length > MAX_TOKENS) {
        const oldestTokenKey = tokenKeys[0];
        await set(ref(db, `deviceTokens/${oldestTokenKey}`), null);
        console.log(`Removed oldest token to maintain limit of ${MAX_TOKENS}.`);
    }

    console.log(`Stored new admin device token. Current list size: ${tokenKeys.length}`);
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
    const tokensRef = ref(db, "deviceTokens");
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) {
      console.log('No admin device tokens found. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const tokensData = snapshot.val();
    const tokens = Object.values(tokensData) as string[];
    const tokenKeys = Object.keys(tokensData);
    
    if (tokens.length === 0) {
      console.log('No admin device tokens found. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    const messaging = getMessaging(adminApp);
    const response = await messaging.sendToDevice(tokens, message);
    
    console.log('Successfully sent message:', response);
    
    const tokensToRemove: Promise<any>[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
           const tokenKeyToRemove = tokenKeys[index];
           console.log(`Queueing invalid token for removal: ${tokenKeyToRemove}`);
           tokensToRemove.push(set(ref(db, `deviceTokens/${tokenKeyToRemove}`), null));
        }
      }
    });

    await Promise.all(tokensToRemove);
    if(tokensToRemove.length > 0) {
        console.log("Finished removing invalid tokens.");
    }

    return { success: true };

  } catch (err: any) {
    console.error("Send notification error:", err);
    return { success: false, error: err.message };
  }
}
