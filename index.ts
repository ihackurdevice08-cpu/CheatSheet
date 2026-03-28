// app/(auth)/login/page.tsx
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="fade-up" style={{ textAlign: "center", animationDelay: "0.1s" }}>
        <p className="mono accent" style={{ fontSize: "0.75rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
          MINDSET OS v1.0
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.15,
          }}
        >
          Cheat<span className="accent">Sheet</span>
        </h1>
        <p
          style={{
            marginTop: "1rem",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
          }}
        >
          위인의 사고방식을 주입하라. 지금 당장.
        </p>
      </div>

      <div className="fade-up" style={{ animationDelay: "0.25s" }}>
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            padding: "0.875rem 2rem",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 시작하기
        </button>
      </div>
    </main>
  );
}
