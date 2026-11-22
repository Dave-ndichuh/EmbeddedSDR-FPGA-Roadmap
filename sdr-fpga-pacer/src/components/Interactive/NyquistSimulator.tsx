import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

export default function NyquistSimulator(): JSX.Element {
  const [fin, setFin] = useState(15); // Hz
  const [fs, setFs] = useState(40); // Hz
  const [enableAAF, setEnableAAF] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Nyquist calculations
  const nyquistRate = 2 * fin;
  const isNyquistMet = fs > nyquistRate;
  
  // Calculate apparent alias frequency in baseband [0, fs/2]
  const calculateAlias = (f: number, sampling: number) => {
    let k = Math.round(f / sampling);
    let alias = Math.abs(f - k * sampling);
    return alias;
  };

  const aliasFreq = calculateAlias(fin, fs);
  const effectiveAmp = enableAAF && !isNyquistMet ? Math.max(0.05, 1 - (fin - fs/2)/(fin)) : 1.0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const timeSpan = 0.2; // 200 ms displayed
    const scaleY = (height / 2) * 0.75 * effectiveAmp;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += width / 10) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += height / 6) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Center Zero Axis
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // 1. Draw True Analog Signal (Continuous Wave in Cyan/Blue)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const t = (px / width) * timeSpan;
      const val = Math.sin(2 * Math.PI * fin * t);
      const py = centerY - val * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 2. Draw Reconstructed (Alias) Wave if aliasing is present
    if (!isNyquistMet) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let px = 0; px < width; px++) {
        const t = (px / width) * timeSpan;
        // Phase alignment with sampled points
        const val = Math.sin(2 * Math.PI * aliasFreq * t);
        const py = centerY - val * scaleY;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Discrete Sample Points (ADC Stems & Dots in Amber)
    const dt = 1 / fs;
    const totalSamples = Math.floor(timeSpan / dt);

    for (let i = 0; i <= totalSamples; i++) {
      const t = i * dt;
      const px = (t / timeSpan) * width;
      const val = Math.sin(2 * Math.PI * fin * t);
      const py = centerY - val * scaleY;

      // Stem line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, centerY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Sample dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

  }, [fin, fs, enableAAF, effectiveAmp, isNyquistMet, aliasFreq]);

  return (
    <div className={styles.interactiveCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <span>🎛️</span> Interactive Nyquist & Aliasing Simulator
        </h3>
        <span className={`${styles.badge} ${isNyquistMet ? styles.badgeSuccess : styles.badgeDanger}`}>
          {isNyquistMet ? '✅ Nyquist Satisfied' : '🚨 Aliasing Hazard!'}
        </span>
      </div>

      <div className={styles.controlsGrid}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            <span>Input Frequency (f_in):</span>
            <span className={styles.controlValue}>{fin} Hz</span>
          </label>
          <input
            type="range"
            min="5"
            max="60"
            value={fin}
            onChange={(e) => setFin(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            <span>Sampling Rate (f_s):</span>
            <span className={styles.controlValue}>{fs} Hz</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={fs}
            onChange={(e) => setFs(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup} style={{ justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={enableAAF}
              onChange={(e) => setEnableAAF(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>Enable Anti-Aliasing Filter (AAF)</span>
          </label>
        </div>
      </div>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} width={800} height={240} className={styles.canvas} />
      </div>

      <div className={styles.formulaBox}>
        <div>
          <strong>Theoretical Condition:</strong> f_s ({fs} Hz) {isNyquistMet ? '>' : '≤'} 2 × f_in ({nyquistRate} Hz)
        </div>
        <div>
          {!isNyquistMet ? (
            <span style={{ color: '#ef4444', fontWeight: 700 }}>
              Folds into Baseband as: f_alias = |{fin} - {Math.round(fin/fs)*fs}| = {aliasFreq} Hz
            </span>
          ) : (
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              Clean Reconstruction: f_observed = {fin} Hz
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span>🔵 <strong>Cyan Line:</strong> True Continuous Analog Input x(t)</span>
        <span>🟡 <strong>Gold Points:</strong> Discrete ADC Samples</span>
        <span>🔴 <strong>Red Dashed Line:</strong> Apparent Alias Wave</span>
      </div>
    </div>
  );
}
