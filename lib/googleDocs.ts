// lib/googleDocs.ts
// Google Docs API — 달성 기록 누적 로깅 (NotebookLM 소스 파이프라인)
// Anti-Pattern #3 준수: googleapis 직접 제어, 노코드 툴 없음
// 서버사이드 API Route에서만 호출
//
// ⚠️  필수 OAuth Scope:
//   https://www.googleapis.com/auth/documents
//   (auth.ts의 Google Provider authorization.params.scope에 이미 포함됨)

import { google } from "googleapis";

// ── 공통 OAuth2 클라이언트 생성 헬퍼 ────────────────────────
function makeDocsClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.docs({ version: "v1", auth });
}

function makeDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

// ── 1. 신규 문서 생성 ────────────────────────────────────────
// googleDocsLogId가 없을 때 최초 1회 호출
export async function createLogDocument(
  accessToken: string,
  userName: string
): Promise<string> {
  const docs = makeDocsClient(accessToken);

  const res = await docs.documents.create({
    requestBody: {
      title: `[CheatSheet] ${userName} — Mindset Log`,
    },
  });

  const docId = res.data.documentId;
  if (!docId) throw new Error("Document created but no ID returned");

  // 문서 헤더 초기화 (최초 1회)
  const headerText =
    `[CheatSheet] MINDSET LOG\n` +
    `User: ${userName}\n` +
    `Created: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}\n` +
    `──────────────────────────────────────\n` +
    `이 문서는 CheatSheet 시스템이 자동으로 기록합니다.\n` +
    `Notebook LM에 소스로 등록하여 성장 리포트를 생성하세요.\n` +
    `══════════════════════════════════════\n\n`;

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: headerText,
          },
        },
      ],
    },
  });

  return docId;
}

// ── 2. 로그 엔트리 Append ────────────────────────────────────
// 문서 끝에 새 엔트리를 추가
// NotebookLM이 읽기 좋은 Plain Text 포맷 유지 (No Feature Creep)
export interface LogEntry {
  accessToken: string;
  docId: string;
  date: string;         // "YYYY-MM-DD HH:mm"
  tags: string[];
  figure: string;
  completedItems: string[];
  insight: string;
}

export async function appendLogEntry({
  accessToken,
  docId,
  date,
  tags,
  figure,
  completedItems,
  insight,
}: LogEntry): Promise<void> {
  const docs = makeDocsClient(accessToken);

  // 현재 문서의 마지막 인덱스 조회
  const docRes = await docs.documents.get({ documentId: docId });
  const body = docRes.data.body;
  const endIndex = body?.content?.at(-1)?.endIndex ?? 1;
  // 마지막 줄바꿈 문자 앞에 삽입해야 하므로 -1
  const insertAt = Math.max(endIndex - 1, 1);

  const entryText =
    `\n[${date}]\n` +
    `상황: ${tags.join(", ")}\n` +
    `매핑된 위인: ${figure}\n` +
    `완료한 액션:\n` +
    completedItems.map((item) => `  - ${item}`).join("\n") +
    `\n사용자의 인사이트: ${insight || "(없음)"}\n` +
    `──────────────────────────────────────\n`;

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: insertAt },
            text: entryText,
          },
        },
      ],
    },
  });
}

// ── 3. 문서 공유 설정 (선택) ──────────────────────────────────
// Notebook LM 연동 시 필요하면 호출
export async function makeDocReadable(
  accessToken: string,
  docId: string
): Promise<void> {
  const drive = makeDriveClient(accessToken);
  await drive.permissions.create({
    fileId: docId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });
}
