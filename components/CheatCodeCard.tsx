"use client";

// components/CheatCodeCard.tsx

import type { CheatCode } from "@/types";
import ActionChecklist from "@/components/ActionChecklist";

interface CheatCodeCardProps {
  data: CheatCode;
  index?: number;
  uid: string;
  sessionId: string;
  completedItems?: string[];
}

export default function CheatCodeCard({
  data,
  index = 0,
  uid,
  sessionId,
  completedItems = [],
}: CheatCodeCardProps) {
  const delay = `${index * 0.08}s`;

  return (
    <article
      className="fade-up"
      style={{ ...styles.card, animationDelay: delay }}
    >
      {/* Header */}
      <div style={styles.cardHeader}>
        <div style={styles.figureBlock}>
          <span className="mono" style={styles.figureLabel}>FIGURE</span>
          <h2 style={styles.figureName}>{data.figure}</h2>
        </div>

        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sourceBtn}
          >
            <span style={styles.sourceBtnIcon}>&#9654;</span>
            <span className="mono" style={styles.sourceBtnText}>SOURCE</span>
          </a>
        )}
      </div>

      {/* Accent line */}
      <div style={styles.accentLine} />

      {/* Raw Quote */}
      <blockquote style={styles.quoteBlock}>
        <span style={styles.quoteDecor}>&ldquo;</span>
        <p style={styles.quoteText}>{data.rawQuote}</p>
        <span style={{ ...styles.quoteDecor, ...styles.quoteDecorClose }}>&rdquo;</span>
      </blockquote>

      {/* Tags */}
      <div style={styles.tagRow}>
        {data.tags.map((tag) => (
          <span key={tag} className="mono" style={styles.tagBadge}>
            {tag}
          </span>
        ))}
      </div>

      {/* Action Items — Sprint 3: ActionChecklist */}
      {data.actionItems.length > 0 && (
        <div style={styles.actionSection}>
          <ActionChecklist
            uid={uid}
            sessionId={sessionId}
            items={data.actionItems}
            initialCompleted={completedItems}
          />
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--accent)",
    borderRadius: "var(--radius-lg)",
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },
  figureBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  figureLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.22em",
    color: "var(--text-muted)",
  },
  figureName: {
    fontFamily: "var(--font-serif)",
    fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
    fontWeight: 700,
    color: "var(--accent)",
    lineHeight: 1.2,
  },
  sourceBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0.4rem 0.75rem",
    textDecoration: "none",
    color: "var(--text-secondary)",
    flexShrink: 0,
  },
  sourceBtnIcon: {
    fontSize: "0.65rem",
    color: "var(--accent)",
  },
  sourceBtnText: {
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
  },
  accentLine: {
    height: "1px",
    background: "linear-gradient(90deg, var(--accent) 0%, transparent 100%)",
    opacity: 0.3,
  },
  quoteBlock: {
    position: "relative",
    padding: "0 0.5rem",
  },
  quoteDecor: {
    fontFamily: "Georgia, serif",
    fontSize: "4rem",
    lineHeight: 0,
    color: "var(--accent)",
    opacity: 0.25,
    position: "absolute",
    top: "1.5rem",
    left: "-0.25rem",
    userSelect: "none",
  },
  quoteDecorClose: {
    top: "auto",
    left: "auto",
    bottom: "-1rem",
    right: "0",
  },
  quoteText: {
    fontFamily: "var(--font-serif)",
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    lineHeight: 1.75,
    color: "var(--text-primary)",
    fontWeight: 400,
    letterSpacing: "0.01em",
    paddingLeft: "1rem",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  tagBadge: {
    fontSize: "0.62rem",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0.15rem 0.5rem",
  },
  actionSection: {
    background: "var(--bg-elevated)",
    borderRadius: "var(--radius)",
    padding: "1rem 1.25rem",
  },
};
