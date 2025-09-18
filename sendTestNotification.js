// sendTestNotification.js
import admin from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// 1. Initialize with your service account JSON (download from Firebase Console → Project Settings → Service Accounts)
// Make sure to rename your downloaded key to 'serviceAccountKey.json' and place it in the root directory.
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

if (!getApps().length) {
    initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}


const db = getDatabase();

async function sendTestNotification() {
  try {
    // 2. Fetch the latest admin device token from DB
    const snapshot = await db.ref("adminDeviceToken").once("value");
    const token = snapshot.val();

    if (!token) {
      console.error("❌ No token found in /adminDeviceToken. Please log in as an admin on your device first.");
      process.exit(1);
    }

    console.log("✅ Found token:", token);

    // 3. Build a sample notification payload
    const payload = {
      notification: {
        title: "Test Notification",
        body: "If you see this, push is working 🎉"
      }
    };

    // 4. Send to FCM
    const response = await admin.messaging().send(
        {
            token: token,
            notification: payload.notification
        }
    );
    console.log("📩 Send response:", response);

    if (response) {
        console.log("\n✅ Notification sent successfully to FCM. If you didn't see it on your device, the problem is on the client-side (service worker).");
    }

  } catch (err) {
    console.error("🔥 Error sending notification:", err);
    if (err.code === 'messaging/registration-token-not-registered') {
        console.error("\n❗️ The token is invalid or expired. Please log out and log back in as admin on your device to get a new token.");
    } else {
        console.error("\n❌ The notification failed to send from the server. The problem is on the server-side.");
    }
  } finally {
    process.exit(0);
  }
}

sendTestNotification();
