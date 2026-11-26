import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { findModuleByPath, normalizeAppPath } from '@site/src/data/contentCatalog';
import {
  formatDuration,
  getRankedModules,
  recordModuleDwell,
  recordModuleView,
  toggleModuleBookmark,
  toggleModuleUpvote,
  useInteractionStats
} from '@site/src/utils/interactionStats';
import styles from './styles.module.css';

function computeScrollPercent(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
}

export default function InteractionTracker(): React.ReactElement | null {
  const location = useLocation();
  const { stats } = useInteractionStats();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const lastTrackedPathRef = useRef<string | null>(null);

  const normalizedPath = normalizeAppPath(location.pathname);
  const currentModule = useMemo(() => findModuleByPath(normalizedPath), [normalizedPath]);

  // Record view once per route transition
  useEffect(() => {
    if (!currentModule) {
      lastTrackedPathRef.current = null;
      return;
    }
    if (lastTrackedPathRef.current !== currentModule.path) {
      lastTrackedPathRef.current = currentModule.path;
      recordModuleView(currentModule.id, currentModule.title, currentModule.path);
    }
  }, [currentModule]);

  // Track active dwell seconds and max scroll depth
  useEffect(() => {
    if (!currentModule) return;

    let pendingScroll = computeScrollPercent();
    recordModuleDwell(currentModule.id, 0, pendingScroll);

    const handleScroll = () => {
      const pct = computeScrollPercent();
      if (pct > pendingScroll) {
        pendingScroll = pct;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        recordModuleDwell(currentModule.id, 5, pendingScroll);
      }
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearInterval(intervalId);
      recordModuleDwell(currentModule.id, 0, pendingScroll);
    };
  }, [currentModule]);

  const rankedEntry = useMemo(() => {
    if (!currentModule) return null;
    const ranked = getRankedModules(stats);
    return ranked.find((r) => r.item.id === currentModule.id) || null;
  }, [currentModule, stats]);

  if (!currentModule || !rankedEntry) {
    return null;
  }

  const { stat, rank, score } = rankedEntry;

  return (
    <aside className={styles.trackerDock} aria-label="Module interaction stats">
      {!isExpanded ? (
        <button
          type="button"
          className={styles.collapsedPill}
          onClick={() => setIsExpanded(true)}
          title="Open module stats, upvote, and curriculum rank">
          <span>📊</span>
          <span>Rank #{rank}</span>
          <span>•</span>
          <span>👍 {stat.upvotes}</span>
          <span>•</span>
          <span>{stat.maxScrollPct}%</span>
        </button>
      ) : (
        <div className={styles.trackerCard}>
          <div className={styles.cardTop}>
            <span className={styles.rankPill}>
              <span>🏆</span>
              <span>Rank #{rank}</span>
              <span>({score} pts)</span>
            </span>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setIsExpanded(false)}
              title="Minimize">
              ✕
            </button>
          </div>

          <div className={styles.moduleTitle}>{currentModule.title}</div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricValue}>{stat.views}</span>
              <span className={styles.metricLabel}>Views</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricValue}>{formatDuration(stat.activeSeconds)}</span>
              <span className={styles.metricLabel}>Study Time</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricValue}>{stat.maxScrollPct}%</span>
              <span className={styles.metricLabel}>Read</span>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={`${styles.actionBtn} ${stat.userUpvoted ? styles.actionBtnActive : ''}`}
              onClick={() =>
                toggleModuleUpvote(currentModule.id, currentModule.title, currentModule.path)
              }>
              <span>👍</span>
              <span>{stat.userUpvoted ? `Helpful (${stat.upvotes})` : `Helpful (${stat.upvotes})`}</span>
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${stat.bookmarked ? styles.actionBtnActive : ''}`}
              onClick={() =>
                toggleModuleBookmark(currentModule.id, currentModule.title, currentModule.path)
              }>
              <span>{stat.bookmarked ? '🔖' : '📑'}</span>
              <span>{stat.bookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <Link to="/rankings" className={styles.rankingsLink}>
            <span>View Full Stats &amp; Rankings</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
