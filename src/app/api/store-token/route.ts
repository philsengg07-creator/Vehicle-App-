
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase } from "firebase-admin/database";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const db = getDatabase(getAdminApp());
    const tokenRef = db.ref("adminDeviceToken");
    await tokenRef.set(token);
    
    console.log(`Stored new admin device token via API Route: ${token}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Store token error via API Route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
