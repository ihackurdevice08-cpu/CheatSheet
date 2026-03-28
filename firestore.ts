// app/dashboard/page.tsx
// Sprint 2에서 TriggerBoard, CheatCodeCard, ActionChecklist 구현 예정
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
      <p className="mono accent" style={{ fontSize: "0.75rem", letterSpacing: "0.15em" }}>
        DASHBOARD — SPRINT 2 구현 예정
      </p>
      <h1 style={{ marginTop: "0.5rem", fontSize: "1.75rem" }}>
        안녕하세요, {session.user?.name?.split(" ")[0]}
      </h1>
    </main>
  );
}
