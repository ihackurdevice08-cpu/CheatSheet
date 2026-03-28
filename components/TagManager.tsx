"use client";

// components/TagManager.tsx
// 감정/상황 태그 풀 관리 컴포넌트
// 글로벌 태그(읽기 전용) + 유저 커스텀 태그(추가/삭제)

import { useEffect, useState } from "react";
import {
  getGlobalTags,
  getUserCustomTags,
  addUserCustomTag,
  deleteUserCustomTag,
} from "@/lib/firestore";
import type { Tag } from "@/types";

const PRESET_EMOJIS = ["😨", "🌅", "🚨", "😤", "💀", "🔥", "😴", "⚡", "🧊", "🎯"];

interface TagManagerProps {
  uid: string;
  onTagsChange?: (tags: Tag[]) => void;
}

export default function TagManager({ uid, onTagsChange }: TagManagerProps) {
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);
  const [customTags, setCustomTags] = useState<Tag[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("⚡");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getGlobalTags(), getUserCustomTags(uid)]).then(
      ([g, c]) => {
        setGlobalTags(g);
        setCustomTags(c);
        onTagsChange?.([...g, ...c]);
      }
    );
  }, [uid]);

  const allTags = [...globalTags, ...customTags];

  async function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    if (allTags.some((t) => t.label === label)) return;

    setLoading(true);
    try {
      await addUserCustomTag(uid, { label, emoji: newEmoji });
      const updated = await getUserCustomTags(uid);
      setCustomTags(updated);
      onTagsChange?.([...globalTags, ...updated]);
      setNewLabel("");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tagId: string) {
    setDeleteTarget(tagId);
    try {
      await deleteUserCustomTag(uid, tagId);
      const updated = customTags.filter((t) => t.id !== tagId);
      setCustomTags(updated);
      onTagsChange?.([...globalTags, ...updated]);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <section style={styles.wrapper}>
      {/* 헤더 */}
      <div style={styles.header}>
        <span className="mono" style={styles.label}>TAG POOL</span>
        <span style={styles.count}>{allTags.length} tags</span>
      </div>

      {/* 현재 태그 목록 */}
      <div style={styles.tagGrid}>
        {globalTags.map((tag) => (
          <div key={tag.id} style={{ ...styles.tag, ...styles.tagDefault }}>
            <span>{tag.emoji}</span>
            <span style={styles.tagLabel}>{tag.label}</span>
            <span className="mono" style={styles.tagBadge}>SYS</span>
          </div>
        ))}
        {customTags.map((tag) => (
          <div key={tag.id} style={{ ...styles.tag, ...styles.tagCustom }}>
            <span>{tag.emoji}</span>
            <span style={styles.tagLabel}>{tag.label}</span>
            <button
              onClick={() => handleDelete(tag.id)}
              disabled={deleteTarget === tag.id}
              style={styles.deleteBtn}
              title="삭제"
            >
              {deleteTarget === tag.id ? "…" : "×"}
            </button>
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div style={styles.divider} />

      {/* 새 태그 추가 폼 */}
      <div style={styles.addForm}>
        <span className="mono" style={styles.label}>NEW TAG</span>
        <div style={styles.addRow}>
          {/* 이모지 선택 */}
          <div style={styles.emojiPicker}>
            {PRESET_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                style={{
                  ...styles.emojiBtn,
                  ...(newEmoji === e ? styles.emojiBtnActive : {}),
                }}
              >
                {e}
              </button>
            ))}
          </div>

          {/* 라벨 입력 + 추가 버튼 */}
          <div style={styles.inputRow}>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="예: 아침 기상, 멘탈 터짐..."
              maxLength={20}
              style={styles.input}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newLabel.trim()}
              style={{
                ...styles.addBtn,
                ...(loading || !newLabel.trim() ? styles.addBtnDisabled : {}),
              }}
            >
              {loading ? "…" : "+ ADD"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "0.65rem",
    letterSpacing: "0.2em",
    color: "var(--accent)",
  },
  count: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  tagGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    minHeight: "2.5rem",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.3rem 0.65rem",
    borderRadius: "var(--radius)",
    fontSize: "0.82rem",
    border: "1px solid transparent",
  },
  tagDefault: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  },
  tagCustom: {
    background: "var(--accent-dim)",
    border: "1px solid rgba(200,255,0,0.25)",
    color: "var(--text-primary)",
  },
  tagLabel: {
    fontFamily: "var(--font-serif)",
    fontSize: "0.82rem",
  },
  tagBadge: {
    fontSize: "0.55rem",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
    marginLeft: "0.15rem",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "1rem",
    lineHeight: 1,
    padding: "0 0.1rem",
    marginLeft: "0.1rem",
    transition: "color 0.15s",
  },
  divider: {
    height: "1px",
    background: "var(--border)",
  },
  addForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  addRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  emojiPicker: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  emojiBtn: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    width: "2rem",
    height: "2rem",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.15s",
  },
  emojiBtnActive: {
    borderColor: "var(--accent)",
    background: "var(--accent-dim)",
  },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    padding: "0.6rem 0.875rem",
    outline: "none",
  },
  addBtn: {
    background: "var(--accent)",
    color: "#000",
    border: "none",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    padding: "0.6rem 1rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
  addBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
};
