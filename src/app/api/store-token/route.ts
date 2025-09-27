
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase, ref, get, push, set } from "firebase-admin/database";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);
    const tokensRef = ref(db, "deviceTokens");
    
    const snapshot = await get(tokensRef);
    const currentTokens = snapshot.val() || {};
    
    const tokenExists = Object.values(currentTokens).includes(token);

    if (tokenExists) {
      console.log("Token already exists in the database.");
      return NextResponse.json({ success: true, message: "Token already exists." });
    }
    
    const newTokensRef = push(tokensRef);
    await set(newTokensRef, token);
    
    console.log(`Stored new admin device token via API Route: ${token}`);
    return NextResponse.json({ success: true, message: "Token stored successfully." });

  } catch (err: any) {
    console.error("Store token error via API Route:", err);
    // In case of an error, return a 500 status code and the error message
    return NextResponse.json({ error: "Internal Server Error: " + err.message }, { status: 500 });
  }
}
