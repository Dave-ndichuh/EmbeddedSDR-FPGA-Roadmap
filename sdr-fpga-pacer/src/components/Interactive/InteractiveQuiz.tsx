import React, { useState } from 'react';
import styles from './styles.module.css';

interface QuizProps {
  title?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export default function InteractiveQuiz({
  title = '🧠 Knowledge Check & Intuition Challenge',
  question,
  options,
  correctIndex,
  explanation,
  hint
}: QuizProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setIsSubmitted(false);
    setShowHint(false);
  };

  const isCorrect = selectedIndex === correctIndex;

  return (
    <div className={styles.quizCard}>
      <div className={styles.cardHeader}>
        <h4 className={styles.cardTitle}>
          <span>💡</span> {title}
        </h4>
        {hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ifm-color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            {showHint ? 'Hide Hint 🔍' : 'Need a Hint? 🔍'}
          </button>
        )}
      </div>

      {showHint && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          borderLeft: '3px solid var(--ifm-color-primary)',
          padding: '0.6rem 0.85rem',
          borderRadius: '4px',
          fontSize: '0.88rem',
          marginBottom: '1rem',
          color: 'var(--ifm-color-emphasis-800)'
        }}>
          <strong>Hint:</strong> {hint}
        </div>
      )}

      <div className={styles.quizQuestion}>{question}</div>

      <div className={styles.quizOptions}>
        {options.map((opt, i) => {
          let optionClass = styles.quizOption;
          if (isSubmitted) {
            if (i === correctIndex) {
              optionClass += ` ${styles.quizOptionCorrect}`;
            } else if (i === selectedIndex) {
              optionClass += ` ${styles.quizOptionIncorrect}`;
            }
          } else if (selectedIndex === i) {
            optionClass += ` ${styles.quizOptionSelected}`;
          }

          return (
            <button
              key={i}
              className={optionClass}
              onClick={() => handleSelect(i)}
              disabled={isSubmitted}>
              <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedIndex === null}
          style={{
            background: selectedIndex !== null ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: selectedIndex !== null ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s ease'
          }}>
          Submit Answer Check
        </button>
      ) : (
        <div>
          <div className={`${styles.quizFeedback} ${isCorrect ? styles.quizFeedbackCorrect : styles.quizFeedbackIncorrect}`}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              {isCorrect ? '🎉 Correct! Excellent intuition.' : '❌ Not quite. Here is the engineering reality:'}
            </div>
            <div>{explanation}</div>
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: '1px solid var(--ifm-color-emphasis-400)',
              color: 'var(--ifm-color-emphasis-800)',
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}>
            Try Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
