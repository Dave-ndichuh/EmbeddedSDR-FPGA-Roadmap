import React, { useState, useEffect, useMemo } from 'react';
import Link from '@docusaurus/Link';
import { PACER_PHASES } from '@site/src/data/contentCatalog';
import {
  formatDuration,
  getRankedConcepts,
  getRankedModules,
  getStatsSummary,
  PACER_PROGRESS_KEY,
  recordPacerTaskEvent,
  useInteractionStats
} from '@site/src/utils/interactionStats';
import styles from './styles.module.css';

export default function PacerDashboard(): React.ReactElement {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const { stats, starredIds } = useInteractionStats();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PACER_PROGRESS_KEY);
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch {
      // Ignore in SSR
    }
  }, []);

  const toggleTask = (taskId: string, taskText: string, phaseLink: string) => {
    const nextValue = !progress[taskId];
    const updated = { ...progress, [taskId]: nextValue };
    setProgress(updated);
    try {
      localStorage.setItem(PACER_PROGRESS_KEY, JSON.stringify(updated));
      recordPacerTaskEvent(taskText, nextValue, phaseLink);
    } catch {}
  };

  const calculatePhaseProgress = (tasks: { id: string; text: string }[]) => {
    const completed = tasks.filter(t => progress[t.id]).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const totalTasks = PACER_PHASES.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const totalCompleted = Object.values(progress).filter(Boolean).length;
  const overallProgress = Math.round((totalCompleted / totalTasks) * 100) || 0;

  const summary = useMemo(
    () => getStatsSummary(stats, progress, starredIds),
    [stats, progress, starredIds]
  );

  const topModules = useMemo(
    () => getRankedModules(stats).filter(m => m.score > 0).slice(0, 3),
    [stats]
  );

  const topConcept = useMemo(
    () => getRankedConcepts(stats, starredIds).find(c => c.score > 0) || null,
    [stats, starredIds]
  );

  return (
    <div className={styles.pacerContainer}>
      <div className={styles.pacerHeader}>
        <h1>SDR &amp; FPGA Pacer</h1>
        <p>Overall Curriculum Progress: {overallProgress}%</p>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarFill} style={{ width: `${overallProgress}%`, backgroundColor: 'var(--ifm-color-success)' }}></div>
        </div>
      </div>

      <div className={styles.codexBanner}>
        <div className={styles.codexBannerContent}>
          <h3>📖 The SDR &amp; FPGA Field Codex &amp; Thesaurus</h3>
          <p>
            Demystify cross-disciplinary jargon, master 2 AM war stories, and quiz yourself with interactive flashcards across DSP, HDL, Fixed-Point, and SoC architecture.
          </p>
        </div>
        <Link to="/glossary" className={styles.codexBannerBtn}>
          Explore Codex &amp; Flashcards ⚡
        </Link>
      </div>

      <div className={styles.statsSnapshotCard}>
        <div className={styles.statsSnapshotHeader}>
          <h3>📊 Content Interaction Stats &amp; Top Rankings</h3>
          <Link to="/rankings" className={styles.codexBannerBtn}>
            Open Full Rankings →
          </Link>
        </div>

        <div className={styles.statsKpiRow}>
          <div className={styles.statsKpiBox}>
            <span className={styles.statsKpiVal}>{summary.totalInteractions}</span>
            <span className={styles.statsKpiLabel}>Total Interactions</span>
          </div>
          <div className={styles.statsKpiBox}>
            <span className={styles.statsKpiVal}>{formatDuration(summary.totalActiveSeconds)}</span>
            <span className={styles.statsKpiLabel}>Active Study Time</span>
          </div>
          <div className={styles.statsKpiBox}>
            <span className={styles.statsKpiVal}>
              {summary.quizAccuracyPct !== null ? `${summary.quizAccuracyPct}%` : '—'}
            </span>
            <span className={styles.statsKpiLabel}>
              Quiz Accuracy ({summary.quizPasses}/{summary.quizAttempts})
            </span>
          </div>
          <div className={styles.statsKpiBox}>
            <span className={styles.statsKpiVal}>
              {summary.modulesVisited}/{summary.modulesTotal}
            </span>
            <span className={styles.statsKpiLabel}>Modules Explored</span>
          </div>
        </div>

        {topModules.length > 0 ? (
          <div className={styles.topRankedList}>
            {topModules.map(entry => (
              <div key={entry.item.id} className={styles.topRankedItem}>
                <div>
                  <strong>#{entry.rank}</strong>{' '}
                  <Link to={entry.item.path}>{entry.item.title}</Link>
                </div>
                <span style={{ color: 'var(--ifm-color-emphasis-600)', fontWeight: 600 }}>
                  {entry.score} pts • {entry.stat.views} views
                </span>
              </div>
            ))}
            {topConcept && (
              <div className={styles.topRankedItem}>
                <div>
                  <strong>💡 Top Concept:</strong>{' '}
                  <Link to={topConcept.item.link}>{topConcept.item.title}</Link>
                </div>
                <span style={{ color: 'var(--ifm-color-emphasis-600)', fontWeight: 600 }}>
                  {topConcept.score} pts
                </span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)' }}>
            No interactions recorded yet — open any phase module, run a simulator, or visit <Link to="/rankings">Stats &amp; Rankings</Link> to inspect or preview leaderboards.
          </p>
        )}
      </div>

      {PACER_PHASES.map((phase) => {
        const phaseProgress = calculatePhaseProgress(phase.tasks);
        return (
          <div key={phase.id} className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <h2 className={styles.phaseTitle}>
                <Link to={phase.link}>{phase.title}</Link>
              </h2>
              <span>{phaseProgress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${phaseProgress}%` }}></div>
            </div>
            <ul className={styles.taskList}>
              {phase.tasks.map((task) => (
                <li key={task.id} className={styles.taskItem}>
                  <input
                    type="checkbox"
                    id={task.id}
                    checked={!!progress[task.id]}
                    onChange={() => toggleTask(task.id, task.text, phase.link)}
                  />
                  <label htmlFor={task.id}>{task.text}</label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
