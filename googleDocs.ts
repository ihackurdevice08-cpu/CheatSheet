// app/dashboard/settings/page.tsx
// TagManager 컴포넌트 — 사용자 커스텀 태그 추가/삭제 UI
// Sprint 2에서 TagManager.tsx 컴포넌트와 함께 구현 예정

export default function SettingsPage() {
  return (
    <main style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
      <p className="mono accent" style={{ fontSize: "0.75rem", letterSpacing: "0.15em" }}>
        SETTINGS / TAG MANAGER
      </p>
      <h2 style={{ marginTop: "0.5rem" }}>감정·상황 태그 관리</h2>
      <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
        Sprint 2에서 TagManager 컴포넌트 구현 예정
      </p>
    </main>
  );
}
