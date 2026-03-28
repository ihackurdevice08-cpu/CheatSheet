"use client";

// app/dashboard/page.tsx
// 메인 대시보드 — TriggerBoard (버튼 그리드) + CheatCodeCard 렌더링
// Anti-Pattern #2 준수: 텍스트 입력창 없음. 오직 버튼 트리거만.

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getGlobalTags,
  getUserCustomTags,
  getCheatCodesByTags,
} from "@/lib/firestore";
import { useProgress } from "@/hooks/useProgress";
import CheatCodeCard from "@/components/CheatCodeCard";
import type { Tag, CheatCode } from "@/types";

type LoadState = "idle" | "loading" | "done" | "empty";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [cards, setCards] = useState<CheatCode[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [tagsReady, setTagsReady] = useState(false);

  const uid = (session?.user as { id?: string })?.id ?? session?.user?.email ?? null;
  const { level, progressPercent, gamification } = useProgress(uid);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!uid) return;
    Promise.all([getGlobalTags(), getUserCustomTags(uid)]).then(([g, c]) => {
      setTags([...g, ...c]);
      setTagsReady(true);
    });
  }, [uid]);

  const handleTagClick = useCallback(async (label: string) => {
    if (activeTag === label) {
      setActiveTag(null);
      setCards([]);
      setLoadState("idle");
      return;
    }
    setActiveTag(label);
    setCards([]);
    setLoadState("loading");
    try {
      const results = await getCheatCodesByTags([label]);
      setCards(results);
      setLoadState(results.length > 0 ? "done" : "empty");
    } catch {
      setLoadState("empty");
    }
  }, [activeTag]);

  if (status === "loading" || !tagsReady) return <LoadingScreen />;

  const firstName = session?.user?.name?.split(" ")[0] ?? "YOU";

  return (
    <main style={styles.main}>
      {/* ── 상단 헤더 ── */}
      <header style={styles.header} className="fade-up">
        <div>
          <p className="mono" style={styles.greeting}>
            MINDSET OS · {firstName.toUpperCase()}
          </p>
          <h1 style={styles.headline}>
            지금 어떤 상황인가,{" "}
            <span style={{ color: "var(--accent)" }}>선택하라.</span>
          </h1>
        </div>
        <div style={styles.levelBlock}>
          <div style={styles.levelTop}>
            <span className="mono" style={styles.levelLabel}>LV.{level}</span>
            <span className="mono" style={styles.levelCount}>
              {gamification?.totalCompleted ?? 0} DONE
            </span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      {/* ── TriggerBoard ── */}
      <section style={styles.triggerSection} className="fade-up">
        <p className="mono" style={styles.sectionLabel}>// TRIGGER BOARD</p>
        {tags.length === 0 ? (
          <EmptyTagState onGoAdmin={() => router.push("/admin")} />
        ) : (
          <div style={styles.triggerGrid}>
            {tags.map((tag, i) => {
              const isActive = activeTag === tag.label;
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.label)}
                  className="fade-up"
                  style={{
                    ...styles.triggerBtn,
                    ...(isActive ? styles.triggerBtnActive : {}),
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <span style={styles.triggerEmoji}>{tag.emoji}</span>
                  <span style={styles.triggerLabel}>{tag.label}</span>
                  {isActive && <span style={styles.triggerIndicator} />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 결과 영역 ── */}
      {loadState !== "idle" && (
        <section style={styles.resultSection}>
          {loadState === "loading" && (
            <div style={styles.stateBox}>
              <span className="mono" style={styles.stateText}>LOADING CHEATCODES...</span>
              <div style={styles.loadingDots}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          {loadState === "empty" && (
            <div style={styles.stateBox}>
              <span className="mono" style={styles.stateText}>NO CHEATCODE FOR THIS TAG YET</span>
              <button onClick={() => router.push("/admin")} className="mono" style={styles.injectBtn}>
                + INJECT NOW
              </button>
            </div>
          )}
          {loadState === "done" && (
            <>
              <div style={styles.resultHeader}>
                <p className="mono" style={styles.sectionLabel}>
                  // {activeTag?.toUpperCase()} — {cards.length} CHEATCODE{cards.length > 1 ? "S" : ""}
                </p>
              </div>
              <div style={styles.cardGrid}>
                {cards.map((card, i) => (
                  <CheatCodeCard key={card.id} data={card} index={i} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── 하단 내비 ── */}
      <nav style={styles.bottomNav} className="fade-up">
        <button onClick={() => router.push("/admin")} className="mono" style={styles.navBtn}>⚡ ADMIN</button>
        <button onClick={() => router.push("/dashboard/settings")} className="mono" style={styles.navBtn}>⚙ TAGS</button>
      </nav>
    </main>
  );
}

function EmptyTagState({ onGoAdmin }: { onGoAdmin: () => void }) {
  return (
    <div style={styles.emptyState}>
      <p className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
        태그가 없습니다. Admin에서 먼저 태그를 등록하세요.
      </p>
      <button onClick={onGoAdmin} className="mono" style={styles.injectBtn}>→ ADMIN으로 이동</button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="mono" style={{ color: "var(--text-muted)", letterSpacing: "0.25em", fontSize: "0.75rem" }}>INITIALIZING...</p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { position: "relative", zIndex: 1, minHeight: "100vh", maxWidth: "960px", margin: "0 auto", padding: "2rem clamp(1rem, 4vw, 2.5rem) 6rem", display: "flex", flexDirection: "column", gap: "2.5rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", paddingTop: "1.5rem" },
  greeting: { fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "0.4rem" },
  headline: { fontFamily: "var(--font-serif)", fontSize: "clamp(1.4rem, 3.5vw, 2.25rem)", fontWeight: 700, lineHeight: 1.25, color: "var(--text-primary)" },
  levelBlock: { display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "140px" },
  levelTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  levelLabel: { fontSize: "0.75rem", color: "var(--accent)", letterSpacing: "0.1em" },
  levelCount: { fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em" },
  progressTrack: { height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--accent)", borderRadius: "2px", transition: "width 0.6s ease" },
  triggerSection: { display: "flex", flexDirection: "column", gap: "1rem" },
  sectionLabel: { fontSize: "0.65rem", letterSpacing: "0.18em", color: "var(--text-muted)" },
  triggerGrid: { display: "flex", flexWrap: "wrap", gap: "0.6rem" },
  triggerBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "0.65rem 1.1rem", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", position: "relative" },
  triggerBtnActive: { background: "var(--accent-dim)", borderColor: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" },
  triggerEmoji: { fontSize: "1.1rem", lineHeight: 1 },
  triggerLabel: { fontFamily: "var(--font-serif)", fontSize: "0.88rem", color: "var(--text-primary)", whiteSpace: "nowrap" },
  triggerIndicator: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 },
  resultSection: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  resultHeader: { borderTop: "1px solid var(--border)", paddingTop: "1.25rem" },
  cardGrid: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  stateBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem 1rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)" },
  stateText: { fontSize: "0.72rem", letterSpacing: "0.15em", color: "var(--text-muted)" },
  loadingDots: { display: "flex", gap: "0.4rem" },
  dot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", animation: "dotPulse 1.2s ease-in-out infinite" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.875rem", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)" },
  injectBtn: { background: "transparent", border: "1px solid var(--accent)", borderRadius: "var(--radius)", color: "var(--accent)", fontSize: "0.72rem", letterSpacing: "0.12em", padding: "0.5rem 1rem", cursor: "pointer" },
  bottomNav: { display: "flex", gap: "0.5rem", position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 10 },
  navBtn: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-secondary)", fontSize: "0.7rem", letterSpacing: "0.1em", padding: "0.5rem 0.875rem", cursor: "pointer", backdropFilter: "blur(8px)" },
};
