import React, { useState, useEffect, useRef } from 'react';
import { recordSimulatorInteraction, useInteractionStats } from '@site/src/utils/interactionStats';
import styles from './styles.module.css';

const SIM_ID = 'iq-simulator';
const SIM_TITLE = 'Complex IQ Phasor & Constellation Analyzer';
const SIM_PATH = '/docs/Phase-1/DSP-Theory';

export default function IQSimulator(): React.ReactElement {
  const [modScheme, setModScheme] = useState<'phasor' | 'bpsk' | 'qpsk' | 'qam16'>('qpsk');
  const [noiseLevel, setNoiseLevel] = useState(10); // 0 to 50%
  const [iqImbalance, setIqImbalance] = useState(0); // dB gain skew
  const [phaseSkew, setPhaseSkew] = useState(0); // degrees
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const lastLogRef = useRef<number>(0);
  const { stats } = useInteractionStats();
  const runCount = stats.simulators[SIM_ID]?.interactions || 0;

  const logRun = (detail: string, throttleMs: number) => {
    const now = Date.now();
    if (now - lastLogRef.current >= throttleMs) {
      lastLogRef.current = now;
      recordSimulatorInteraction(SIM_ID, SIM_TITLE, detail, SIM_PATH);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      const splitX = 320; // Left side is IQ plane, right side is time-domain waves

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // --- LEFT SIDE: IQ CONSTELLATION / PHASOR PLANE ---
      const centerX = splitX / 2;
      const centerY = height / 2;
      const radius = 95;

      // IQ Axes & Circles
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - radius - 20, centerY);
      ctx.lineTo(centerX + radius + 20, centerY);
      ctx.moveTo(centerX, centerY - radius - 20);
      ctx.lineTo(centerX, centerY + radius + 20);
      ctx.stroke();

      // Unit Circle
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('+I (In-Phase)', centerX + radius - 20, centerY + 18);
      ctx.fillText('+Q (Quad)', centerX + 8, centerY - radius + 10);

      // Advance phase for LO rotation
      phaseRef.current = (phaseRef.current + 0.03) % (Math.PI * 2);
      const curPhase = phaseRef.current;

      const gainFactor = Math.pow(10, iqImbalance / 20);
      const phaseRadSkew = (phaseSkew * Math.PI) / 180;

      if (modScheme === 'phasor') {
        // Rotating Phasor Vector
        let rawI = Math.cos(curPhase);
        let rawQ = Math.sin(curPhase);

        // Apply imbalance
        let iVal = rawI * gainFactor;
        let qVal = rawQ * Math.cos(phaseRadSkew) + rawI * Math.sin(phaseRadSkew);

        const px = centerX + iVal * radius;
        const py = centerY - qVal * radius;

        // Vector line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Tip circle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Projections to axes
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px, centerY);
        ctx.moveTo(px, py); ctx.lineTo(centerX, py);
        ctx.stroke();
        ctx.setLineDash([]);

      } else {
        // Constellation Scatter Points
        let basePoints: [number, number][] = [];
        if (modScheme === 'bpsk') {
          basePoints = [[-1, 0], [1, 0]];
        } else if (modScheme === 'qpsk') {
          const invSqrt2 = 1 / Math.SQRT2;
          basePoints = [
            [-invSqrt2, -invSqrt2],
            [invSqrt2, -invSqrt2],
            [-invSqrt2, invSqrt2],
            [invSqrt2, invSqrt2]
          ];
        } else if (modScheme === 'qam16') {
          const levels = [-0.948, -0.316, 0.316, 0.948];
          for (let i of levels) {
            for (let q of levels) {
              basePoints.push([i, q]);
            }
          }
        }

        // Draw scatter cloud around ideal constellation points
        const numScatter = modScheme === 'qam16' ? 4 : 16;
        for (const [bi, bq] of basePoints) {
          // Ideal point
          const idealX = centerX + bi * radius;
          const idealY = centerY - bq * radius;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(idealX, idealY, 4, 0, Math.PI * 2);
          ctx.stroke();

          // Noise cloud
          for (let s = 0; s < numScatter; s++) {
            const nI = (Math.random() - 0.5) * (noiseLevel / 25);
            const nQ = (Math.random() - 0.5) * (noiseLevel / 25);

            let effI = (bi + nI) * gainFactor;
            let effQ = (bq + nQ) * Math.cos(phaseRadSkew) + (bi + nI) * Math.sin(phaseRadSkew);

            const sx = centerX + effI * radius;
            const sy = centerY - effQ * radius;

            ctx.fillStyle = modScheme === 'qam16' ? 'rgba(236, 72, 153, 0.7)' : 'rgba(52, 211, 153, 0.7)';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Divider line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();

      // --- RIGHT SIDE: REAL-TIME TIME-DOMAIN WAVEFORMS ---
      const waveStartX = splitX + 20;
      const waveWidth = width - waveStartX - 20;
      const topWaveCenterY = height * 0.3;
      const botWaveCenterY = height * 0.75;
      const waveAmp = height * 0.16;

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('In-Phase Channel: I(t) = A·cos(ωt)', waveStartX, 25);
      ctx.fillText('Quadrature Channel: Q(t) = A·sin(ωt)', waveStartX, height / 2 + 15);

      // Baseline I
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(waveStartX, topWaveCenterY);
      ctx.lineTo(waveStartX + waveWidth, topWaveCenterY);
      ctx.moveTo(waveStartX, botWaveCenterY);
      ctx.lineTo(waveStartX + waveWidth, botWaveCenterY);
      ctx.stroke();

      // Draw I(t) (Cyan)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px < waveWidth; px++) {
        const t = (px / waveWidth) * 3 * Math.PI * 2;
        const val = Math.cos(t - curPhase) * gainFactor;
        const py = topWaveCenterY - val * waveAmp;
        if (px === 0) ctx.moveTo(waveStartX + px, py);
        else ctx.lineTo(waveStartX + px, py);
      }
      ctx.stroke();

      // Draw Q(t) (Violet)
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px < waveWidth; px++) {
        const t = (px / waveWidth) * 3 * Math.PI * 2;
        const val = Math.sin(t - curPhase + phaseRadSkew);
        const py = botWaveCenterY - val * waveAmp;
        if (px === 0) ctx.moveTo(waveStartX + px, py);
        else ctx.lineTo(waveStartX + px, py);
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [modScheme, noiseLevel, iqImbalance, phaseSkew]);

  return (
    <div className={styles.interactiveCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <span>📡</span> Interactive Complex IQ Phasor & Constellation Engine
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {runCount > 0 && (
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
              📡 {runCount} runs
            </span>
          )}
          <span className={styles.badge + ' ' + styles.badgeInfo}>
            {modScheme === 'phasor' ? 'Phasor LO Rotation' : `${modScheme.toUpperCase()} Constellation`}
          </span>
        </div>
      </div>

      <div className={styles.controlsGrid}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Signal Mode:</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(['phasor', 'bpsk', 'qpsk', 'qam16'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setModScheme(mode);
                  logRun(`Switched constellation mode to ${mode.toUpperCase()}`, 250);
                }}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  background: modScheme === mode ? 'var(--ifm-color-primary)' : 'var(--ifm-background-color)',
                  color: modScheme === mode ? '#fff' : 'var(--ifm-color-emphasis-800)'
                }}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {modScheme !== 'phasor' && (
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <span>AWGN Channel Noise / EVM Jitter:</span>
              <span className={styles.controlValue}>{noiseLevel}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="40"
              value={noiseLevel}
              onChange={(e) => {
                const v = Number(e.target.value);
                setNoiseLevel(v);
                logRun(`Adjusted AWGN noise to ${v}%`, 1500);
              }}
              className={styles.slider}
            />
          </div>
        )}

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            <span>IQ Gain Imbalance:</span>
            <span className={styles.controlValue}>{iqImbalance > 0 ? `+${iqImbalance}` : iqImbalance} dB</span>
          </label>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.2"
            value={iqImbalance}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIqImbalance(v);
              logRun(`Set IQ gain imbalance to ${v} dB`, 1500);
            }}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            <span>Phase Non-Orthogonality Skew:</span>
            <span className={styles.controlValue}>{phaseSkew}°</span>
          </label>
          <input
            type="range"
            min="-15"
            max="15"
            value={phaseSkew}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPhaseSkew(v);
              logRun(`Set phase skew to ${v}°`, 1500);
            }}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} width={800} height={260} className={styles.canvas} />
      </div>

      <div className={styles.formulaBox}>
        <div>
          <strong>Complex Representation:</strong> s(t) = I(t) + j·Q(t) = A(t)·e^(j·θ(t))
        </div>
        <div style={{ color: 'var(--ifm-color-emphasis-700)' }}>
          {iqImbalance !== 0 || phaseSkew !== 0 ? (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              ⚠️ Imbalance Warning: Creates mirror image spectral leakage at -f_c!
            </span>
          ) : (
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              ✨ Perfect Quadrature Orthogonality (90° phase offset)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
