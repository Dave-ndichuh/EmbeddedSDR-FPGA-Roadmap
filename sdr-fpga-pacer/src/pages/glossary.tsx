import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { GLOSSARY_TERMS } from '@site/src/data/glossaryData';
import {
  getRankedConcepts,
  recordCodexInteraction,
  useInteractionStats
} from '@site/src/utils/interactionStats';
import styles from './glossary.module.css';

const DOMAINS = ['All', 'DSP & RF', 'FPGA & Verilog', 'Fixed-Point Math', 'Bus Protocols & SoC', 'Modulation & Comms', 'Verification & Tools'];
const PHASES = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

export default function FieldCodex(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedPhase, setSelectedPhase] = useState('All Phases');
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { stats } = useInteractionStats();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdr-fpga-codex-starred');
      if (saved) {
        setStarredIds(JSON.parse(saved));
      }
    } catch {
      // Ignore in SSR
    }
  }, []);

  const conceptRankMap = useMemo(() => {
    const ranked = getRankedConcepts(stats, starredIds);
    const map = new Map<string, { rank: number; totalInteractions: number }>();
    for (const r of ranked) {
      map.set(r.item.id, { rank: r.rank, totalInteractions: r.totalInteractions });
    }
    return map;
  }, [stats, starredIds]);

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (starredIds.includes(id)) {
      updated = starredIds.filter(item => item !== id);
    } else {
      updated = [...starredIds, id];
    }
    setStarredIds(updated);
    try {
      localStorage.setItem('sdr-fpga-codex-starred', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sdr-stats-updated'));
    } catch {}
  };

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(item => {
      if (showStarredOnly && !starredIds.includes(item.id)) return false;
      if (selectedDomain !== 'All' && item.domain !== selectedDomain) return false;
      if (selectedPhase !== 'All Phases' && item.phase !== selectedPhase) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const inTerm = item.term.toLowerCase().includes(q);
      const inAliases = item.aliases.some(a => a.toLowerCase().includes(q));
      const inIntuition = item.intuition.toLowerCase().includes(q);
      const inReality = item.reality.toLowerCase().includes(q);
      const inTrap = item.trap.toLowerCase().includes(q);

      return inTerm || inAliases || inIntuition || inReality || inTrap;
    });
  }, [searchTerm, selectedDomain, selectedPhase, showStarredOnly, starredIds]);

  const handleRandomTerm = () => {
    if (filteredTerms.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredTerms.length);
    const targetTerm = filteredTerms[randomIndex];
    recordCodexInteraction(targetTerm.id, targetTerm.term, 'view');
    if (isFlashcardMode) {
      setFlashcardIndex(randomIndex);
      setIsFlipped(false);
    } else {
      const el = document.getElementById(targetTerm.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.borderColor = 'var(--ifm-color-primary)';
        setTimeout(() => {
          el.style.borderColor = '';
        }, 2000);
      }
    }
  };

  const currentFlashcard = filteredTerms[flashcardIndex] || filteredTerms[0];

  return (
    <Layout
      title="SDR & FPGA Field Codex & Thesaurus"
      description="The definitive interactive dictionary, thesaurus, and 2 AM survival guide for SDR, DSP, and FPGA Engineers.">
      <div className={styles.glossaryContainer}>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>SDR &amp; FPGA Field Codex &amp; Thesaurus</h1>
          <p className={styles.heroSubtitle}>
            Translate academic DSP theory, cryptic Verilog paradigms, and high-speed SoC architecture into intuitive mental models, exact hardware specs, and 2 AM war stories.
          </p>
          <div className={styles.heroControls}>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setIsFlashcardMode(!isFlashcardMode);
                setIsFlipped(false);
              }}>
              {isFlashcardMode ? '📖 Switch to Field Guide View' : '🧠 Enter Flashcard Challenge Mode'}
            </button>
            <button className={styles.btnSecondary} onClick={handleRandomTerm}>
              🎲 Pull Random Term
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => setShowStarredOnly(!showStarredOnly)}>
              {showStarredOnly ? '⭐ Show All Terms' : `⭐ My Starred Terms (${starredIds.length})`}
            </button>
            <Link to="/rankings" className={styles.btnSecondary}>
              📊 Concept Rankings
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={styles.searchFilterBar}>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search terms, synonyms, formulas, or gotchas (e.g., AXI-Stream, Aliasing, Qm.n)..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setFlashcardIndex(0);
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className={styles.categoryPill}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px' }}
                value={selectedPhase}
                onChange={e => {
                  setSelectedPhase(e.target.value);
                  setFlashcardIndex(0);
                }}>
                {PHASES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Domain:</span>
            {DOMAINS.map(domain => (
              <button
                key={domain}
                className={`${styles.categoryPill} ${selectedDomain === domain ? styles.categoryPillActive : ''}`}
                onClick={() => {
                  setSelectedDomain(domain);
                  setFlashcardIndex(0);
                }}>
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <span>Showing <strong>{filteredTerms.length}</strong> of <strong>{GLOSSARY_TERMS.length}</strong> engineering concepts</span>
          <span>Mode: <strong>{isFlashcardMode ? 'Active Recall Flashcard' : 'Full Field Guide'}</strong></span>
        </div>

        {/* FLASHCARD MODE */}
        {isFlashcardMode && currentFlashcard && (
          <div className={styles.flashcardContainer}>
            <div
              className={styles.flashcardCard}
              onClick={() => {
                const nextFlipped = !isFlipped;
                setIsFlipped(nextFlipped);
                if (nextFlipped) {
                  recordCodexInteraction(currentFlashcard.id, currentFlashcard.term, 'flip');
                }
              }}>
              <div className={styles.cardHeader}>
                <div className={styles.tagsRow}>
                  <span className={styles.tagDomain}>{currentFlashcard.domain}</span>
                  <span className={styles.tagPhase}>{currentFlashcard.phase}</span>
                </div>
                <button
                  className={`${styles.bookmarkBtn} ${starredIds.includes(currentFlashcard.id) ? styles.bookmarked : ''}`}
                  onClick={(e) => toggleStar(currentFlashcard.id, e)}>
                  ★
                </button>
              </div>

              {!isFlipped ? (
                <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--ifm-color-emphasis-900)' }}>
                    {currentFlashcard.term}
                  </h2>
                  <div className={styles.akaSection} style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                    <span className={styles.akaLabel}>Synonyms / AKA:</span>
                    <span className={styles.akaList}>{currentFlashcard.aliases.join(' • ')}</span>
                  </div>
                  <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '1rem' }}>
                    How would you explain this in plain English, and what is the underlying hardware reality or 2 AM gotcha?
                  </p>
                  <div className={styles.flashcardPromptHint}>
                    👉 Click Card to Flip &amp; Reveal
                  </div>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--ifm-color-primary)' }}>
                    {currentFlashcard.term}
                  </h3>
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle}>💡 The Intuition</div>
                    <div className={styles.intuitionText}>{currentFlashcard.intuition}</div>
                  </div>
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionTitle}>⚙️ Hardware &amp; Math Reality</div>
                    <div className={styles.realityText}>{currentFlashcard.reality}</div>
                  </div>
                  <div className={styles.trapBox}>
                    <div className={styles.trapTitle}>⚠️ 2 AM Gotcha</div>
                    <div>{currentFlashcard.trap}</div>
                  </div>
                  <div className={styles.flashcardPromptHint} style={{ marginTop: '1.5rem' }}>
                    🔄 Click to Flip Back
                  </div>
                </div>
              )}

              <div className={styles.cardFooter}>
                <Link
                  to={currentFlashcard.link}
                  className={styles.phaseLink}
                  onClick={e => {
                    e.stopPropagation();
                    recordCodexInteraction(currentFlashcard.id, currentFlashcard.term, 'view');
                  }}>
                  Deep Dive in {currentFlashcard.phase} →
                </Link>
                <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>
                  Card {flashcardIndex + 1} of {filteredTerms.length}
                </span>
              </div>
            </div>

            <div className={styles.flashcardNav}>
              <button
                className={styles.btnSecondary}
                disabled={flashcardIndex === 0}
                onClick={() => {
                  setFlashcardIndex(Math.max(0, flashcardIndex - 1));
                  setIsFlipped(false);
                }}>
                ← Previous
              </button>
              <button
                className={styles.btnPrimary}
                disabled={flashcardIndex >= filteredTerms.length - 1}
                onClick={() => {
                  setFlashcardIndex(Math.min(filteredTerms.length - 1, flashcardIndex + 1));
                  setIsFlipped(false);
                }}>
                Next Card →
              </button>
            </div>
          </div>
        )}

        {/* FIELD GUIDE GRID MODE */}
        {!isFlashcardMode && (
          <div>
            {filteredTerms.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No engineering terms matched your filter</h3>
                <p>Try clearing your search query or switching domain categories.</p>
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDomain('All');
                    setSelectedPhase('All Phases');
                    setShowStarredOnly(false);
                  }}>
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className={styles.termsGrid}>
                {filteredTerms.map(item => {
                  const isStarred = starredIds.includes(item.id);
                  const conceptRank = conceptRankMap.get(item.id);
                  return (
                    <div key={item.id} id={item.id} className={styles.termCard}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.termName}>{item.term}</h2>
                        <button
                          className={`${styles.bookmarkBtn} ${isStarred ? styles.bookmarked : ''}`}
                          title={isStarred ? 'Remove Bookmark' : 'Bookmark this Term'}
                          onClick={() => toggleStar(item.id)}>
                          ★
                        </button>
                      </div>

                      <div className={styles.tagsRow}>
                        <span className={styles.tagDomain}>{item.domain}</span>
                        <span className={styles.tagPhase}>{item.phase}</span>
                        {conceptRank && conceptRank.totalInteractions > 0 && (
                          <span className={styles.tagPhase}>
                            🏆 #{conceptRank.rank} ({conceptRank.totalInteractions})
                          </span>
                        )}
                      </div>

                      {/* Thesaurus / AKA Section */}
                      <div className={styles.akaSection}>
                        <span className={styles.akaLabel}>AKA / Thesaurus:</span>
                        <span className={styles.akaList}>{item.aliases.join(' • ')}</span>
                      </div>

                      {/* Intuition */}
                      <div className={styles.sectionBlock}>
                        <div className={styles.sectionTitle}>
                          <span>💡</span> The 10-Second Intuition
                        </div>
                        <div className={styles.intuitionText}>{item.intuition}</div>
                      </div>

                      {/* Math & Hardware Spec */}
                      <div className={styles.sectionBlock}>
                        <div className={styles.sectionTitle}>
                          <span>⚙️</span> The Hardware / Math Reality
                        </div>
                        <div className={styles.realityText}>{item.reality}</div>
                      </div>

                      {/* 2 AM War Story Gotcha */}
                      <div className={styles.trapBox}>
                        <div className={styles.trapTitle}>
                          <span>⚠️</span> The 2 AM War Story (Gotcha)
                        </div>
                        <div>{item.trap}</div>
                      </div>

                      {/* Footer */}
                      <div className={styles.cardFooter}>
                        <Link
                          to={item.link}
                          className={styles.phaseLink}
                          onClick={() => recordCodexInteraction(item.id, item.term, 'view')}>
                          Study in {item.phase} →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
