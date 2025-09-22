'use server';

import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, set, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

const MAX_TOKENS = 5;

export async function storeAdminDeviceToken(token: string) {
  try {
    const db = getDatabase(getAdminApp());
    const tokensRef = ref(db, "adminDeviceTokens");
    
    const snapshot = await get(tokensRef);
    let currentTokens: string[] = snapshot.val() || [];

    // Remove the token if it already exists to move it to the end (most recent)
    currentTokens = currentTokens.filter(t => t !== token);
    
    // Add the new token to the end of the list
    currentTokens.push(token);

    // If the list is over the max size, remove the oldest token(s) from the start
    if (currentTokens.length > MAX_TOKENS) {
      currentTokens = currentTokens.slice(currentTokens.length - MAX_TOKENS);
    }
    
    await set(tokensRef, currentTokens);

    console.log(`Stored new admin device token. Current list size: ${currentTokens.length}`);
    return { success: true };
  } catch (err: any) {
    console.error("Store token error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendNotification(title: string, body: string) {
  try {
    const db = getDatabase(getAdminApp());
    const tokensRef = ref(db, "adminDeviceTokens");
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) {
      console.log('No admin device tokens found. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const tokens = snapshot.val();
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.log('No admin device tokens found. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    const messaging = getMessaging(getAdminApp());
    // sendToDevice is deprecated, but simpler for this use case than sendEachForMulticast
    // when we don't need to handle individual results.
    const response = await messaging.sendToDevice(tokens, message);
    
    console.log('Successfully sent message:', response);
    // Optional: Clean up invalid tokens based on response
    const tokensToRemove: Promise<any>[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Common error indicating an invalid or unregistered token.
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
           // Here you might want to implement logic to remove the invalid token from the DB
        }
      }
    });

    return { success: true };

  } catch (err: any) {
    console.error("Send notification error:", err);
    return { success: false, error: err.message };
  }
}