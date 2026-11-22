import React, { useState } from 'react';
import styles from './styles.module.css';

interface CycleState {
  cycle: number;
  tvalid: number;
  tready: number;
  tdata: string;
  tlast: number;
  status: 'handshake' | 'backpressure' | 'idle' | 'starved';
}

export default function AXIStreamVisualizer(): JSX.Element {
  const [tvalid, setTvalid] = useState<number>(1);
  const [tready, setTready] = useState<number>(1);
  const [currentByte, setCurrentByte] = useState<number>(0xA0);
  const [history, setHistory] = useState<CycleState[]>([
    { cycle: 0, tvalid: 1, tready: 1, tdata: '0xA0', tlast: 0, status: 'handshake' }
  ]);

  const stepClock = () => {
    const nextCycle = history.length;
    let nextStatus: CycleState['status'] = 'idle';
    let nextData = history[history.length - 1].tdata;
    let nextTlast = 0;

    if (tvalid === 1 && tready === 1) {
      nextStatus = 'handshake';
      const nextByteVal = currentByte + 1 > 0xFF ? 0xA0 : currentByte + 1;
      setCurrentByte(nextByteVal);
      nextData = '0x' + nextByteVal.toString(16).toUpperCase();
      if (nextCycle % 4 === 0) nextTlast = 1;
    } else if (tvalid === 1 && tready === 0) {
      nextStatus = 'backpressure';
      // Data remains held constant because receiver isn't ready
      nextData = history[history.length - 1].tdata;
    } else if (tvalid === 0 && tready === 1) {
      nextStatus = 'starved';
      nextData = '---';
    } else {
      nextStatus = 'idle';
      nextData = '---';
    }

    const newEntry: CycleState = {
      cycle: nextCycle,
      tvalid,
      tready,
      tdata: nextData,
      tlast: nextTlast,
      status: nextStatus
    };

    // Keep rolling last 8 cycles
    const updated = [...history, newEntry].slice(-8);
    setHistory(updated);
  };

  const resetSim = () => {
    setCurrentByte(0xA0);
    setTvalid(1);
    setTready(1);
    setHistory([{ cycle: 0, tvalid: 1, tready: 1, tdata: '0xA0', tlast: 0, status: 'handshake' }]);
  };

  const lastEntry = history[history.length - 1];

  return (
    <div className={styles.interactiveCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <span>⚡</span> Interactive AXI4-Stream Bus Handshake Engine
        </h3>
        <span className={`${styles.badge} ${
          lastEntry.status === 'handshake' ? styles.badgeSuccess :
          lastEntry.status === 'backpressure' ? styles.badgeDanger :
          styles.badgeInfo
        }`}>
          {lastEntry.status === 'handshake' ? '✅ Data Transferred' :
           lastEntry.status === 'backpressure' ? '⏳ Receiver Backpressure Stalled' :
           lastEntry.status === 'starved' ? '💨 Producer Idle' : '💤 Bus Idle'}
        </span>
      </div>

      <p style={{ fontSize: '0.92rem', color: 'var(--ifm-color-emphasis-700)', marginBottom: '1rem' }}>
        Step through clock cycles to observe how master <code>TVALID</code> and slave <code>TREADY</code> negotiate data transfer without drops or overflow.
      </p>

      {/* Control buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <button
          onClick={stepClock}
          style={{
            background: 'var(--ifm-color-primary)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
          Clock Edge ⏭️ (posedge ACLK)
        </button>

        <button
          onClick={() => setTvalid(tvalid === 1 ? 0 : 1)}
          style={{
            background: tvalid === 1 ? '#059669' : '#475569',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
          Master TVALID: {tvalid === 1 ? '1 (Asserted)' : '0 (Deasserted)'}
        </button>

        <button
          onClick={() => setTready(tready === 1 ? 0 : 1)}
          style={{
            background: tready === 1 ? '#2563eb' : '#475569',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
          Slave TREADY: {tready === 1 ? '1 (Ready)' : '0 (Stalled)'}
        </button>

        <button
          onClick={resetSim}
          style={{
            background: 'transparent',
            border: '1px solid var(--ifm-color-emphasis-300)',
            color: 'var(--ifm-color-emphasis-700)',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
          Reset
        </button>
      </div>

      {/* Timing Waveform Visualizer Table */}
      <div style={{ overflowX: 'auto', background: '#0f172a', borderRadius: '8px', padding: '1rem', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Signal</th>
              {history.map((h, i) => (
                <th key={i} style={{ textAlign: 'center', padding: '0.5rem', minWidth: '60px' }}>
                  Cycle {h.cycle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ACLK */}
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ color: '#fbbf24', fontWeight: 700, padding: '0.5rem' }}>ACLK</td>
              {history.map((_, i) => (
                <td key={i} style={{ textAlign: 'center', color: '#fbbf24' }}>_/~\\_</td>
              ))}
            </tr>

            {/* TVALID */}
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ color: '#34d399', fontWeight: 700, padding: '0.5rem' }}>TVALID</td>
              {history.map((h, i) => (
                <td key={i} style={{ textAlign: 'center', color: h.tvalid ? '#34d399' : '#64748b' }}>
                  {h.tvalid}
                </td>
              ))}
            </tr>

            {/* TREADY */}
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ color: '#60a5fa', fontWeight: 700, padding: '0.5rem' }}>TREADY</td>
              {history.map((h, i) => (
                <td key={i} style={{ textAlign: 'center', color: h.tready ? '#60a5fa' : '#64748b' }}>
                  {h.tready}
                </td>
              ))}
            </tr>

            {/* TDATA */}
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ color: '#f43f5e', fontWeight: 700, padding: '0.5rem' }}>TDATA</td>
              {history.map((h, i) => (
                <td key={i} style={{ textAlign: 'center', color: '#f43f5e', fontWeight: 600 }}>
                  {h.tdata}
                </td>
              ))}
            </tr>

            {/* TLAST */}
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ color: '#c084fc', fontWeight: 700, padding: '0.5rem' }}>TLAST</td>
              {history.map((h, i) => (
                <td key={i} style={{ textAlign: 'center', color: h.tlast ? '#c084fc' : '#475569' }}>
                  {h.tlast}
                </td>
              ))}
            </tr>

            {/* Event Status */}
            <tr>
              <td style={{ color: '#e2e8f0', fontWeight: 700, padding: '0.5rem' }}>ACTION</td>
              {history.map((h, i) => (
                <td key={i} style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                  {h.status === 'handshake' ? '🟢 TRANSFER' :
                   h.status === 'backpressure' ? '🔴 HOLD' :
                   h.status === 'starved' ? '⚪ NO DATA' : '⚫ IDLE'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.formulaBox} style={{ marginTop: '1rem' }}>
        <div>
          <strong>Golden Rule:</strong> Data transfers strictly when <code>(TVALID &amp;&amp; TREADY) == 1</code> on <code>posedge ACLK</code>.
        </div>
        <div style={{ color: '#ef4444' }}>
          <strong>AMBA Spec Prohibition:</strong> <code>TVALID</code> must NEVER wait for <code>TREADY</code>!
        </div>
      </div>
    </div>
  );
}
