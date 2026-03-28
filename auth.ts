// hooks/useProgress.ts
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Gamification } from "@/types";
import { calcLevel } from "@/types";

const LEVEL_THRESHOLDS = [0, 5, 15, 30, 60];

export function useProgress(uid: string | null) {
  const [gamification, setGamification] = useState<Gamification | null>(null);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setGamification(snap.data().gamification as Gamification);
      }
    });
    return () => unsub();
  }, [uid]);

  const level = gamification ? calcLevel(gamification.totalCompleted) : 1;
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = gamification
    ? ((gamification.totalCompleted - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100
    : 0;

  return {
    gamification,
    level,
    progressPercent: Math.min(progress, 100),
  };
}
