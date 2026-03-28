"use client";

// components/ActionChecklist.tsx
// Action Items 인터랙티브 체크리스트
// - 체크 시 strike-through + unlock 애니메이션
// - Firestore gamification.totalCompleted 업데이트
// - [기한 설정] 버튼 UI (Calendar 연동은 Sprint 3 Task B에서 완성)

import { useState } from "react";
import { completeActionItem, saveCalendarEventId } from "@/lib/firestore";

interface ActionChecklistProps {
  uid: string;
  sessionId: string;
  items: string[];
  initialCompleted?: string[]; // 이미 완료된 항목 (세션 재진입 시)
}

interface ItemState {
  checked: boolean;
  justChecked: boolean;    // unlock 애니메이션 트리거용
  showDeadline: boolean;   // 기한 설정 UI 열림 여부
  deadline: string;        // datetime-local 값
  submitting: boolean;     // Calendar POST 요청 중
  calendarDone: boolean;   // Calendar 등록 완료 여부
}

function initItemState(
  items: string[],
  initialCompleted: string[]
): Record<number, ItemState> {
  return Object.fromEntries(
    items.map((item, i) => [
      i,
      {
        checked: initialCompleted.includes(item),
        justChecked: false,
        showDeadline: false,
        deadline: "",
        submitting: false,
        calendarDone: false,
      },
    ])
  );
}

export default function ActionChecklist({
  uid,
  sessionId,
  items,
  initialCompleted = [],
}: ActionChecklistProps) {
  const [states, setStates] = useState<Record<number, ItemState>>(() =>
    initItemState(items, initialCompleted)
  );

  // 단일 항목 상태 업데이트 헬퍼
  function patch(index: number, delta: Partial<ItemState>) {
    setStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], ...delta },
    }));
  }

  // ── 체크박스 클릭 ──────────────────────────────────────
  async function handleCheck(index: number, item: string) {
    if (states[index].checked) return; // 완료된 항목은 재클릭 불가

    // 즉각적 UI 반응 (optimistic update)
    patch(index, { checked: true, justChecked: true });

    // unlock 애니메이션 리셋 (0.6s 후)
    setTimeout(() => patch(index, { justChecked: false }), 600);

    // Firestore: completedItems 추가 + gamification.totalCompleted +1
    try {
      await completeActionItem(uid, sessionId, item);
    } catch {
      // 실패 시 롤백
      patch(index, { checked: false, justChecked: false });
    }
  }

  // ── 기한 설정 토글 ─────────────────────────────────────
  function toggleDeadline(index: number) {
    patch(index, {
      showDeadline: !states[index].showDeadline,
      deadline: "",
      calendarDone: false,
    });
  }

  // ── Google Calendar POST (Sprint 3 Task B API 연결) ────
  async function handleCalendarSubmit(index: number, item: string) {
    const deadline = states[index].deadline;
    if (!deadline) return;

    patch(index, { submitting: true });
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item,
          description: `[CheatSheet] Action Item: ${item}`,
          deadline: new Date(deadline).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Calendar API failed");
      const { eventId } = await res.json();
      // Firestore session에 calendarEventId 저장
      if (eventId) {
        await saveCalendarEventId(uid, sessionId, eventId);
      }
      patch(index, { calendarDone: true, showDeadline: false });
    } catch {
      patch(index, { submitting: false });
      alert("캘린더 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      patch(index, { submitting: false });
    }
  }

  const completedCount = Object.values(states).filter((s) => s.checked).length;
  const allDone = completedCount === items.length;

  return (
    <div style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <p className="mono" style={styles.label}>ACTION ITEMS</p>
        <span className="mono" style={styles.counter}>
          {completedCount}/{items.length}
        </span>
      </div>

      {/* 진행 미니 게이지 */}
      <div style={styles.miniTrack}>
        <div
          style={{
            ...styles.miniFill,
            width: `${(completedCount / items.length) * 100}%`,
          }}
        />
      </div>

      {/* 아이템 리스트 */}
      <ul style={styles.list}>
        {items.map((item, i) => {
          const s = states[i];
          return (
            <li key={i} style={styles.listItem}>
              {/* 체크박스 영역 */}
              <div style={styles.checkRow}>
                {/* 커스텀 체크박스 */}
                <button
                  onClick={() => handleCheck(i, item)}
                  disabled={s.checked}
                  className={s.justChecked ? "unlock-pulse" : ""}
                  style={{
                    ...styles.checkbox,
                    ...(s.checked ? styles.checkboxDone : {}),
                  }}
                  aria-label={s.checked ? "완료됨" : "완료로 표시"}
                >
                  {s.checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5L4 7.5L8.5 2.5"
                        stroke="#000"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* 텍스트 */}
                <span
                  style={{
                    ...styles.itemText,
                    ...(s.checked ? styles.itemTextDone : {}),
                  }}
                >
                  {item}
                </span>

                {/* 기한 설정 버튼 */}
                {!s.checked && (
                  <button
                    onClick={() => toggleDeadline(i)}
                    className="mono"
                    style={{
                      ...styles.deadlineToggle,
                      ...(s.calendarDone ? styles.deadlineToggleDone : {}),
                      ...(s.showDeadline ? styles.deadlineToggleOpen : {}),
                    }}
                    title="Google Calendar에 기한 등록"
                  >
                    {s.calendarDone ? "✓ CAL" : "📅 SET"}
                  </button>
                )}
              </div>

              {/* 기한 설정 패널 (펼침) */}
              {s.showDeadline && !s.checked && (
                <div style={styles.deadlinePanel} className="fade-up">
                  <input
                    type="datetime-local"
                    value={s.deadline}
                    onChange={(e) => patch(i, { deadline: e.target.value })}
                    style={styles.datetimeInput}
                  />
                  <button
                    onClick={() => handleCalendarSubmit(i, item)}
                    disabled={!s.deadline || s.submitting}
                    className="mono"
                    style={{
                      ...styles.calendarBtn,
                      ...(!s.deadline || s.submitting
                        ? styles.calendarBtnDisabled
                        : {}),
                    }}
                  >
                    {s.submitting ? "ADDING..." : "→ GOOGLE CAL"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* 전체 완료 시 보상 UI */}
      {allDone && (
        <div style={styles.allDoneBanner} className="fade-up unlock-pulse">
          <span className="mono" style={styles.allDoneText}>
            ⚡ ALL COMPLETE — LEVEL UP INCOMING
          </span>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "0.6rem",
    letterSpacing: "0.22em",
    color: "var(--accent)",
  },
  counter: {
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
  },

  // 미니 게이지
  miniTrack: {
    height: "2px",
    background: "var(--border)",
    borderRadius: "1px",
    overflow: "hidden",
  },
  miniFill: {
    height: "100%",
    background: "var(--accent)",
    borderRadius: "1px",
    transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // 리스트
  list: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  listItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
  },

  // 커스텀 체크박스
  checkbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    borderRadius: "4px",
    border: "1.5px solid var(--border)",
    background: "var(--bg-base)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
  },
  checkboxDone: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    cursor: "default",
  },

  // 텍스트
  itemText: {
    fontFamily: "var(--font-serif)",
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    lineHeight: 1.55,
    flex: 1,
    transition: "color 0.3s, text-decoration 0.3s",
  },
  itemTextDone: {
    textDecoration: "line-through",
    color: "var(--text-muted)",
  },

  // 기한 설정 버튼
  deadlineToggle: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-muted)",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    padding: "0.2rem 0.45rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "border-color 0.15s, color 0.15s",
  },
  deadlineToggleOpen: {
    borderColor: "var(--accent)",
    color: "var(--accent)",
  },
  deadlineToggleDone: {
    borderColor: "var(--success)",
    color: "var(--success)",
    cursor: "default",
  },

  // 기한 설정 패널
  deadlinePanel: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    marginLeft: "1.6rem", // 체크박스 너비 + gap 만큼 들여쓰기
    padding: "0.5rem 0.75rem",
    background: "var(--bg-base)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  datetimeInput: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    padding: "0.35rem 0.6rem",
    flex: 1,
    outline: "none",
    colorScheme: "dark",
  },
  calendarBtn: {
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--radius)",
    color: "#000",
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  calendarBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },

  // 전체 완료 배너
  allDoneBanner: {
    background: "var(--accent-dim)",
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius)",
    padding: "0.65rem 1rem",
    textAlign: "center",
  },
  allDoneText: {
    fontSize: "0.72rem",
    letterSpacing: "0.18em",
    color: "var(--accent)",
  },
};
