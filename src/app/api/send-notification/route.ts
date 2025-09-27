
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);
    const tokenRef = ref(db, "adminDeviceToken");
    const snapshot = await get(tokenRef);

    if (!snapshot.exists()) {
      console.log('No admin device token found. Cannot send notification.');
      return NextResponse.json({ success: true, message: "No token found" });
    }

    const token = snapshot.val();

    if (!token) {
      console.log('Admin device token is empty. Cannot send notification.');
      return NextResponse.json({ success: true, message: "No token found" });
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
    console.log('Successfully sent message via API Route:', response);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Send notification error via API Route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
