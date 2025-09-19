
import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { getDatabase } from "firebase-admin/database";

export async function POST() {
  try {
    const adminApp = getAdminApp();
    const db = getDatabase(adminApp);

    const taxisRef = db.ref('taxis');
    const taxisSnapshot = await taxisRef.once('value');

    const updates: { [key: string]: any } = {};

    if (taxisSnapshot.exists()) {
      const taxis = taxisSnapshot.val();
      for (const taxiId in taxis) {
        updates[`/taxis/${taxiId}/bookings`] = null;
        updates[`/taxis/${taxiId}/bookedSeats`] = 0;
      }
    }

    updates['/remainingEmployees'] = null;
    updates['/notifications'] = null;

    await db.ref().update(updates);

    console.log('Daily data reset successfully via API route.');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error resetting daily data via API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
