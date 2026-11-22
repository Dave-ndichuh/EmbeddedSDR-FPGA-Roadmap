import React from 'react';
import styles from './styles.module.css';

interface DiagramProps {
  type: 'sdr-chain' | 'fpga-fabric' | 'fir-architecture';
  caption: string;
}

export default function DiagramBlock({ type, caption }: DiagramProps): JSX.Element {
  return (
    <div className={styles.diagramCard}>
      <div className={styles.diagramSvgWrapper}>
        {type === 'sdr-chain' && (
          <svg viewBox="0 0 920 220" style={{ maxWidth: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="rfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="analogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="adcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="fpgaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>

            {/* Antenna */}
            <path d="M 40 110 L 40 60 M 20 40 L 40 60 L 60 40" stroke="#38bdf8" strokeWidth="3" fill="none" />
            <text x="40" y="135" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">Antenna</text>

            {/* Wire to LNA */}
            <line x1="40" y1="110" x2="100" y2="110" stroke="#38bdf8" strokeWidth="2.5" />

            {/* LNA Block */}
            <polygon points="100,85 160,110 100,135" fill="url(#rfGrad)" stroke="#60a5fa" strokeWidth="2" />
            <text x="120" y="114" fill="#ffffff" fontSize="12" fontWeight="bold">LNA</text>
            <text x="130" y="155" fill="#94a3b8" fontSize="11" textAnchor="middle">Low Noise Amp</text>

            {/* Wire to Quadrature Mixer */}
            <line x1="160" y1="110" x2="220" y2="110" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Mixer Circle */}
            <circle cx="250" cy="110" r="30" fill="url(#analogGrad)" stroke="#a78bfa" strokeWidth="2" />
            <line x1="230" y1="90" x2="270" y2="130" stroke="#ffffff" strokeWidth="2" />
            <line x1="230" y1="130" x2="270" y2="90" stroke="#ffffff" strokeWidth="2" />
            <text x="250" y="155" fill="#94a3b8" fontSize="11" textAnchor="middle">IQ Mixer</text>

            {/* Local Oscillator LO */}
            <line x1="250" y1="180" x2="250" y2="140" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3,3" />
            <rect x="220" y="180" width="60" height="30" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="250" y="200" fill="#a78bfa" fontSize="11" textAnchor="middle" fontWeight="bold">LO (f_c)</text>

            {/* I and Q branches */}
            <path d="M 280 100 L 340 70" stroke="#a78bfa" strokeWidth="2" />
            <path d="M 280 120 L 340 150" stroke="#a78bfa" strokeWidth="2" />

            {/* Anti-Aliasing Filters (LPF) */}
            <rect x="340" y="50" width="80" height="40" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="2" />
            <text x="380" y="75" fill="#c4b5fd" fontSize="11" textAnchor="middle" fontWeight="bold">AAF (LPF)</text>
            <text x="430" y="65" fill="#94a3b8" fontSize="11">I(t)</text>

            <rect x="340" y="130" width="80" height="40" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="2" />
            <text x="380" y="155" fill="#c4b5fd" fontSize="11" textAnchor="middle" fontWeight="bold">AAF (LPF)</text>
            <text x="430" y="145" fill="#94a3b8" fontSize="11">Q(t)</text>

            {/* Dual ADCs */}
            <line x1="420" y1="70" x2="480" y2="70" stroke="#a78bfa" strokeWidth="2" />
            <line x1="420" y1="150" x2="480" y2="150" stroke="#a78bfa" strokeWidth="2" />

            <rect x="480" y="48" width="90" height="44" rx="8" fill="url(#adcGrad)" stroke="#fbbf24" strokeWidth="2" />
            <text x="525" y="74" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">ADC (I)</text>

            <rect x="480" y="128" width="90" height="44" rx="8" fill="url(#adcGrad)" stroke="#fbbf24" strokeWidth="2" />
            <text x="525" y="154" fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">ADC (Q)</text>

            {/* Digital Boundary */}
            <line x1="610" y1="20" x2="610" y2="200" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
            <text x="605" y="35" fill="#f87171" fontSize="11" textAnchor="end" fontWeight="bold">ANALOG DOMAIN</text>
            <text x="615" y="35" fill="#34d399" fontSize="11" textAnchor="start" fontWeight="bold">DIGITAL (FPGA) DOMAIN</text>

            {/* FPGA Fabric */}
            <rect x="650" y="30" width="240" height="160" rx="12" fill="url(#fpgaGrad)" stroke="#34d399" strokeWidth="2" />
            <text x="770" y="60" fill="#ffffff" fontSize="14" textAnchor="middle" fontWeight="bold">FPGA Signal Processing</text>

            {/* DDC & Decimation inside FPGA */}
            <rect x="670" y="80" width="90" height="40" rx="6" fill="#064e3b" stroke="#6ee7b7" strokeWidth="1.5" />
            <text x="715" y="105" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">DDC / Mixer</text>

            <line x1="760" y1="100" x2="790" y2="100" stroke="#6ee7b7" strokeWidth="2" />

            <rect x="790" y="80" width="85" height="40" rx="6" fill="#064e3b" stroke="#6ee7b7" strokeWidth="1.5" />
            <text x="832" y="105" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">CIC / Decim</text>

            <text x="770" y="155" fill="#a7f3d0" fontSize="11" textAnchor="middle">AXI4-Stream IQ Baseband Out →</text>
          </svg>
        )}

        {type === 'fpga-fabric' && (
          <svg viewBox="0 0 880 240" style={{ maxWidth: '100%', height: 'auto' }}>
            <rect x="20" y="20" width="840" height="200" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="440" y="45" fill="#f8fafc" fontSize="15" textAnchor="middle" fontWeight="bold">FPGA Logic Slice Architecture (Xilinx 7-Series / UltraScale CLB)</text>

            {/* 6-LUT */}
            <rect x="60" y="70" width="140" height="120" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <text x="130" y="100" fill="#38bdf8" fontSize="14" textAnchor="middle" fontWeight="bold">LUT6</text>
            <text x="130" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">64-bit SRAM</text>
            <text x="130" y="145" fill="#64748b" fontSize="10" textAnchor="middle">Any 6-Input Bool Fn</text>
            <text x="130" y="165" fill="#64748b" fontSize="10" textAnchor="middle">or Distributed RAM</text>

            {/* Inputs to LUT */}
            <line x1="25" y1="90" x2="60" y2="90" stroke="#60a5fa" strokeWidth="2" />
            <line x1="25" y1="110" x2="60" y2="110" stroke="#60a5fa" strokeWidth="2" />
            <line x1="25" y1="130" x2="60" y2="130" stroke="#60a5fa" strokeWidth="2" />
            <line x1="25" y1="150" x2="60" y2="150" stroke="#60a5fa" strokeWidth="2" />
            <text x="40" y="80" fill="#60a5fa" fontSize="10">Inputs [5:0]</text>

            {/* Wire to Carry Chain */}
            <line x1="200" y1="110" x2="260" y2="110" stroke="#38bdf8" strokeWidth="2" />

            {/* Carry4 Logic */}
            <rect x="260" y="70" width="120" height="120" rx="8" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
            <text x="320" y="100" fill="#fbbf24" fontSize="14" textAnchor="middle" fontWeight="bold">CARRY4</text>
            <text x="320" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">Fast Lookahead</text>
            <text x="320" y="145" fill="#64748b" fontSize="10" textAnchor="middle">Dedicated Adders</text>
            <text x="320" y="165" fill="#64748b" fontSize="10" textAnchor="middle">Cin / Cout Chaining</text>

            {/* Multiplexer */}
            <line x1="380" y1="110" x2="430" y2="110" stroke="#fbbf24" strokeWidth="2" />
            <polygon points="430,85 470,100 470,140 430,155" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="450" y="124" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="bold">MUX</text>

            {/* Wire to Flip-Flop */}
            <line x1="470" y1="120" x2="530" y2="120" stroke="#34d399" strokeWidth="2" />

            {/* Flip Flop */}
            <rect x="530" y="70" width="130" height="120" rx="8" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
            <text x="595" y="100" fill="#34d399" fontSize="14" textAnchor="middle" fontWeight="bold">D Flip-Flop</text>
            <text x="595" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">Sequential State</text>
            <text x="595" y="145" fill="#64748b" fontSize="10" textAnchor="middle">Clocked by CLK</text>
            <text x="595" y="165" fill="#64748b" fontSize="10" textAnchor="middle">Async/Sync Reset</text>

            {/* DSP Slice callout */}
            <rect x="700" y="70" width="140" height="120" rx="8" fill="#1e293b" stroke="#c084fc" strokeWidth="2" />
            <text x="770" y="100" fill="#c084fc" fontSize="14" textAnchor="middle" fontWeight="bold">DSP48 Block</text>
            <text x="770" y="125" fill="#94a3b8" fontSize="11" textAnchor="middle">25x18 Multiplier</text>
            <text x="770" y="145" fill="#64748b" fontSize="10" textAnchor="middle">48-bit Accumulator</text>
            <text x="770" y="165" fill="#64748b" fontSize="10" textAnchor="middle">Pre-Adder Unit</text>
          </svg>
        )}

        {type === 'fir-architecture' && (
          <svg viewBox="0 0 880 230" style={{ maxWidth: '100%', height: 'auto' }}>
            <rect x="20" y="15" width="840" height="200" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x="440" y="38" fill="#f8fafc" fontSize="14" textAnchor="middle" fontWeight="bold">Pipelined Transposed FIR Filter (Maximum FPGA f_max Architecture)</text>

            {/* Input bus broadcast */}
            <text x="50" y="80" fill="#38bdf8" fontSize="13" fontWeight="bold">x[n] In →</text>
            <line x1="110" y1="75" x2="720" y2="75" stroke="#38bdf8" strokeWidth="3" />

            {/* Drops to multipliers */}
            <line x1="180" y1="75" x2="180" y2="105" stroke="#38bdf8" strokeWidth="2" />
            <line x1="360" y1="75" x2="360" y2="105" stroke="#38bdf8" strokeWidth="2" />
            <line x1="540" y1="75" x2="540" y2="105" stroke="#38bdf8" strokeWidth="2" />
            <line x1="720" y1="75" x2="720" y2="105" stroke="#38bdf8" strokeWidth="2" />

            {/* Multipliers */}
            <rect x="150" y="105" width="60" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="180" y="125" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">× b3</text>

            <rect x="330" y="105" width="60" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="360" y="125" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">× b2</text>

            <rect x="510" y="105" width="60" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="540" y="125" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">× b1</text>

            <rect x="690" y="105" width="60" height="30" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="720" y="125" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">× b0</text>

            {/* Accumulator delay registers z^-1 and adders */}
            <line x1="180" y1="135" x2="180" y2="175" stroke="#f59e0b" strokeWidth="2" />
            <line x1="180" y1="175" x2="230" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Reg 1 */}
            <rect x="230" y="160" width="50" height="30" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            <text x="255" y="180" fill="#a7f3d0" fontSize="11" textAnchor="middle" fontWeight="bold">z^-1</text>
            <line x1="280" y1="175" x2="330" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Adder 1 */}
            <circle cx="345" cy="175" r="14" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="345" y="180" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="bold">+</text>
            <line x1="360" y1="135" x2="345" y2="161" stroke="#f59e0b" strokeWidth="2" />
            <line x1="359" y1="175" x2="410" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Reg 2 */}
            <rect x="410" y="160" width="50" height="30" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            <text x="435" y="180" fill="#a7f3d0" fontSize="11" textAnchor="middle" fontWeight="bold">z^-1</text>
            <line x1="460" y1="175" x2="510" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Adder 2 */}
            <circle cx="525" cy="175" r="14" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="525" y="180" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="bold">+</text>
            <line x1="540" y1="135" x2="525" y2="161" stroke="#f59e0b" strokeWidth="2" />
            <line x1="539" y1="175" x2="590" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Reg 3 */}
            <rect x="590" y="160" width="50" height="30" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            <text x="615" y="180" fill="#a7f3d0" fontSize="11" textAnchor="middle" fontWeight="bold">z^-1</text>
            <line x1="640" y1="175" x2="690" y2="175" stroke="#34d399" strokeWidth="2" />

            {/* Adder 3 (Final) */}
            <circle cx="705" cy="175" r="14" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="705" y="180" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="bold">+</text>
            <line x1="720" y1="135" x2="705" y2="161" stroke="#f59e0b" strokeWidth="2" />
            <line x1="719" y1="175" x2="770" y2="175" stroke="#38bdf8" strokeWidth="3" />

            {/* Output */}
            <text x="780" y="180" fill="#38bdf8" fontSize="13" fontWeight="bold">→ y[n] Out</text>
          </svg>
        )}
      </div>
      <div className={styles.diagramCaption}>{caption}</div>
    </div>
  );
}
