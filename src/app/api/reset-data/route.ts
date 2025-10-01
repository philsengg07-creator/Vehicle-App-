
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, set } from "firebase-admin/database";

const initialData = {
    taxis: {
      "taxi-1": {
        name: "Metro Cab",
        capacity: 4,
        bookedSeats: 2,
        bookings: {
            "booking-1": {
                employeeId: "John Doe",
                bookingTime: "2024-05-22T10:00:00Z"
            },
            "booking-2": {
                employeeId: "Jane Smith",
                bookingTime: "2024-05-22T10:05:00Z"
            }
        }
      },
      "taxi-2": {
        name: "City Express",
        capacity: 6,
        bookedSeats: 6,
        bookings: {
            "booking-3": { employeeId: "Alice", bookingTime: "2024-05-22T11:00:00Z" },
            "booking-4": { employeeId: "Bob", bookingTime: "2024-05-22T11:00:00Z" },
            "booking-5": { employeeId: "Charlie", bookingTime: "2024-05-22T11:00:00Z" },
            "booking-6": { employeeId: "Diana", bookingTime: "2024-05-22T11:00:00Z" },
            "booking-7": { employeeId: "Eve", bookingTime: "2024-05-22T11:00:00Z" },
            "booking-8": { employeeId: "Frank", bookingTime: "2024-05-22T11:00:00Z" }
        }
      },
      "taxi-3": {
        name: "Urban Ride",
        capacity: 5,
        bookedSeats: 1,
         bookings: {
            "booking-9": {
                employeeId: "Grace",
                bookingTime: "2024-05-22T12:00:00Z"
            }
        }
      }
    },
    remainingEmployees: {
      "emp-1": "Heidi",
      "emp-2": "Ivan",
      "emp-3": "Judy"
    },
    notifications: {},
    adminDeviceTokens: {}
  };
  

function getFirebaseAdmin(): App {
    const apps = getApps();
    if (apps.length > 0 && apps.find(app => app.name === 'adminResetApp')) {
        return apps.find(app => app.name === 'adminResetApp')!;
    }

    try {
        let serviceAccount: any;
        const serviceAccountEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (serviceAccountEnv) {
            serviceAccount = JSON.parse(serviceAccountEnv);
        } else {
            const fs = require('fs');
            const path = require('path');
            const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountString);
            } else {
                 throw new Error("Could not initialize Firebase Admin SDK: ServiceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
            }
        }
        
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminResetApp');

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK in reset-data API.", e.message);
        throw e;
    }
}


export async function POST() {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
    const dbRef = ref(db, '/');
    await set(dbRef, initialData);
    
    return NextResponse.json({ success: true, message: 'Database reset successfully' });
    
  } catch (err: any) {
    console.error("API reset-data error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
