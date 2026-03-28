// app/admin/page.tsx
// CheatCode 수동 적재 폼 — Admin 전용
// Sprint 2에서 구현 예정

export default function AdminPage() {
  return (
    <main style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
      <p className="mono accent" style={{ fontSize: "0.75rem", letterSpacing: "0.15em" }}>
        ADMIN / KNOWLEDGE INGESTION
      </p>
      <h2 style={{ marginTop: "0.5rem" }}>CheatCode 적재</h2>
      <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
        Sprint 2에서 구현 예정
      </p>
    </main>
  );
}
