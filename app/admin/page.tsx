"use client";

// app/admin/page.tsx
// 지식 적재 파이프라인 — CheatCode 수동 입력 폼
// Anti-Pattern 준수: rawQuote는 원문 그대로, AI 해석 없음

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { addCheatCode } from "@/lib/firestore";
import TagManager from "@/components/TagManager";
import type { Tag } from "@/types";

const EMPTY_FORM = {
  figure: "",
  rawQuote: "",
  sourceUrl: "",
  actionItemsRaw: "",
  referencesRaw: "",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [activeSection, setActiveSection] = useState<"cheatcode" | "tags">("cheatcode");

  if (status === "loading") return <LoadingScreen />;
  if (!session) {
    redirect("/login");
    return null;
  }

  const uid = session.user?.email ?? "admin";

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(label: string) {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  }

  async function handleSubmit() {
    if (!form.figure.trim() || !form.rawQuote.trim() || selectedTags.length === 0) return;
    setSubmitting(true);
    setResult(null);
    try {
      await addCheatCode({
        figure: form.figure.trim(),
        tags: selectedTags,
        rawQuote: form.rawQuote.trim(),
        sourceUrl: form.sourceUrl.trim(),
        actionItems: form.actionItemsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
        references: form.referencesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      setResult("success");
      setForm(EMPTY_FORM);
      setSelectedTags([]);
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = form.figure.trim() && form.rawQuote.trim() && selectedTags.length > 0;

  return (
    <main style={styles.main}>
      <div style={styles.topBar} className="fade-up">
        <div>
          <p className="mono" style={styles.breadcrumb}>CHEATSHEET / ADMIN</p>
          <h1 style={styles.title}>Knowledge Ingestion</h1>
        </div>
        <div style={styles.tabGroup}>
          {(["cheatcode", "tags"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className="mono"
              style={{ ...styles.tab, ...(activeSection === tab ? styles.tabActive : {}) }}
            >
              {tab === "cheatcode" ? "CHEAT CODE" : "TAG POOL"}
            </button>
          ))}
        </div>
      </div>

      {activeSection === "cheatcode" && (
        <div style={styles.grid} className="fade-up">
          <div style={styles.card}>
            <Field label="FIGURE" required>
              <input
                value={form.figure}
                onChange={(e) => handleChange("figure", e.target.value)}
                placeholder="예: Ray Dalio, Jocko Willink..."
                style={styles.input}
              />
            </Field>
            <Field label="RAW QUOTE" required hint="원문 그대로. 번역/요약 금지.">
              <textarea
                value={form.rawQuote}
                onChange={(e) => handleChange("rawQuote", e.target.value)}
                placeholder='"Pain + Reflection = Progress."'
                rows={4}
                style={{ ...styles.input, ...styles.textarea, resize: "vertical" }}
              />
            </Field>
            <Field label="SOURCE URL" hint="YouTube 링크 or 원문 출처">
              <input
                value={form.sourceUrl}
                onChange={(e) => handleChange("sourceUrl", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={styles.input}
              />
            </Field>
            <Field label="ACTION ITEMS" hint="한 줄에 하나씩 입력">
              <textarea
                value={form.actionItemsRaw}
                onChange={(e) => handleChange("actionItemsRaw", e.target.value)}
                placeholder={"손실 원인 3가지 지금 당장 적기\n10분 안에 반성 메모 작성"}
                rows={3}
                style={{ ...styles.input, ...styles.textarea, resize: "vertical" }}
              />
            </Field>
            <Field label="REFERENCES" hint="한 줄에 하나씩">
              <textarea
                value={form.referencesRaw}
                onChange={(e) => handleChange("referencesRaw", e.target.value)}
                placeholder={"Principles - Ray Dalio\nhttps://..."}
                rows={2}
                style={{ ...styles.input, ...styles.textarea }}
              />
            </Field>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={styles.card}>
              <p className="mono" style={styles.fieldLabel}>
                TAGS <span style={{ color: "var(--danger)" }}>*</span>
              </p>
              <p style={styles.hint}>이 CheatCode가 매핑될 상황/감정 선택</p>
              <div style={styles.tagGrid}>
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag.label);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.label)}
                      style={{ ...styles.tagChip, ...(active ? styles.tagChipActive : {}) }}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
                {allTags.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                    TAG POOL 탭에서 태그를 먼저 등록하세요
                  </p>
                )}
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div style={styles.preview}>
                <p className="mono" style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>SELECTED</p>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {selectedTags.map((t) => (
                    <span key={t} style={styles.selectedBadge}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              style={{ ...styles.submitBtn, ...(!isValid || submitting ? styles.submitBtnDisabled : {}) }}
            >
              {submitting ? "INJECTING..." : "⚡ INJECT TO DB"}
            </button>

            {result === "success" && (
              <div style={{ ...styles.toast, background: "rgba(0,255,136,0.1)", borderColor: "var(--success)" }}>
                <span className="mono" style={{ color: "var(--success)", fontSize: "0.8rem" }}>✓ CHEATCODE INJECTED</span>
              </div>
            )}
            {result === "error" && (
              <div style={{ ...styles.toast, background: "rgba(255,68,68,0.1)", borderColor: "var(--danger)" }}>
                <span className="mono" style={{ color: "var(--danger)", fontSize: "0.8rem" }}>✗ INJECTION FAILED</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "tags" && (
        <div style={{ maxWidth: "560px" }} className="fade-up">
          <TagManager uid={uid} onTagsChange={(tags) => setAllTags(tags)} />
        </div>
      )}
    </main>
  );
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <p className="mono" style={styles.fieldLabel}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </p>
      {hint && <p style={styles.hint}>{hint}</p>}
      {children}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="mono" style={{ color: "var(--text-muted)", letterSpacing: "0.2em" }}>LOADING...</p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { position: "relative", zIndex: 1, minHeight: "100vh", padding: "2rem clamp(1rem, 4vw, 3rem)", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1100px", margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", paddingTop: "1rem" },
  breadcrumb: { fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "0.3rem" },
  title: { fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, color: "var(--text-primary)" },
  tabGroup: { display: "flex", gap: "0.25rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.2rem" },
  tab: { background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "0.7rem", letterSpacing: "0.12em", padding: "0.45rem 0.875rem", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s" },
  tabActive: { background: "var(--accent)", color: "#000", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" },
  card: { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  fieldLabel: { fontSize: "0.65rem", letterSpacing: "0.18em", color: "var(--accent)" },
  hint: { fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "-0.25rem" },
  input: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.82rem", padding: "0.65rem 0.875rem", width: "100%", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" },
  textarea: { lineHeight: 1.7 },
  tagGrid: { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" },
  tagChip: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-secondary)", fontFamily: "var(--font-serif)", fontSize: "0.8rem", padding: "0.3rem 0.65rem", cursor: "pointer", transition: "all 0.15s" },
  tagChipActive: { background: "var(--accent-dim)", border: "1px solid var(--accent)", color: "var(--accent)" },
  preview: { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem" },
  selectedBadge: { background: "var(--accent-dim)", border: "1px solid rgba(200,255,0,0.3)", borderRadius: "var(--radius)", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "0.2rem 0.5rem" },
  submitBtn: { background: "var(--accent)", border: "none", borderRadius: "var(--radius)", color: "#000", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", padding: "0.9rem", cursor: "pointer", width: "100%", transition: "opacity 0.15s" },
  submitBtnDisabled: { opacity: 0.3, cursor: "not-allowed" },
  toast: { border: "1px solid", borderRadius: "var(--radius)", padding: "0.75rem 1rem", textAlign: "center" },
};
