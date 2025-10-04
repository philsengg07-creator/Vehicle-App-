// sendTestNotification.js
const admin = require("firebase-admin");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const fs = require('fs');

// 1. Initialize with your service account JSON (download from Firebase Console → Project Settings → Service Accounts)
// Make sure to rename your downloaded key to 'ServiceAccountKey.json' and place it in the root directory.
const serviceAccountPath = './ServiceAccountKey.json';
let serviceAccount;
try {
    const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountString);

    // THE FIX: The private key from some sources has literal '\\n' instead of newlines.
    // We will programmatically replace them with actual newlines.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

} catch (e) {
    console.error("❌ Could not read or parse 'ServiceAccountKey.json'. Please make sure the file exists and you have pasted your new service account key into it.", e);
    process.exit(1);
}


if (!getApps().length) {
    initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/"
    });
}

const db = getDatabase();

async function sendTestNotification() {
  try {
    // 2. Hardcode the device token for testing
    const token = "fpPfGdGC4F9ZvZG0XG9x8E:APA91bH_sIzLJYeizPSHVxcqvjaZLxGu91YTvv0PsJevtbsxJu1tqp-Int0yWUUD2fxAUZiXLIAg_JelMluUydToG3Zy5SM2Jp5Lud2bhjzfJ8j-rdLr9SI";

    if (!token) {
      console.error("❌ Hardcoded token is missing.");
      process.exit(1);
    }

    console.log("✅ Using hardcoded token:", token);

    // 3. Build a sample notification payload
    const payload = {
      notification: {
        title: "Direct Token Test",
        body: "If you see this, sending to a specific token is working 🎉"
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
        console.log("\n✅ Notification sent successfully to FCM. If you didn't see it on your device, the problem is on the client-side (service worker) or the token is invalid/expired.");
    }

  } catch (err) {
    console.error("🔥 Error sending notification:", err);
    if (err.code === 'messaging/registration-token-not-registered') {
        console.error("\n❗️ The token is invalid or expired. The device cannot receive the notification.");
    } else {
        console.error("\n❌ The notification failed to send from the server. The problem is on the server-side, likely with permissions or Firebase plan limitations.");
    }
  } finally {
    process.exit(0);
  }
}

sendTestNotification();
