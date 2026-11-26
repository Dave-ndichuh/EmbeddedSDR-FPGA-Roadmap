import React, { useMemo, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {
  formatDuration,
  getPhaseRankings,
  getRankedConcepts,
  getRankedInteractiveItems,
  getRankedModules,
  getStatsSummary,
  loadSampleInteractionStats,
  resetInteractionStats,
  toggleModuleBookmark,
  toggleModuleUpvote,
  useInteractionStats
} from '@site/src/utils/interactionStats';
import styles from './rankings.module.css';

type TabId = 'modules' | 'concepts' | 'interactive' | 'phases';
type ModuleSortKey = 'score' | 'views' | 'time' | 'upvotes' | 'scroll';

const PHASE_FILTERS = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Reference'] as const;

function medalForRank(rank: number): { label: string; className: string } {
  if (rank === 1) return { label: '🥇 #1', className: `${styles.rankMedal} ${styles.rankGold}` };
  if (rank === 2) return { label: '🥈 #2', className: `${styles.rankMedal} ${styles.rankSilver}` };
  if (rank === 3) return { label: '🥉 #3', className: `${styles.rankMedal} ${styles.rankBronze}` };
  return { label: `#${rank}`, className: styles.rankMedal };
}

function formatTimeAgo(ts: number): string {
  if (!ts) return 'Never';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function RankingsPage(): React.ReactElement {
  const { stats, pacerProgress, starredIds } = useInteractionStats();
  const [activeTab, setActiveTab] = useState<TabId>('modules');
  const [phaseFilter, setPhaseFilter] = useState<string>('All Phases');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleSort, setModuleSort] = useState<ModuleSortKey>('score');
  const [interactiveKindFilter, setInteractiveKindFilter] = useState<'All' | 'Simulator' | 'Quiz' | 'Video'>('All');

  const summary = useMemo(
    () => getStatsSummary(stats, pacerProgress, starredIds),
    [stats, pacerProgress, starredIds]
  );

  const rankedModules = useMemo(() => getRankedModules(stats), [stats]);
  const rankedConcepts = useMemo(
    () => getRankedConcepts(stats, starredIds),
    [stats, starredIds]
  );
  const rankedInteractive = useMemo(() => getRankedInteractiveItems(stats), [stats]);
  const rankedPhases = useMemo(
    () => getPhaseRankings(stats, pacerProgress),
    [stats, pacerProgress]
  );

  const maxModuleScore = Math.max(1, ...rankedModules.map((m) => m.score));
  const maxConceptScore = Math.max(1, ...rankedConcepts.map((c) => c.score));
  const maxInteractiveScore = Math.max(1, ...rankedInteractive.map((i) => i.score));
  const maxPhaseScore = Math.max(1, ...rankedPhases.map((p) => p.score));

  const visibleModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = rankedModules.filter((entry) => {
      if (phaseFilter !== 'All Phases' && entry.item.phase !== phaseFilter) return false;
      if (!q) return true;
      return (
        entry.item.title.toLowerCase().includes(q) ||
        entry.item.phase.toLowerCase().includes(q) ||
        entry.item.kind.toLowerCase().includes(q)
      );
    });

    if (moduleSort === 'score') return filtered;

    return [...filtered].sort((a, b) => {
      if (moduleSort === 'views') return b.stat.views - a.stat.views || b.score - a.score;
      if (moduleSort === 'time') return b.stat.activeSeconds - a.stat.activeSeconds || b.score - a.score;
      if (moduleSort === 'upvotes') return b.stat.upvotes - a.stat.upvotes || b.score - a.score;
      return b.stat.maxScrollPct - a.stat.maxScrollPct || b.score - a.score;
    });
  }, [rankedModules, phaseFilter, searchQuery, moduleSort]);

  const visibleConcepts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedConcepts.filter((entry) => {
      if (phaseFilter !== 'All Phases' && entry.item.phase !== phaseFilter) return false;
      if (!q) return true;
      return (
        entry.item.title.toLowerCase().includes(q) ||
        entry.item.domain.toLowerCase().includes(q) ||
        entry.item.phase.toLowerCase().includes(q)
      );
    });
  }, [rankedConcepts, phaseFilter, searchQuery]);

  const visibleInteractive = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedInteractive.filter((entry) => {
      if (interactiveKindFilter !== 'All' && entry.category !== interactiveKindFilter) return false;
      if (phaseFilter !== 'All Phases' && entry.phase !== phaseFilter) return false;
      if (!q) return true;
      return entry.title.toLowerCase().includes(q) || entry.phase.toLowerCase().includes(q);
    });
  }, [rankedInteractive, interactiveKindFilter, phaseFilter, searchQuery]);

  const handleExportJson = () => {
    if (typeof window === 'undefined') return;
    const payload = {
      exportedAt: new Date().toISOString(),
      summary,
      stats,
      pacerProgress,
      starredIds
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sdr-fpga-interaction-stats.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      title="Content Interaction Stats & Rankings"
      description="Live curriculum telemetry, engagement scores, quiz accuracy, and content rankings for SDR & FPGA Pacer.">
      <div className={styles.rankingsContainer}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Content Interaction Stats &amp; Rankings</h1>
          <p className={styles.heroSubtitle}>
            Live local telemetry across every curriculum module, interactive RF/FPGA simulator, quiz challenge, video masterclass, and Field Codex concept.
          </p>
          <div className={styles.heroControls}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => loadSampleInteractionStats()}>
              ⚡ Load Sample Activity
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleExportJson}>
              📥 Export Stats JSON
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => resetInteractionStats()}>
              🔄 Reset Stats
            </button>
            <Link to="/" className={styles.btnSecondary}>
              ← Back to Pacer
            </Link>
          </div>
        </div>

        {/* Sample Data Notice */}
        {stats.isSampleData && (
          <div className={styles.sampleBanner}>
            <span>
              🧪 <strong>Sample Telemetry Active:</strong> You are viewing a preview dataset so you can explore populated leaderboards right away. Any new interactions you perform continue adding on top, or reset anytime for a clean personal slate.
            </span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => resetInteractionStats()}>
              Clear Sample Data
            </button>
          </div>
        )}

        {/* KPI Overview Grid */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>⚡ Total Interactions</div>
            <div className={styles.kpiValue}>{summary.totalInteractions}</div>
            <div className={styles.kpiSub}>Views, runs, quizzes &amp; lookups</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>⏱️ Active Study Time</div>
            <div className={styles.kpiValue}>{formatDuration(summary.totalActiveSeconds)}</div>
            <div className={styles.kpiSub}>Visible dwell time across docs</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>📚 Modules Explored</div>
            <div className={styles.kpiValue}>
              {summary.modulesVisited}/{summary.modulesTotal}
            </div>
            <div className={styles.kpiSub}>
              {summary.totalModuleUpvotes} helpful upvotes • {summary.totalBookmarks} saved
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>🧠 Quiz Accuracy</div>
            <div className={styles.kpiValue}>
              {summary.quizAccuracyPct !== null ? `${summary.quizAccuracyPct}%` : '—'}
            </div>
            <div className={styles.kpiSub}>
              {summary.quizPasses}/{summary.quizAttempts} attempts passed
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>🎛️ Labs &amp; Lectures</div>
            <div className={styles.kpiValue}>{summary.simulatorRuns} runs</div>
            <div className={styles.kpiSub}>
              {summary.videosWatched}/{summary.videosTotal} video lectures completed
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>💡 Concepts &amp; Pacer</div>
            <div className={styles.kpiValue}>
              {summary.conceptsInteracted}/{summary.conceptsTotal}
            </div>
            <div className={styles.kpiSub}>
              {summary.starredConceptsCount} starred • {summary.pacerPct}% Pacer tasks
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'modules' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('modules')}>
            <span>📚</span> Module Rankings ({rankedModules.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'concepts' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('concepts')}>
            <span>💡</span> Concept &amp; Codex Rankings ({rankedConcepts.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'interactive' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('interactive')}>
            <span>⚡</span> Labs, Quizzes &amp; Videos ({rankedInteractive.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'phases' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('phases')}>
            <span>🏆</span> Phase Leaderboard &amp; Feed
          </button>
        </div>

        {/* Filter Toolbar (for list tabs) */}
        {activeTab !== 'phases' && (
          <div className={styles.filterToolbar}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by title, phase, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className={styles.selectInput}
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}>
                {PHASE_FILTERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'modules' && (
              <div className={styles.filterGroup}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)' }}>
                  Sort by:
                </span>
                <select
                  className={styles.selectInput}
                  value={moduleSort}
                  onChange={(e) => setModuleSort(e.target.value as ModuleSortKey)}>
                  <option value="score">Composite Rank Score</option>
                  <option value="views">Most Viewed</option>
                  <option value="time">Most Study Time</option>
                  <option value="upvotes">Most Helpful Upvotes</option>
                  <option value="scroll">Read Completion %</option>
                </select>
              </div>
            )}

            {activeTab === 'interactive' && (
              <div className={styles.filterGroup}>
                {(['All', 'Simulator', 'Quiz', 'Video'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={`${styles.iconToggleBtn} ${interactiveKindFilter === kind ? styles.iconToggleBtnActive : ''}`}
                    onClick={() => setInteractiveKindFilter(kind)}>
                    {kind}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: MODULES LEADERBOARD */}
        {activeTab === 'modules' && (
          <div className={styles.leaderboardList}>
            {visibleModules.map((entry) => {
              const medal = medalForRank(entry.rank);
              const barWidth = entry.score > 0 ? Math.max(6, Math.round((entry.score / maxModuleScore) * 100)) : 0;
              return (
                <div key={entry.item.id} className={styles.rankRow}>
                  <div className={medal.className}>{medal.label}</div>

                  <div className={styles.itemMain}>
                    <Link to={entry.item.path} className={styles.itemTitleLink}>
                      {entry.item.title}
                    </Link>
                    <div className={styles.badgesRow}>
                      <span className={styles.badgePhase}>{entry.item.phase}</span>
                      <span className={styles.badgeKind}>{entry.item.kind}</span>
                      {entry.item.interactiveTags.map((tag) => (
                        <span key={tag} className={styles.badgeKind}>
                          {tag}
                        </span>
                      ))}
                      {entry.tier === 'Hot' && <span className={styles.badgeTierHot}>🔥 Hot</span>}
                      {entry.tier === 'Active' && <span className={styles.badgeTierActive}>⚡ Active</span>}
                    </div>
                  </div>

                  <div className={styles.metricsColumn}>
                    <div className={styles.metricLine}>
                      <span>👁️ {entry.stat.views} views</span>
                      <span>⏱️ {formatDuration(entry.stat.activeSeconds)}</span>
                      <span>📖 {entry.stat.maxScrollPct}% read</span>
                    </div>
                    <div className={styles.scoreBarWrap}>
                      <div className={styles.scoreBarFill} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>

                  <div className={styles.actionsColumn}>
                    <span className={styles.scorePill}>{entry.score} pts</span>
                    <button
                      type="button"
                      className={`${styles.iconToggleBtn} ${entry.stat.userUpvoted ? styles.iconToggleBtnActive : ''}`}
                      onClick={() =>
                        toggleModuleUpvote(entry.item.id, entry.item.title, entry.item.path)
                      }>
                      👍 {entry.stat.upvotes}
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconToggleBtn} ${entry.stat.bookmarked ? styles.iconToggleBtnActive : ''}`}
                      onClick={() =>
                        toggleModuleBookmark(entry.item.id, entry.item.title, entry.item.path)
                      }
                      title={entry.stat.bookmarked ? 'Remove bookmark' : 'Save module'}>
                      {entry.stat.bookmarked ? '🔖' : '📑'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CONCEPTS & CODEX LEADERBOARD */}
        {activeTab === 'concepts' && (
          <div className={styles.leaderboardList}>
            {visibleConcepts.map((entry) => {
              const medal = medalForRank(entry.rank);
              const barWidth = entry.score > 0 ? Math.max(6, Math.round((entry.score / maxConceptScore) * 100)) : 0;
              return (
                <div key={entry.item.id} className={styles.rankRow}>
                  <div className={medal.className}>{medal.label}</div>

                  <div className={styles.itemMain}>
                    <Link to={entry.item.link} className={styles.itemTitleLink}>
                      {entry.item.title}
                    </Link>
                    <div className={styles.badgesRow}>
                      <span className={styles.badgePhase}>{entry.item.phase}</span>
                      <span className={styles.badgeKind}>{entry.item.domain}</span>
                      {entry.item.hasDerivation && (
                        <span className={styles.badgeTierActive}>📐 Derivation</span>
                      )}
                      {entry.isStarred && <span className={styles.badgeTierHot}>★ Starred</span>}
                    </div>
                  </div>

                  <div className={styles.metricsColumn}>
                    <div className={styles.metricLine}>
                      <span>⚡ {entry.stat.explainerOpens} explainers</span>
                      <span>📐 {entry.stat.derivationsViewed} proofs</span>
                      <span>🧠 {entry.stat.flashcardFlips} flips</span>
                    </div>
                    <div className={styles.scoreBarWrap}>
                      <div className={styles.scoreBarFill} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>

                  <div className={styles.actionsColumn}>
                    <span className={styles.scorePill}>{entry.score} pts</span>
                    <Link to={entry.item.link} className={styles.iconToggleBtn}>
                      Open →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: INTERACTIVE LABS, QUIZZES & VIDEOS */}
        {activeTab === 'interactive' && (
          <div className={styles.leaderboardList}>
            {visibleInteractive.map((entry) => {
              const medal = medalForRank(entry.rank);
              const barWidth = entry.score > 0 ? Math.max(6, Math.round((entry.score / maxInteractiveScore) * 100)) : 0;
              return (
                <div key={entry.id} className={styles.rankRow}>
                  <div className={medal.className}>{medal.label}</div>

                  <div className={styles.itemMain}>
                    <Link to={entry.modulePath} className={styles.itemTitleLink}>
                      {entry.title}
                    </Link>
                    <div className={styles.badgesRow}>
                      <span className={styles.badgePhase}>{entry.phase}</span>
                      <span className={styles.badgeKind}>{entry.category}</span>
                      <span className={entry.badgeText === 'Tough Challenge' ? styles.badgeTierHot : styles.badgeTierActive}>
                        {entry.badgeText}
                      </span>
                    </div>
                  </div>

                  <div className={styles.metricsColumn}>
                    <div className={styles.metricLine}>
                      <span>{entry.metricSummary}</span>
                    </div>
                    <div className={styles.scoreBarWrap}>
                      <div className={styles.scoreBarFill} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>

                  <div className={styles.actionsColumn}>
                    <span className={styles.scorePill}>{entry.score} pts</span>
                    <Link to={entry.modulePath} className={styles.iconToggleBtn}>
                      Launch →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: PHASE LEADERBOARD & RECENT ACTIVITY FEED */}
        {activeTab === 'phases' && (
          <div className={styles.splitGrid}>
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>🏆 Phase Mastery &amp; Engagement Ranking</h2>
              {rankedPhases.map((p) => {
                const barWidth = p.score > 0 ? Math.max(6, Math.round((p.score / maxPhaseScore) * 100)) : 0;
                return (
                  <div key={p.phase} className={styles.phaseRow}>
                    <div className={styles.phaseRowHeader}>
                      <Link to={p.link} className={styles.itemTitleLink} style={{ marginBottom: 0 }}>
                        #{p.rank} {p.title}
                      </Link>
                      <span className={styles.scorePill}>{p.score} pts</span>
                    </div>
                    <div className={styles.metricLine} style={{ marginBottom: '0.5rem' }}>
                      <span>✅ Pacer: {p.pacerCompleted}/{p.pacerTotal} ({p.pacerPct}%)</span>
                      <span>📚 Modules: {p.modulesVisited}/{p.modulesTotal}</span>
                      <span>⏱️ {formatDuration(p.activeSeconds)}</span>
                      {p.quizAccuracyPct !== null && (
                        <span>🧠 Quiz: {p.quizAccuracyPct}%</span>
                      )}
                      {p.simulatorRuns > 0 && <span>🎛️ {p.simulatorRuns} sim runs</span>}
                    </div>
                    <div className={styles.scoreBarWrap}>
                      <div className={styles.scoreBarFill} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>🕒 Recent Activity Feed</h2>
              {stats.recentEvents.length === 0 ? (
                <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.92rem' }}>
                  No interactions logged yet. Explore a curriculum page, answer a quiz, tweak a simulator, or click <strong>Load Sample Activity</strong> above.
                </p>
              ) : (
                <div className={styles.feedList}>
                  {stats.recentEvents.map((ev) => (
                    <div key={ev.id} className={styles.feedItem}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ifm-color-emphasis-900)' }}>
                          {ev.path ? (
                            <Link to={ev.path}>{ev.label}</Link>
                          ) : (
                            ev.label
                          )}
                        </div>
                        <div style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.8rem' }}>
                          {ev.detail}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-500)', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scoring Transparency Footer */}
        <div className={styles.formulaFooter}>
          <strong>How Rankings Are Scored:</strong>{' '}
          <span>
            Modules earn <code>10 pts/view + 4 pts per 15s study + 0.4 × scroll% + 25 pts/upvote + 20 pts if saved</code>.{' '}
            Concepts earn <code>14 pts/explainer + 18 pts/derivation + 12 pts/flashcard flip + 8 pts/codex view + 25 pts if starred</code>.{' '}
            Interactive items combine simulator parameter runs, quiz attempts/passes, and completed masterclasses. All stats persist locally in your browser.
          </span>
        </div>
      </div>
    </Layout>
  );
}
