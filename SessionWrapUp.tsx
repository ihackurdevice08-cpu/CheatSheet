"use client";

// components/SessionWrapUp.tsx
// 모든 Action Item 완료 후 나타나는 최종 회고 + Docs 로깅 UI
// allDone === true 시 ActionChecklist 하단에 렌더링

import { useState } from "react";

interface SessionWrapUpProps {
  uid: string;
  sessionId: string;
  figure: string;
  tags: string[];
  completedItems: string[];
}

type SyncState = "idle" | "syncing" | "done" | "error";

export default function SessionWrapUp({
  figure,
  tags,
  completedItems,
}: SessionWrapUpProps) {
  const [insight, setInsight] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [docId, setDocId] = useState<string | null>(null);

  async function handleSync() {
    if (syncState === "done" || syncState === "syncing") return;

    setSyncState("syncing");
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figure,
          tags,
          completedItems,
          insight: insight.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Sync failed");
      }

      const { docId: returnedDocId } = await res.json();
      setDocId(returnedDocId);
      setSyncState("done");
    } catch (err) {
      console.error("[SessionWrapUp] Docs sync error:", err);
      setSyncState("error");
    }
  }

  return (
    <div style={styles.wrapper} className="fade-up">

      {/* 터미널 헤더 바 */}
      <div style={styles.terminalBar}>
        <div style={styles.terminalDots}>
          <span style={{ ...styles.dot, background: "#ff5f57" }} />
          <span style={{ ...styles.dot, background: "#febc2e" }} />
          <span style={{ ...styles.dot, background: "#28c840" }} />
        </div>
        <span className="mono" style={styles.terminalTitle}>
          SESSION_WRAPUP.exe
        </span>
      </div>

      {/* 본문 */}
      <div style={styles.body}>

        {/* 컨텍스트 요약 */}
        <div style={styles.contextBlock}>
          <div style={styles.contextRow}>
            <span className="mono" style={styles.contextKey}>FIGURE</span>
            <span style={styles.contextVal}>{figure}</span>
          </div>
          <div style={styles.contextRow}>
            <span className="mono" style={styles.contextKey}>TAGS</span>
            <span style={styles.contextVal}>{tags.join(" / ")}</span>
          </div>
          <div style={styles.contextRow}>
            <span className="mono" style={styles.contextKey}>DONE</span>
            <span style={{ ...styles.contextVal, color: "var(--success)" }}>
              {completedItems.length} actions completed
            </span>
          </div>
        </div>

        <div style={styles.divider} />

        {/* 인사이트 입력 */}
        <div style={styles.inputBlock}>
          <p className="mono" style={styles.inputLabel}>
            // INSIGHT LOG
          </p>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="낡은 마인드셋을 파괴하며 얻은 짧은 인사이트를 기록하라"
            rows={4}
            disabled={syncState === "done"}
            style={{
              ...styles.textarea,
              ...(syncState === "done" ? styles.textareaDone : {}),
            }}
          />
          <p className="mono" style={styles.charCount}>
            {insight.length} chars
          </p>
        </div>

        {/* 동기화 버튼 */}
        {syncState !== "done" && (
          <button
            onClick={handleSync}
            disabled={syncState === "syncing"}
            className="mono"
            style={{
              ...styles.syncBtn,
              ...(syncState === "syncing" ? styles.syncBtnLoading : {}),
            }}
          >
            {syncState === "syncing" ? (
              <SyncingLabel />
            ) : (
              "→ SYNC TO NOTEBOOK LM (DOCS)"
            )}
          </button>
        )}

        {/* 에러 */}
        {syncState === "error" && (
          <div style={styles.errorBox} className="fade-up">
            <span className="mono" style={{ color: "var(--danger)", fontSize: "0.72rem" }}>
              ✗ SYNC FAILED — 재시도하거나 재로그인 후 시도하세요
            </span>
            <button
              onClick={() => setSyncState("idle")}
              className="mono"
              style={styles.retryBtn}
            >
              RETRY
            </button>
          </div>
        )}

        {/* 완료 상태 */}
        {syncState === "done" && (
          <div style={styles.doneBox} className="fade-up unlock-pulse">
            <div style={styles.doneHeader}>
              <span className="mono" style={styles.doneTitle}>
                ✓ SYNCED TO GOOGLE DOCS
              </span>
            </div>
            <p style={styles.doneDesc}>
              이 기록은 Notebook LM의 소스로 활용됩니다.
              성장이 누적되고 있습니다.
            </p>
            {docId && (
              <a
                href={`https://docs.google.com/document/d/${docId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={styles.docsLink}
              >
                → 문서에서 확인하기 ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 로딩 라벨 (타이핑 효과 대용) ─────────────────────────────
function SyncingLabel() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      SYNCING
      <span style={styles.syncDots}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              ...styles.syncDot,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    marginTop: "0.5rem",
    boxShadow: "0 0 24px var(--accent-glow)",
  },

  // 터미널 헤더
  terminalBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border)",
    padding: "0.5rem 1rem",
  },
  terminalDots: {
    display: "flex",
    gap: "0.35rem",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  terminalTitle: {
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    color: "var(--text-muted)",
  },

  // 본문
  body: {
    background: "var(--bg-surface)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },

  // 컨텍스트 요약
  contextBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  contextRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "baseline",
  },
  contextKey: {
    fontSize: "0.6rem",
    letterSpacing: "0.18em",
    color: "var(--accent)",
    minWidth: "52px",
    flexShrink: 0,
  },
  contextVal: {
    fontFamily: "var(--font-serif)",
    fontSize: "0.88rem",
    color: "var(--text-primary)",
  },

  divider: {
    height: "1px",
    background: `linear-gradient(90deg, var(--accent) 0%, transparent 80%)`,
    opacity: 0.2,
  },

  // 인사이트 입력
  inputBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  inputLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.2em",
    color: "var(--accent)",
  },
  textarea: {
    background: "var(--bg-base)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    lineHeight: 1.7,
    padding: "0.875rem",
    resize: "vertical",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    colorScheme: "dark",
  },
  textareaDone: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  charCount: {
    fontSize: "0.6rem",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    textAlign: "right",
  },

  // 동기화 버튼
  syncBtn: {
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--radius)",
    color: "#000",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    padding: "0.875rem",
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  syncBtnLoading: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  // 로딩 점
  syncDots: {
    display: "inline-flex",
    gap: "3px",
    alignItems: "center",
  },
  syncDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#000",
    display: "inline-block",
    animation: "dotPulse 1.2s ease-in-out infinite",
  },

  // 에러
  errorBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,68,68,0.08)",
    border: "1px solid var(--danger)",
    borderRadius: "var(--radius)",
    padding: "0.75rem 1rem",
  },
  retryBtn: {
    background: "transparent",
    border: "1px solid var(--danger)",
    borderRadius: "var(--radius)",
    color: "var(--danger)",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    padding: "0.3rem 0.6rem",
    cursor: "pointer",
  },

  // 완료 상태
  doneBox: {
    background: "var(--accent-dim)",
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius)",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  doneHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  doneTitle: {
    fontSize: "0.72rem",
    letterSpacing: "0.15em",
    color: "var(--accent)",
  },
  doneDesc: {
    fontFamily: "var(--font-serif)",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  docsLink: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    color: "var(--accent)",
    textDecoration: "none",
    borderBottom: "1px solid rgba(200,255,0,0.3)",
    paddingBottom: "1px",
    alignSelf: "flex-start",
  },
};
