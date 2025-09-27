
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);
    const tokensRef = ref(db, "deviceTokens");
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) {
      console.log('No admin device tokens found. Cannot send notification.');
      return NextResponse.json({ success: true, message: "No tokens found" });
    }

    const tokensData = snapshot.val();
    const tokens = Object.values(tokensData) as string[];

    if (tokens.length === 0) {
      console.log('No admin device tokens found. Cannot send notification.');
      return NextResponse.json({ success: true, message: "No tokens found" });
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    const messaging = getMessaging(adminApp);
    const response = await messaging.sendToDevice(tokens, message);
    console.log('Successfully sent message via API Route:', response);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Send notification error via API Route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
