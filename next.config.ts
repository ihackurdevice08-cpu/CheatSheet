// lib/firebase-admin.ts
// Firebase Admin SDK — 서버 전용 (API Routes에서만 import)
// 절대로 클라이언트 컴포넌트에서 import 하지 말 것

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env.local의 개행문자 이스케이프 처리
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

adminApp = getAdminApp();

export const adminDb = getFirestore(adminApp);
export default adminApp;
