
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, set } from "firebase-admin/database";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);
    const tokenRef = ref(db, "adminDeviceToken");
    
    await set(tokenRef, token);
    
    console.log(`Stored latest admin device token via API Route: ${token}`);
    return NextResponse.json({ success: true, message: "Token stored successfully." });

  } catch (err: any) {
    console.error("Store token error via API Route:", err);
    return NextResponse.json({ error: "Internal Server Error: " + err.message }, { status: 500 });
  }
}
