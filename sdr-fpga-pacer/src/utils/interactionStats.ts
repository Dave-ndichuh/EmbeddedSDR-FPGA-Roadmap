import { useEffect, useState } from 'react';
import {
  CONCEPT_CATALOG,
  ConceptCatalogItem,
  CURRICULUM_MODULES,
  EXPLAINER_TO_CONCEPT_ID,
  INTERACTIVE_QUIZZES,
  INTERACTIVE_SIMULATORS,
  ModuleCatalogItem,
  PACER_PHASES,
  PhaseLabel,
  QuizCatalogItem,
  SimulatorCatalogItem,
  VIDEO_LECTURES,
  VideoCatalogItem
} from '@site/src/data/contentCatalog';

export const STATS_STORAGE_KEY = 'sdr-fpga-interaction-stats-v1';
export const PACER_PROGRESS_KEY = 'sdr-fpga-pacer-progress';
export const CODEX_STARRED_KEY = 'sdr-fpga-codex-starred';
const STATS_UPDATED_EVENT = 'sdr-stats-updated';
const MAX_RECENT_EVENTS = 30;

export interface ModuleInteractionStat {
  views: number;
  activeSeconds: number;
  maxScrollPct: number;
  upvotes: number;
  userUpvoted: boolean;
  bookmarked: boolean;
  lastVisitedAt: number;
}

export interface QuizInteractionStat {
  attempts: number;
  passes: number;
  firstTryPasses: number;
  hintsUsed: number;
  lastAttemptAt: number;
}

export interface SimulatorInteractionStat {
  interactions: number;
  lastInteractedAt: number;
}

export interface VideoInteractionStat {
  interactions: number;
  watched: boolean;
  lastInteractedAt: number;
}

export interface ConceptInteractionStat {
  explainerOpens: number;
  derivationsViewed: number;
  copies: number;
  codexViews: number;
  flashcardFlips: number;
  lastInteractedAt: number;
}

export interface InteractionEvent {
  id: string;
  timestamp: number;
  kind: 'module' | 'quiz' | 'simulator' | 'video' | 'concept' | 'pacer';
  label: string;
  detail: string;
  path?: string;
}

export interface InteractionStatsStore {
  version: 1;
  isSampleData: boolean;
  modules: Record<string, ModuleInteractionStat>;
  quizzes: Record<string, QuizInteractionStat>;
  simulators: Record<string, SimulatorInteractionStat>;
  videos: Record<string, VideoInteractionStat>;
  concepts: Record<string, ConceptInteractionStat>;
  recentEvents: InteractionEvent[];
}

export interface RankedModule {
  item: ModuleCatalogItem;
  stat: ModuleInteractionStat;
  score: number;
  rank: number;
  tier: 'Hot' | 'Active' | 'Started' | 'Unexplored';
}

export interface RankedConcept {
  item: ConceptCatalogItem;
  stat: ConceptInteractionStat;
  isStarred: boolean;
  score: number;
  rank: number;
  totalInteractions: number;
}

export interface RankedInteractiveItem {
  id: string;
  category: 'Simulator' | 'Quiz' | 'Video';
  title: string;
  phase: Exclude<PhaseLabel, 'Reference'>;
  modulePath: string;
  interactions: number;
  score: number;
  rank: number;
  metricSummary: string;
  badgeText: string;
  quizMeta?: {
    item: QuizCatalogItem;
    stat: QuizInteractionStat;
    accuracyPct: number | null;
  };
  simulatorMeta?: {
    item: SimulatorCatalogItem;
    stat: SimulatorInteractionStat;
  };
  videoMeta?: {
    item: VideoCatalogItem;
    stat: VideoInteractionStat;
  };
}

export interface RankedPhase {
  phase: Exclude<PhaseLabel, 'Reference'>;
  title: string;
  link: string;
  rank: number;
  score: number;
  pacerCompleted: number;
  pacerTotal: number;
  pacerPct: number;
  modulesVisited: number;
  modulesTotal: number;
  activeSeconds: number;
  quizAttempts: number;
  quizPasses: number;
  quizAccuracyPct: number | null;
  simulatorRuns: number;
}

export interface StatsSummary {
  totalInteractions: number;
  totalActiveSeconds: number;
  modulesVisited: number;
  modulesTotal: number;
  totalModuleUpvotes: number;
  totalBookmarks: number;
  quizAttempts: number;
  quizPasses: number;
  quizAccuracyPct: number | null;
  simulatorRuns: number;
  videosWatched: number;
  videosTotal: number;
  conceptsInteracted: number;
  conceptsTotal: number;
  starredConceptsCount: number;
  pacerCompleted: number;
  pacerTotal: number;
  pacerPct: number;
}

export function createEmptyStore(): InteractionStatsStore {
  return {
    version: 1,
    isSampleData: false,
    modules: {},
    quizzes: {},
    simulators: {},
    videos: {},
    concepts: {},
    recentEvents: []
  };
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadInteractionStats(): InteractionStatsStore {
  if (!isBrowser()) return createEmptyStore();
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as Partial<InteractionStatsStore>;
    return {
      version: 1,
      isSampleData: Boolean(parsed.isSampleData),
      modules: parsed.modules || {},
      quizzes: parsed.quizzes || {},
      simulators: parsed.simulators || {},
      videos: parsed.videos || {},
      concepts: parsed.concepts || {},
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : []
    };
  } catch {
    return createEmptyStore();
  }
}

export function loadPacerProgress(): Record<string, boolean> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(PACER_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function loadStarredConceptIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CODEX_STARRED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStore(store: InteractionStatsStore): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(STATS_UPDATED_EVENT));
  } catch {
    // Ignore quota or storage restriction errors
  }
}

function pushEvent(
  store: InteractionStatsStore,
  event: Omit<InteractionEvent, 'id' | 'timestamp'>
): void {
  const entry: InteractionEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now()
  };
  store.recentEvents = [entry, ...store.recentEvents].slice(0, MAX_RECENT_EVENTS);
}

const defaultModuleStat = (): ModuleInteractionStat => ({
  views: 0,
  activeSeconds: 0,
  maxScrollPct: 0,
  upvotes: 0,
  userUpvoted: false,
  bookmarked: false,
  lastVisitedAt: 0
});

const defaultQuizStat = (): QuizInteractionStat => ({
  attempts: 0,
  passes: 0,
  firstTryPasses: 0,
  hintsUsed: 0,
  lastAttemptAt: 0
});

const defaultSimulatorStat = (): SimulatorInteractionStat => ({
  interactions: 0,
  lastInteractedAt: 0
});

const defaultVideoStat = (): VideoInteractionStat => ({
  interactions: 0,
  watched: false,
  lastInteractedAt: 0
});

const defaultConceptStat = (): ConceptInteractionStat => ({
  explainerOpens: 0,
  derivationsViewed: 0,
  copies: 0,
  codexViews: 0,
  flashcardFlips: 0,
  lastInteractedAt: 0
});

export function recordModuleView(moduleId: string, title: string, path: string): void {
  const store = loadInteractionStats();
  const prev = store.modules[moduleId] || defaultModuleStat();
  store.modules[moduleId] = {
    ...prev,
    views: prev.views + 1,
    lastVisitedAt: Date.now()
  };
  pushEvent(store, {
    kind: 'module',
    label: title,
    detail: `Opened module (view #${prev.views + 1})`,
    path
  });
  saveStore(store);
}

export function recordModuleDwell(moduleId: string, addSeconds: number, scrollPct: number): void {
  if (addSeconds <= 0 && scrollPct <= 0) return;
  const store = loadInteractionStats();
  const prev = store.modules[moduleId] || defaultModuleStat();
  const nextScroll = Math.max(prev.maxScrollPct, Math.min(100, Math.round(scrollPct)));
  const nextSeconds = prev.activeSeconds + Math.max(0, Math.round(addSeconds));
  if (nextScroll === prev.maxScrollPct && nextSeconds === prev.activeSeconds) return;

  store.modules[moduleId] = {
    ...prev,
    activeSeconds: nextSeconds,
    maxScrollPct: nextScroll,
    lastVisitedAt: Date.now()
  };
  saveStore(store);
}

export function toggleModuleUpvote(moduleId: string, title: string, path: string): boolean {
  const store = loadInteractionStats();
  const prev = store.modules[moduleId] || defaultModuleStat();
  const nextUpvoted = !prev.userUpvoted;
  const nextUpvotes = Math.max(0, prev.upvotes + (nextUpvoted ? 1 : -1));
  store.modules[moduleId] = {
    ...prev,
    userUpvoted: nextUpvoted,
    upvotes: nextUpvotes
  };
  if (nextUpvoted) {
    pushEvent(store, {
      kind: 'module',
      label: title,
      detail: 'Marked module as helpful',
      path
    });
  }
  saveStore(store);
  return nextUpvoted;
}

export function toggleModuleBookmark(moduleId: string, title: string, path: string): boolean {
  const store = loadInteractionStats();
  const prev = store.modules[moduleId] || defaultModuleStat();
  const nextBookmarked = !prev.bookmarked;
  store.modules[moduleId] = {
    ...prev,
    bookmarked: nextBookmarked
  };
  if (nextBookmarked) {
    pushEvent(store, {
      kind: 'module',
      label: title,
      detail: 'Bookmarked module for review',
      path
    });
  }
  saveStore(store);
  return nextBookmarked;
}

export function recordQuizHint(quizId: string): void {
  const store = loadInteractionStats();
  const prev = store.quizzes[quizId] || defaultQuizStat();
  store.quizzes[quizId] = {
    ...prev,
    hintsUsed: prev.hintsUsed + 1
  };
  saveStore(store);
}

export function recordQuizAttempt(
  quizId: string,
  isCorrect: boolean,
  usedHint: boolean,
  title: string,
  modulePath?: string
): void {
  const store = loadInteractionStats();
  const prev = store.quizzes[quizId] || defaultQuizStat();
  const isFirstTryPass = isCorrect && prev.attempts === 0 && !usedHint;
  store.quizzes[quizId] = {
    attempts: prev.attempts + 1,
    passes: prev.passes + (isCorrect ? 1 : 0),
    firstTryPasses: prev.firstTryPasses + (isFirstTryPass ? 1 : 0),
    hintsUsed: prev.hintsUsed,
    lastAttemptAt: Date.now()
  };
  pushEvent(store, {
    kind: 'quiz',
    label: title,
    detail: isCorrect ? 'Solved challenge correctly' : 'Attempted challenge (needs review)',
    path: modulePath
  });
  saveStore(store);
}

export function recordSimulatorInteraction(
  simulatorId: string,
  title: string,
  detail: string,
  modulePath?: string
): void {
  const store = loadInteractionStats();
  const prev = store.simulators[simulatorId] || defaultSimulatorStat();
  store.simulators[simulatorId] = {
    interactions: prev.interactions + 1,
    lastInteractedAt: Date.now()
  };
  pushEvent(store, {
    kind: 'simulator',
    label: title,
    detail,
    path: modulePath
  });
  saveStore(store);
}

export function recordVideoInteraction(
  videoId: string,
  title: string,
  detail: string,
  markWatched?: boolean,
  modulePath?: string
): void {
  const store = loadInteractionStats();
  const prev = store.videos[videoId] || defaultVideoStat();
  store.videos[videoId] = {
    interactions: prev.interactions + 1,
    watched: markWatched !== undefined ? markWatched : prev.watched,
    lastInteractedAt: Date.now()
  };
  pushEvent(store, {
    kind: 'video',
    label: title,
    detail,
    path: modulePath
  });
  saveStore(store);
}

export function toggleVideoWatched(
  videoId: string,
  title: string,
  modulePath?: string
): boolean {
  const store = loadInteractionStats();
  const prev = store.videos[videoId] || defaultVideoStat();
  const nextWatched = !prev.watched;
  store.videos[videoId] = {
    interactions: prev.interactions + 1,
    watched: nextWatched,
    lastInteractedAt: Date.now()
  };
  pushEvent(store, {
    kind: 'video',
    label: title,
    detail: nextWatched ? 'Completed video masterclass' : 'Unmarked video completion',
    path: modulePath
  });
  saveStore(store);
  return nextWatched;
}

function toCanonicalConceptId(id: string): string {
  return EXPLAINER_TO_CONCEPT_ID[id] || id;
}

export function recordConceptExplainer(
  rawConceptId: string,
  title: string,
  eventType: 'open' | 'derivation' | 'copy'
): void {
  const conceptId = toCanonicalConceptId(rawConceptId);
  const store = loadInteractionStats();
  const prev = store.concepts[conceptId] || defaultConceptStat();
  store.concepts[conceptId] = {
    ...prev,
    explainerOpens: prev.explainerOpens + (eventType === 'open' ? 1 : 0),
    derivationsViewed: prev.derivationsViewed + (eventType === 'derivation' ? 1 : 0),
    copies: prev.copies + (eventType === 'copy' ? 1 : 0),
    lastInteractedAt: Date.now()
  };
  const detailMap: Record<typeof eventType, string> = {
    open: 'Explained highlighted concept',
    derivation: 'Inspected step-by-step derivation',
    copy: 'Copied concept breakdown'
  };
  pushEvent(store, {
    kind: 'concept',
    label: title,
    detail: detailMap[eventType],
    path: `/glossary#${conceptId}`
  });
  saveStore(store);
}

export function recordCodexInteraction(
  conceptId: string,
  title: string,
  eventType: 'view' | 'flip'
): void {
  const store = loadInteractionStats();
  const prev = store.concepts[conceptId] || defaultConceptStat();
  store.concepts[conceptId] = {
    ...prev,
    codexViews: prev.codexViews + (eventType === 'view' ? 1 : 0),
    flashcardFlips: prev.flashcardFlips + (eventType === 'flip' ? 1 : 0),
    lastInteractedAt: Date.now()
  };
  pushEvent(store, {
    kind: 'concept',
    label: title,
    detail: eventType === 'flip' ? 'Flipped flashcard in Codex' : 'Studied term in Field Codex',
    path: `/glossary#${conceptId}`
  });
  saveStore(store);
}

export function recordPacerTaskEvent(taskText: string, completed: boolean, phaseLink: string): void {
  const store = loadInteractionStats();
  pushEvent(store, {
    kind: 'pacer',
    label: taskText,
    detail: completed ? 'Checked off Pacer milestone' : 'Reopened Pacer milestone',
    path: phaseLink
  });
  saveStore(store);
}

export function computeModuleScore(stat: ModuleInteractionStat): number {
  return (
    stat.views * 10 +
    Math.floor(stat.activeSeconds / 15) * 4 +
    Math.round(stat.maxScrollPct * 0.4) +
    stat.upvotes * 25 +
    (stat.bookmarked ? 20 : 0)
  );
}

export function computeConceptScore(stat: ConceptInteractionStat, isStarred: boolean): number {
  return (
    stat.explainerOpens * 14 +
    stat.derivationsViewed * 18 +
    stat.copies * 10 +
    stat.codexViews * 8 +
    stat.flashcardFlips * 12 +
    (isStarred ? 25 : 0)
  );
}

export function getRankedModules(store: InteractionStatsStore): RankedModule[] {
  const list = CURRICULUM_MODULES.map((item) => {
    const stat = store.modules[item.id] || defaultModuleStat();
    const score = computeModuleScore(stat);
    let tier: RankedModule['tier'] = 'Unexplored';
    if (score >= 80) tier = 'Hot';
    else if (score >= 30) tier = 'Active';
    else if (score > 0) tier = 'Started';
    return { item, stat, score, rank: 0, tier };
  });

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.stat.views !== a.stat.views) return b.stat.views - a.stat.views;
    return a.item.title.localeCompare(b.item.title);
  });

  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

export function getRankedConcepts(
  store: InteractionStatsStore,
  starredIds: string[]
): RankedConcept[] {
  const starredSet = new Set(starredIds);
  const list = CONCEPT_CATALOG.map((item) => {
    const stat = store.concepts[item.id] || defaultConceptStat();
    const isStarred = starredSet.has(item.id);
    const totalInteractions =
      stat.explainerOpens +
      stat.derivationsViewed +
      stat.copies +
      stat.codexViews +
      stat.flashcardFlips +
      (isStarred ? 1 : 0);
    const score = computeConceptScore(stat, isStarred);
    return { item, stat, isStarred, score, rank: 0, totalInteractions };
  });

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.totalInteractions !== a.totalInteractions) return b.totalInteractions - a.totalInteractions;
    return a.item.title.localeCompare(b.item.title);
  });

  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

export function getRankedInteractiveItems(store: InteractionStatsStore): RankedInteractiveItem[] {
  const items: Omit<RankedInteractiveItem, 'rank'>[] = [];

  for (const sim of INTERACTIVE_SIMULATORS) {
    const stat = store.simulators[sim.id] || defaultSimulatorStat();
    const score = stat.interactions * 12;
    items.push({
      id: sim.id,
      category: 'Simulator',
      title: sim.title,
      phase: sim.phase,
      modulePath: sim.modulePath,
      interactions: stat.interactions,
      score,
      metricSummary: `${stat.interactions} parameter runs`,
      badgeText: stat.interactions >= 5 ? 'Lab Favorite' : stat.interactions > 0 ? 'Active Lab' : 'Untested',
      simulatorMeta: { item: sim, stat }
    });
  }

  for (const quiz of INTERACTIVE_QUIZZES) {
    const stat = store.quizzes[quiz.id] || defaultQuizStat();
    const accuracyPct = stat.attempts > 0 ? Math.round((stat.passes / stat.attempts) * 100) : null;
    const score = stat.attempts * 15 + stat.passes * 20 + stat.firstTryPasses * 10;
    let badgeText = 'Untried';
    if (stat.attempts > 0) {
      if (accuracyPct !== null && accuracyPct < 60) badgeText = 'Tough Challenge';
      else if (stat.passes > 0) badgeText = 'Mastered';
      else badgeText = 'In Progress';
    }
    items.push({
      id: quiz.id,
      category: 'Quiz',
      title: quiz.title,
      phase: quiz.phase,
      modulePath: quiz.modulePath,
      interactions: stat.attempts,
      score,
      metricSummary:
        stat.attempts > 0
          ? `${stat.passes}/${stat.attempts} passed (${accuracyPct}%)`
          : '0 attempts yet',
      badgeText,
      quizMeta: { item: quiz, stat, accuracyPct }
    });
  }

  for (const video of VIDEO_LECTURES) {
    const stat = store.videos[video.id] || defaultVideoStat();
    const score = stat.interactions * 15 + (stat.watched ? 40 : 0);
    items.push({
      id: video.id,
      category: 'Video',
      title: video.title,
      phase: video.phase,
      modulePath: video.modulePath,
      interactions: stat.interactions + (stat.watched ? 1 : 0),
      score,
      metricSummary: stat.watched
        ? `Watched (${stat.interactions} interactions)`
        : `${stat.interactions} interactions`,
      badgeText: stat.watched ? 'Watched' : stat.interactions > 0 ? 'Started' : 'Unwatched',
      videoMeta: { item: video, stat }
    });
  }

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.interactions !== a.interactions) return b.interactions - a.interactions;
    return a.title.localeCompare(b.title);
  });

  return items.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export function getPhaseRankings(
  store: InteractionStatsStore,
  pacerProgress: Record<string, boolean>
): RankedPhase[] {
  const ranked = PACER_PHASES.map((phaseDef) => {
    const label = phaseDef.phaseLabel;
    const pacerTotal = phaseDef.tasks.length;
    const pacerCompleted = phaseDef.tasks.filter((t) => Boolean(pacerProgress[t.id])).length;
    const pacerPct = pacerTotal > 0 ? Math.round((pacerCompleted / pacerTotal) * 100) : 0;

    const phaseModules = CURRICULUM_MODULES.filter((m) => m.phase === label);
    let modulesVisited = 0;
    let activeSeconds = 0;
    let moduleScoreSum = 0;
    for (const mod of phaseModules) {
      const stat = store.modules[mod.id];
      if (stat && stat.views > 0) modulesVisited += 1;
      if (stat) {
        activeSeconds += stat.activeSeconds;
        moduleScoreSum += computeModuleScore(stat);
      }
    }

    const phaseQuizzes = INTERACTIVE_QUIZZES.filter((q) => q.phase === label);
    let quizAttempts = 0;
    let quizPasses = 0;
    for (const q of phaseQuizzes) {
      const stat = store.quizzes[q.id];
      if (stat) {
        quizAttempts += stat.attempts;
        quizPasses += stat.passes;
      }
    }
    const quizAccuracyPct = quizAttempts > 0 ? Math.round((quizPasses / quizAttempts) * 100) : null;

    const phaseSims = INTERACTIVE_SIMULATORS.filter((s) => s.phase === label);
    const simulatorRuns = phaseSims.reduce(
      (sum, s) => sum + (store.simulators[s.id]?.interactions || 0),
      0
    );

    const score =
      pacerPct * 2 +
      moduleScoreSum +
      quizPasses * 20 +
      simulatorRuns * 10;

    return {
      phase: label,
      title: phaseDef.title,
      link: phaseDef.link,
      rank: 0,
      score,
      pacerCompleted,
      pacerTotal,
      pacerPct,
      modulesVisited,
      modulesTotal: phaseModules.length,
      activeSeconds,
      quizAttempts,
      quizPasses,
      quizAccuracyPct,
      simulatorRuns
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.pacerPct - a.pacerPct;
  });

  return ranked.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export function getStatsSummary(
  store: InteractionStatsStore,
  pacerProgress: Record<string, boolean>,
  starredIds: string[]
): StatsSummary {
  const modulesValues = Object.values(store.modules);
  const totalModuleViews = modulesValues.reduce((s, m) => s + m.views, 0);
  const totalActiveSeconds = modulesValues.reduce((s, m) => s + m.activeSeconds, 0);
  const totalModuleUpvotes = modulesValues.reduce((s, m) => s + m.upvotes, 0);
  const totalBookmarks = modulesValues.filter((m) => m.bookmarked).length;
  const modulesVisited = CURRICULUM_MODULES.filter((m) => (store.modules[m.id]?.views || 0) > 0).length;

  const quizValues = Object.values(store.quizzes);
  const quizAttempts = quizValues.reduce((s, q) => s + q.attempts, 0);
  const quizPasses = quizValues.reduce((s, q) => s + q.passes, 0);
  const quizAccuracyPct = quizAttempts > 0 ? Math.round((quizPasses / quizAttempts) * 100) : null;

  const simulatorRuns = Object.values(store.simulators).reduce((s, sim) => s + sim.interactions, 0);
  const videosWatched = VIDEO_LECTURES.filter((v) => store.videos[v.id]?.watched).length;
  const videoInteractions = Object.values(store.videos).reduce((s, v) => s + v.interactions, 0);

  const conceptValues = Object.values(store.concepts);
  const conceptActions = conceptValues.reduce(
    (s, c) => s + c.explainerOpens + c.derivationsViewed + c.copies + c.codexViews + c.flashcardFlips,
    0
  );
  const conceptsInteracted = CONCEPT_CATALOG.filter((c) => {
    const st = store.concepts[c.id];
    const hasStat =
      st &&
      st.explainerOpens + st.derivationsViewed + st.copies + st.codexViews + st.flashcardFlips > 0;
    return Boolean(hasStat) || starredIds.includes(c.id);
  }).length;

  const pacerTotal = PACER_PHASES.reduce((s, p) => s + p.tasks.length, 0);
  const pacerCompleted = PACER_PHASES.reduce(
    (s, p) => s + p.tasks.filter((t) => Boolean(pacerProgress[t.id])).length,
    0
  );
  const pacerPct = pacerTotal > 0 ? Math.round((pacerCompleted / pacerTotal) * 100) : 0;

  const totalInteractions =
    totalModuleViews +
    totalModuleUpvotes +
    totalBookmarks +
    quizAttempts +
    simulatorRuns +
    videoInteractions +
    conceptActions +
    starredIds.length;

  return {
    totalInteractions,
    totalActiveSeconds,
    modulesVisited,
    modulesTotal: CURRICULUM_MODULES.length,
    totalModuleUpvotes,
    totalBookmarks,
    quizAttempts,
    quizPasses,
    quizAccuracyPct,
    simulatorRuns,
    videosWatched,
    videosTotal: VIDEO_LECTURES.length,
    conceptsInteracted,
    conceptsTotal: CONCEPT_CATALOG.length,
    starredConceptsCount: starredIds.length,
    pacerCompleted,
    pacerTotal,
    pacerPct
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

export function resetInteractionStats(): void {
  saveStore(createEmptyStore());
}

export function loadSampleInteractionStats(): void {
  const now = Date.now();
  const sample: InteractionStatsStore = {
    version: 1,
    isSampleData: true,
    modules: {
      'phase-1-dsp-theory': {
        views: 9,
        activeSeconds: 420,
        maxScrollPct: 100,
        upvotes: 4,
        userUpvoted: true,
        bookmarked: true,
        lastVisitedAt: now - 1000 * 60 * 12
      },
      'phase-2-verilog-paradigms': {
        views: 7,
        activeSeconds: 315,
        maxScrollPct: 95,
        upvotes: 3,
        userUpvoted: true,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 45
      },
      'phase-4-soc-integration': {
        views: 6,
        activeSeconds: 260,
        maxScrollPct: 100,
        upvotes: 3,
        userUpvoted: false,
        bookmarked: true,
        lastVisitedAt: now - 1000 * 60 * 90
      },
      'phase-3-hardware-fir': {
        views: 5,
        activeSeconds: 245,
        maxScrollPct: 88,
        upvotes: 2,
        userUpvoted: true,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 140
      },
      'phase-3-fixed-point-math': {
        views: 4,
        activeSeconds: 185,
        maxScrollPct: 80,
        upvotes: 2,
        userUpvoted: false,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 210
      },
      'interactive-field-codex': {
        views: 5,
        activeSeconds: 210,
        maxScrollPct: 75,
        upvotes: 1,
        userUpvoted: false,
        bookmarked: true,
        lastVisitedAt: now - 1000 * 60 * 25
      },
      'phase-1-python-sdr': {
        views: 3,
        activeSeconds: 130,
        maxScrollPct: 70,
        upvotes: 1,
        userUpvoted: false,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 300
      },
      'phase-3-dds-nco': {
        views: 3,
        activeSeconds: 145,
        maxScrollPct: 65,
        upvotes: 1,
        userUpvoted: false,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 360
      },
      'phase-2-verilator-lab': {
        views: 2,
        activeSeconds: 95,
        maxScrollPct: 60,
        upvotes: 0,
        userUpvoted: false,
        bookmarked: false,
        lastVisitedAt: now - 1000 * 60 * 420
      }
    },
    quizzes: {
      'quiz-apparent-alias-frequency': {
        attempts: 5,
        passes: 4,
        firstTryPasses: 1,
        hintsUsed: 1,
        lastAttemptAt: now - 1000 * 60 * 18
      },
      'quiz-quadrature-sampling': {
        attempts: 3,
        passes: 3,
        firstTryPasses: 1,
        hintsUsed: 0,
        lastAttemptAt: now - 1000 * 60 * 22
      },
      'quiz-inadvertent-latch-trap': {
        attempts: 4,
        passes: 2,
        firstTryPasses: 0,
        hintsUsed: 2,
        lastAttemptAt: now - 1000 * 60 * 50
      },
      'quiz-shift-register-bug': {
        attempts: 2,
        passes: 2,
        firstTryPasses: 1,
        hintsUsed: 0,
        lastAttemptAt: now - 1000 * 60 * 55
      },
      'quiz-transposed-fir-critical-path': {
        attempts: 3,
        passes: 2,
        firstTryPasses: 1,
        hintsUsed: 1,
        lastAttemptAt: now - 1000 * 60 * 145
      },
      'quiz-axi-stream-protocol-compliance': {
        attempts: 2,
        passes: 2,
        firstTryPasses: 1,
        hintsUsed: 0,
        lastAttemptAt: now - 1000 * 60 * 95
      }
    },
    simulators: {
      'nyquist-simulator': { interactions: 14, lastInteractedAt: now - 1000 * 60 * 14 },
      'iq-simulator': { interactions: 11, lastInteractedAt: now - 1000 * 60 * 16 },
      'axi-stream-visualizer': { interactions: 9, lastInteractedAt: now - 1000 * 60 * 92 }
    },
    videos: {
      'video-5u_eXN1pD7k': { interactions: 3, watched: true, lastInteractedAt: now - 1000 * 60 * 20 },
      'video-xK3k3gX8D0g': { interactions: 2, watched: true, lastInteractedAt: now - 1000 * 60 * 60 },
      'video-vQ8gNqX_n2Y': { interactions: 1, watched: false, lastInteractedAt: now - 1000 * 60 * 100 }
    },
    concepts: {
      'nyquist-aliasing': {
        explainerOpens: 4,
        derivationsViewed: 3,
        copies: 1,
        codexViews: 3,
        flashcardFlips: 4,
        lastInteractedAt: now - 1000 * 60 * 15
      },
      'axi4-stream': {
        explainerOpens: 3,
        derivationsViewed: 2,
        copies: 1,
        codexViews: 2,
        flashcardFlips: 3,
        lastInteractedAt: now - 1000 * 60 * 93
      },
      'iq-sampling': {
        explainerOpens: 3,
        derivationsViewed: 2,
        copies: 0,
        codexViews: 2,
        flashcardFlips: 2,
        lastInteractedAt: now - 1000 * 60 * 24
      },
      'fixed-point-q': {
        explainerOpens: 2,
        derivationsViewed: 2,
        copies: 1,
        codexViews: 2,
        flashcardFlips: 1,
        lastInteractedAt: now - 1000 * 60 * 215
      },
      'transposed-fir': {
        explainerOpens: 2,
        derivationsViewed: 1,
        copies: 0,
        codexViews: 2,
        flashcardFlips: 2,
        lastInteractedAt: now - 1000 * 60 * 150
      },
      'inferred-latch': {
        explainerOpens: 2,
        derivationsViewed: 0,
        copies: 0,
        codexViews: 1,
        flashcardFlips: 2,
        lastInteractedAt: now - 1000 * 60 * 52
      }
    },
    recentEvents: [
      {
        id: 'sample-1',
        timestamp: now - 1000 * 60 * 12,
        kind: 'module',
        label: 'Core DSP Theory & Sampling',
        detail: 'Marked module as helpful',
        path: '/docs/Phase-1/DSP-Theory'
      },
      {
        id: 'sample-2',
        timestamp: now - 1000 * 60 * 14,
        kind: 'simulator',
        label: 'Nyquist & Aliasing Time-Domain Simulator',
        detail: 'Adjusted sampling rate & AAF toggle',
        path: '/docs/Phase-1/DSP-Theory'
      },
      {
        id: 'sample-3',
        timestamp: now - 1000 * 60 * 18,
        kind: 'quiz',
        label: 'Challenge 1: Apparent Alias Frequency',
        detail: 'Solved challenge correctly',
        path: '/docs/Phase-1/DSP-Theory'
      },
      {
        id: 'sample-4',
        timestamp: now - 1000 * 60 * 25,
        kind: 'concept',
        label: 'Nyquist-Shannon Sampling & Aliasing',
        detail: 'Inspected step-by-step derivation',
        path: '/glossary#nyquist-aliasing'
      },
      {
        id: 'sample-5',
        timestamp: now - 1000 * 60 * 92,
        kind: 'simulator',
        label: 'AXI4-Stream Bus Handshake Engine',
        detail: 'Stepped posedge ACLK handshake',
        path: '/docs/Phase-4'
      }
    ]
  };
  saveStore(sample);
}

export function useInteractionStats(): {
  stats: InteractionStatsStore;
  pacerProgress: Record<string, boolean>;
  starredIds: string[];
} {
  const [stats, setStats] = useState<InteractionStatsStore>(() => loadInteractionStats());
  const [pacerProgress, setPacerProgress] = useState<Record<string, boolean>>(() =>
    loadPacerProgress()
  );
  const [starredIds, setStarredIds] = useState<string[]>(() => loadStarredConceptIds());

  useEffect(() => {
    const sync = () => {
      setStats(loadInteractionStats());
      setPacerProgress(loadPacerProgress());
      setStarredIds(loadStarredConceptIds());
    };
    sync();
    window.addEventListener(STATS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(STATS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { stats, pacerProgress, starredIds };
}
