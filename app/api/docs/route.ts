// app/api/docs/route.ts
// Google Docs 로깅 엔드포인트
// googleDocsLogId 없으면 신규 문서 생성 후 저장 → 있으면 Append
// 이 데이터는 Notebook LM의 학습 소스가 됨
//
// ⚠️  필수 OAuth Scope (auth.ts에 이미 설정됨):
//   https://www.googleapis.com/auth/documents

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createLogDocument, appendLogEntry } from "@/lib/googleDocs";
import { getUser, upsertUser } from "@/lib/firestore";

interface DocsPostBody {
  tags: string[];
  figure: string;
  completedItems: string[];
  insight: string;
}

export async function POST(req: NextRequest) {
  // ── 1. 인증 ───────────────────────────────────────────
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google access token not found. 재로그인 후 시도하세요." },
      { status: 403 }
    );
  }

  // uid: next-auth는 email을 식별자로 사용 (Sprint 1 설계 기준)
  const uid = session.user.email!;
  const userName = session.user.name ?? uid;

  // ── 2. 바디 파싱 + 유효성 검사 ───────────────────────
  let body: DocsPostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tags, figure, completedItems, insight } = body;

  if (!figure || !completedItems?.length) {
    return NextResponse.json(
      { error: "figure와 completedItems는 필수입니다." },
      { status: 400 }
    );
  }

  // ── 3. googleDocsLogId 확인 → 없으면 신규 생성 ───────
  let docId: string;

  try {
    const user = await getUser(uid);
    const existingDocId = user?.googleDocsLogId;

    if (!existingDocId) {
      // 최초: 문서 생성 + Firestore에 ID 저장
      docId = await createLogDocument(accessToken, userName);
      await upsertUser(uid, { googleDocsLogId: docId });
    } else {
      docId = existingDocId;
    }
  } catch (err) {
    console.error("[docs/route] Firestore or Doc create error:", err);
    return NextResponse.json(
      { error: "문서 초기화에 실패했습니다." },
      { status: 500 }
    );
  }

  // ── 4. 로그 엔트리 Append ─────────────────────────────
  const now = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  try {
    await appendLogEntry({
      accessToken,
      docId,
      date: now,
      tags: tags ?? [],
      figure,
      completedItems,
      insight: insight?.trim() || "(없음)",
    });

    return NextResponse.json(
      { success: true, docId },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("401") || message.includes("invalid_grant")) {
      return NextResponse.json(
        { error: "Google 토큰이 만료되었습니다. 재로그인 후 시도하세요." },
        { status: 401 }
      );
    }

    console.error("[docs/route] Append error:", message);
    return NextResponse.json(
      { error: "Docs 로깅에 실패했습니다.", detail: message },
      { status: 500 }
    );
  }
}
