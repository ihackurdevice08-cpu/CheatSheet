// app/api/calendar/route.ts
// Google Calendar Events Insert API
// Anti-Pattern #3 준수: googleapis 직접 호출, 노코드 툴 없음
// NextAuth 세션의 access_token 사용

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertCalendarEvent } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  // ── 1. 인증 확인 ──────────────────────────────────────
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Google access token not found. 재로그인 후 시도하세요." },
      { status: 403 }
    );
  }

  // ── 2. 요청 바디 파싱 + 유효성 검사 ──────────────────
  let body: { title?: string; description?: string; deadline?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, deadline } = body;

  if (!title || !deadline) {
    return NextResponse.json(
      { error: "title과 deadline은 필수입니다." },
      { status: 400 }
    );
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return NextResponse.json(
      { error: "deadline 형식이 올바르지 않습니다. ISO 8601 형식을 사용하세요." },
      { status: 400 }
    );
  }

  // ── 3. Google Calendar 이벤트 인서트 ────────────────
  try {
    const eventId = await insertCalendarEvent({
      accessToken,
      title,
      description: description ?? `[CheatSheet] ${title}`,
      deadline: deadlineDate,
    });

    return NextResponse.json({ success: true, eventId }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // access_token 만료 감지
    if (message.includes("401") || message.includes("invalid_grant")) {
      return NextResponse.json(
        { error: "Google 토큰이 만료되었습니다. 재로그인 후 시도하세요." },
        { status: 401 }
      );
    }

    console.error("[calendar/route] Calendar API error:", message);
    return NextResponse.json(
      { error: "Calendar 등록에 실패했습니다.", detail: message },
      { status: 500 }
    );
  }
}
