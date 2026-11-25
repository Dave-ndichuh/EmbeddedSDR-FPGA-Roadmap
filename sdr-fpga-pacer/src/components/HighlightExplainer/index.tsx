import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import katex from 'katex';
import { findExplanation, ExplanationItem } from '@site/src/data/explainerData';
import styles from './styles.module.css';

function renderMath(formula?: string, displayMode: boolean = true): string {
  if (!formula) return '';
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false
    });
  } catch (e) {
    return `<code>${formula}</code>`;
  }
}

export default function HighlightExplainer(): JSX.Element | null {
  const [selectedText, setSelectedText] = useState<string>('');
  const [triggerPos, setTriggerPos] = useState<{ x: number; y: number } | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'simplified' | 'derivation' | 'hardware'>('simplified');
  const [explanation, setExplanation] = useState<ExplanationItem | null>(null);
  const [customSearch, setCustomSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Selection detection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the modal or trigger, do nothing
      if (
        (modalRef.current && modalRef.current.contains(e.target as Node)) ||
        (triggerRef.current && triggerRef.current.contains(e.target as Node))
      ) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (!isPinned && !isOpen) {
          setTriggerPos(null);
        }
        return;
      }

      const text = selection.toString().trim();
      if (text.length >= 2 && text.length <= 250) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          setSelectedText(text);
          setCustomSearch(text);

          const found = findExplanation(text);
          setExplanation(found);

          if (found?.derivation && (text.includes('=') || text.includes('>') || text.includes('<') || text.includes('\\') || found.type === 'formula')) {
            setActiveTab('derivation');
          } else {
            setActiveTab('simplified');
          }

          setTriggerPos({
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY
          });
        }
      } else {
        if (!isPinned && !isOpen) {
          setTriggerPos(null);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setTriggerPos(null);
        setIsPinned(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, [isPinned, isOpen]);

  const handleOpenModal = () => {
    setIsOpen(true);
    setTriggerPos(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTriggerPos(null);
    setIsPinned(false);
  };

  const handleSearchChange = (val: string) => {
    setCustomSearch(val);
    const found = findExplanation(val);
    setExplanation(found);
  };

  const handleCopy = () => {
    if (!explanation) return;
    const textToCopy = `${explanation.title}\n\n[Simplified]: ${explanation.simplified}\n\n[Hardware Reality]: ${explanation.hardwareReality}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* 1. FLOATING ACTION TRIGGER PILL */}
      {triggerPos && !isOpen && (
        <button
          ref={triggerRef}
          className={styles.floatingTrigger}
          style={{
            left: `${Math.max(100, Math.min(window.innerWidth - 100, triggerPos.x))}px`,
            top: `${triggerPos.y}px`
          }}
          onClick={handleOpenModal}
          title="Click to explain or view mathematical derivation">
          <span className={styles.triggerIcon}>⚡</span>
          <span>{explanation?.derivation ? 'Derive & Explain' : 'Explain Concept'}</span>
        </button>
      )}

      {/* 2. EXPANDED EXPLANATION & DERIVATION MODAL */}
      {isOpen && (
        <div
          ref={modalRef}
          className={styles.explainerModal}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.titleArea}>
              <div className={styles.selectedQuote} title={selectedText}>
                <span>Selected:</span>
                <em>"{selectedText}"</em>
              </div>
              <h3 className={styles.modalTitle}>
                {explanation ? explanation.title : `Concept Breakdown: "${selectedText}"`}
              </h3>
              <div className={styles.badgeRow}>
                {explanation && (
                  <span className={`${styles.badge} ${
                    explanation.type === 'formula' ? styles.badgeFormula :
                    explanation.type === 'hardware' ? styles.badgeHardware :
                    explanation.type === 'protocol' ? styles.badgeProtocol :
                    styles.badgeConcept
                  }`}>
                    {explanation.type === 'formula' ? '📐 Formula & Proof' :
                     explanation.type === 'hardware' ? '⚡ FPGA Hardware' :
                     explanation.type === 'protocol' ? '🔌 Bus Protocol' : '💡 Core Concept'}
                  </span>
                )}
                {explanation?.derivation && (
                  <span className={`${styles.badge} ${styles.badgeFormula}`}>
                    Step-by-Step Derivation Available
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.headerActions}>
              <button
                className={styles.iconBtn}
                title={isPinned ? 'Unpin popup' : 'Pin popup to keep open'}
                onClick={() => setIsPinned(!isPinned)}
                style={{ color: isPinned ? 'var(--ifm-color-primary)' : undefined }}>
                📌
              </button>
              <button
                className={styles.iconBtn}
                title={copied ? 'Copied!' : 'Copy Explanation'}
                onClick={handleCopy}>
                {copied ? '✅' : '📋'}
              </button>
              <button
                className={styles.iconBtn}
                title="Close (Esc)"
                onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation Bar */}
          <div className={styles.tabsBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'simplified' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('simplified')}>
              <span>💡</span> Simplified (ELIF)
            </button>

            {explanation?.derivation && (
              <button
                className={`${styles.tabBtn} ${activeTab === 'derivation' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('derivation')}>
                <span>📐</span> Mathematical Derivation & Proof
              </button>
            )}

            <button
              className={`${styles.tabBtn} ${activeTab === 'hardware' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('hardware')}>
              <span>⚙️</span> Hardware Reality & Gotchas
            </button>
          </div>

          {/* Modal Body */}
          <div className={styles.modalBody}>
            {/* Quick Refine Search */}
            <input
              type="text"
              className={styles.customSearchInput}
              placeholder="Refine search or lookup formula (e.g. Nyquist, Q1.15, TVALID, DDS)..."
              value={customSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />

            {explanation ? (
              <div>
                {/* Hero Formula Display if formula exists */}
                {explanation.formula && (
                  <div
                    className={styles.formulaHero}
                    dangerouslySetInnerHTML={{ __html: renderMath(explanation.formula, true) }}
                  />
                )}

                {/* TAB 1: SIMPLIFIED */}
                {activeTab === 'simplified' && (
                  <div>
                    <p style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                      {explanation.simplified}
                    </p>
                    <div style={{ background: 'var(--ifm-background-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                      <strong style={{ color: 'var(--ifm-color-primary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                        🧠 Mental Model Rule of Thumb:
                      </strong>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                        {explanation.hardwareReality}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: MATHEMATICAL DERIVATION */}
                {activeTab === 'derivation' && explanation.derivation && (
                  <div>
                    <div style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'var(--ifm-color-emphasis-700)' }}>
                      {explanation.derivation.overview}
                    </div>

                    {explanation.derivation.steps.map((step, idx) => (
                      <div key={idx} className={styles.derivationStep}>
                        <div className={styles.stepLabel}>{step.label}</div>
                        {step.math && (
                          <div
                            className={styles.stepMath}
                            dangerouslySetInnerHTML={{ __html: renderMath(step.math, true) }}
                          />
                        )}
                        <div className={styles.stepDesc}>{step.desc}</div>
                      </div>
                    ))}

                    <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--ifm-color-primary)' }}>
                      <strong>Conclusion: </strong>
                      <span>{explanation.derivation.conclusion}</span>
                    </div>
                  </div>
                )}

                {/* TAB 3: HARDWARE REALITY & GOTCHAS */}
                {activeTab === 'hardware' && (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: 'var(--ifm-color-emphasis-900)' }}>
                        🛠️ RTL & Silicon Implementation:
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.92rem' }}>
                        {explanation.hardwareReality}
                      </p>
                    </div>

                    <div className={styles.trapCallout}>
                      <div className={styles.trapTitle}>
                        <span>⚠️</span> The 2 AM Lab Trap / Gotcha:
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        {explanation.gotcha}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p>
                  No exact pre-compiled derivation found for <strong>"{customSearch}"</strong>.
                </p>
                <div style={{ background: 'var(--ifm-background-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    💡 <strong>Tip:</strong> Try selecting the core formula name or abbreviation (e.g. <code>Nyquist</code>, <code>Aliasing</code>, <code>IQ</code>, <code>DDS</code>, <code>Q1.15</code>, <code>AXI-Stream</code>, <code>FIR</code>, <code>CORDIC</code>, <code>STA</code>, <code>Slack</code>, or <code>Latches</code>).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            {explanation ? (
              <Link to={explanation.relatedLink} className={styles.footerLink} onClick={handleClose}>
                Read full module in Curriculum →
              </Link>
            ) : (
              <Link to="/glossary" className={styles.footerLink} onClick={handleClose}>
                Browse all terms in Field Codex & Thesaurus →
              </Link>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-500)' }}>
              Press <strong>Esc</strong> to close
            </span>
          </div>
        </div>
      )}
    </>
  );
}
