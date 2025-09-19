
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const db = getDatabase(getAdminApp());
    const tokenRef = db.ref("adminDeviceToken");
    const snapshot = await tokenRef.once("value");

    if (!snapshot.exists()) {
      console.log('No admin device token found. Cannot send notification.');
      // Not an error, just no-op
      return NextResponse.json({ success: true, message: "No token found" });
    }

    const token = snapshot.val();
    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    const messaging = getMessaging(getAdminApp());
    const response = await messaging.send(message);
    console.log('Successfully sent message via API Route:', response);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Send notification error via API Route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
