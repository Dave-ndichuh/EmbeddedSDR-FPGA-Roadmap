import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './glossary.module.css';

interface TermItem {
  id: string;
  term: string;
  aliases: string[];
  domain: 'DSP & RF' | 'FPGA & Verilog' | 'Fixed-Point Math' | 'Bus Protocols & SoC' | 'Modulation & Comms' | 'Verification & Tools';
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 5';
  link: string;
  intuition: string;
  reality: string;
  trap: string;
}

const GLOSSARY_TERMS: TermItem[] = [
  {
    id: 'nyquist-aliasing',
    term: 'Nyquist-Shannon Sampling & Aliasing',
    aliases: ['Whittaker-Shannon Criterion', 'Folding Frequency', 'Cardinal Theorem of Interpolation', 'Anti-Aliasing Filter (AAF)'],
    domain: 'DSP & RF',
    phase: 'Phase 1',
    link: '/docs/Phase-1/DSP-Theory',
    intuition: 'Think of watching a helicopter or car wheel on video: if the shutter clicks too slowly, the propeller appears stationary or spins backwards! Undersampling forces high frequencies to masquerade as lower frequencies.',
    reality: 'Requires fs > 2*f_max. High frequencies fold into baseband as: f_alias = |f_in - k*fs|. Perfect continuous reconstruction uses sinc interpolation: x(t) = sum(x[n]*sinc((t-nTs)/Ts)).',
    trap: 'Once aliased into discrete samples, math cannot separate the alias from genuine low frequencies. You MUST place an analog anti-aliasing filter BEFORE the ADC converter.'
  },
  {
    id: 'iq-sampling',
    term: 'In-Phase & Quadrature (IQ) Signals',
    aliases: ['Complex Baseband', 'Quadrature Demodulation', 'Analytic Signal', 'Hilbert Transform Pair', 'Complex Envelope'],
    domain: 'DSP & RF',
    phase: 'Phase 1',
    link: '/docs/Phase-1/DSP-Theory',
    intuition: 'Real-only signals cannot tell if a wheel rotates clockwise or counter-clockwise (cos(wt) = cos(-wt)). IQ pairs give you two orthogonal axes (like clock hands), unlocking unambiguous positive vs. negative frequencies.',
    reality: 's(t) = I(t)*cos(2*pi*fc*t) - Q(t)*sin(2*pi*fc*t). Instantaneous amplitude: A = sqrt(I^2 + Q^2), Phase: theta = atan2(Q, I). Represented as complex number: z[n] = I[n] + j*Q[n].',
    trap: 'IQ Imbalance! Even a 0.5 dB gain difference or 1-degree phase error between the physical I and Q analog receiver mixers produces a phantom ghost mirror image in your FFT spectrum.'
  },
  {
    id: 'dds-nco',
    term: 'Direct Digital Synthesis (DDS / NCO)',
    aliases: ['Numerically Controlled Oscillator', 'Phase Accumulator Synthesizer', 'Table-Lookup Sine Generator'],
    domain: 'DSP & RF',
    phase: 'Phase 3',
    link: '/docs/Phase-3/DDS-NCO',
    intuition: 'Like a car odometer ticking upward by a fixed distance every single second. As the odometer rolls over (360 degrees), it looks up a pre-baked sine lookup table to produce an analog-pure radio tone.',
    reality: 'f_out = (M * f_clk) / (2^N), where M is the 32-bit Tuning Word, f_clk is the FPGA clock, and N is the accumulator width. Tuning resolution is delta_f = f_clk / (2^N).',
    trap: 'Phase Truncation Spurs! Because a 32-bit table is too large for FPGA BRAM, you only feed the top 10-12 bits to the LUT, which introduces periodic phase noise spikes in your SFDR.'
  },
  {
    id: 'fixed-point-q',
    term: 'Fixed-Point Arithmetic (Qm.n)',
    aliases: ['Fractional Binary', 'Radix Point Scaling', 'Integer Scaled Math', 'Two\'s Complement Fixed-Point'],
    domain: 'Fixed-Point & Precision',
    phase: 'Phase 3',
    link: '/docs/Phase-3/Fixed-Point-Math',
    intuition: 'Floating-point math in an FPGA is like parking a semitruck inside a home garage—huge, slow, and expensive. Fixed-point is pure integer math with an agreed-upon imaginary decimal point.',
    reality: 'Format Qm.n has m integer bits and n fractional bits. Two Q1.15 numbers multiplied yield a Q2.30 product (32-bit), which must be rounded/truncated back to 16 bits with sign extension.',
    trap: 'The Two\'s Complement -1.0 x -1.0 Overflow! In Q1.15, -1.0 is 0x8000. Squaring it produces +1.0 (0x40000000 in Q2.30), which cannot fit in signed 16-bit Q1.15 and rolls over into -1.0 without saturation logic!'
  },
  {
    id: 'transposed-fir',
    term: 'Transposed Form FIR Filter',
    aliases: ['Pipelined Direct-Form II Transpose', 'DSP-Slice Pipelined Filter', 'Broadcast Delay Architecture'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 3',
    link: '/docs/Phase-3/Hardware-FIR',
    intuition: 'Direct-form FIR gathers all multiplier outputs into one massive tree of adders, creating a traffic jam. Transposed FIR broadcasts the input to all multipliers and hands partial sums down a conveyor belt with registers.',
    reality: 'Reverses signal flow of Direct Form: input feeds every tap simultaneously; delay registers (z^-1) sit directly between each adder. Critical path drops to 1 multiplier + 1 adder regardless of tap count.',
    trap: 'Initial pipeline latency: Unlike Direct Form, the first valid output in Transposed Form is delayed by the full tap length. Ensure your testbenches don\'t flag early zeros as logic errors!'
  },
  {
    id: 'dsp-slice',
    term: 'DSP Slice (DSP48 / Hardened MAC)',
    aliases: ['Multiply-Accumulator (MAC) Block', 'Hardened Arithmetic Macro', 'DSP48E1 / DSP48E2', 'Pre-Adder DSP'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilog-Paradigms',
    intuition: 'Hardened silicon turbochargers embedded right in the FPGA grid. If you write your Verilog with proper register stages, the tool routes your math into these silicon superhighways instead of slow generic gates.',
    reality: 'Dedicated silicon block featuring a 25x18 signed multiplier, a 48-bit accumulator, and an integrated pre-adder (enabling symmetric coefficient FIR filters to consume half the multipliers).',
    trap: 'Combinational inference penalty: If your multiply-add logic lacks input or pipeline registers, the synthesis tool cannot map it into the DSP slice and burns hundreds of LUTs while cutting your f_max in half.'
  },
  {
    id: 'inferred-latch',
    term: 'Inferred Transparent Latch',
    aliases: ['Combinational Latch Hazard', 'Incomplete Case/If Bug', 'Level-Sensitive Latch', 'Timing Closure Nightmare'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilog-Paradigms',
    intuition: 'Leaving a door unlocked in the wind: you told the FPGA what to do when an enable signal is high, but forgot to say what to do when it\'s low. The FPGA has to invent an unwanted memory element to hold the old state.',
    reality: 'In an always @(*) combinational block, failing to assign a signal on every possible branch (missing default or else) causes the synthesizer to infer an asynchronous latch using LUT feedback loops.',
    trap: 'Modern FPGAs do not have physical latches! The tool synthesizes them from combinational feedback paths, creating severe glitches, timing analyzer blindspots, and erratic temperature bugs.'
  },
  {
    id: 'blocking-vs-nonblocking',
    term: 'Non-Blocking (<=) vs. Blocking (=)',
    aliases: ['Active Events vs. NBA Update', 'Sequential vs. Combinational Assignments', 'Verilog Event Queue'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilog-Paradigms',
    intuition: 'Blocking (=) is cooking a meal step-by-step in series. Non-blocking (<=) is a synchronized marching band taking a forward step in unison at the exact beat of the drum.',
    reality: 'Blocking assignments evaluate and update immediately in the simulator\'s Active Events region. Non-blocking assignments compute RHS values in the Active region but defer updates until the Non-Blocking Assignment (NBA) region.',
    trap: 'Using "=" in clocked always @(posedge clk) blocks turns your intended multi-stage shift register into a single wire, causing massive simulation/synthesis mismatches.'
  },
  {
    id: 'metastability-cdc',
    term: 'Metastability & Clock Domain Crossing (CDC)',
    aliases: ['Two-Flip-Flop Synchronizer', 'Setup/Hold Violation', 'MTBF (Mean Time Between Failures)', 'Asynchronous Boundary'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 4',
    link: '/docs/Phase-4/',
    intuition: 'Flipping a coin and having it balance precariously on its knife-edge before finally tumbling to heads or tails. If incoming data changes during the clock edge window, the flip-flop output hovers in an illegal state.',
    reality: 'Setup time (t_setup) and hold time (t_hold) violations cause flip-flop output voltage to oscillate between logic levels. Mitigated using a cascaded 2-FF synchronizer chain to maximize MTBF.',
    trap: 'Never synchronize a multi-bit binary counter with simple flip-flop chains! Because individual bits change at slightly different nanoseconds, intermediate states (like 0111 -> 1000) produce false glitch values.'
  },
  {
    id: 'async-fifo-gray',
    term: 'Asynchronous FIFO & Gray Coding',
    aliases: ['Dual-Clock FIFO', 'Unit-Distance Code Pointer', 'CDC Buffer', 'Cross-Clock Elastic Buffer'],
    domain: 'Bus Protocols & SoC',
    phase: 'Phase 4',
    link: '/docs/Phase-4/',
    intuition: 'A secure package locker between two people who run on completely different watches. To know how full the locker is without race conditions, they write ticket numbers in a code where only one digit ever changes at a time.',
    reality: 'Dual-port BRAM buffer with independent write_clk and read_clk. Pointers are converted from binary to Gray code (G = B ^ (B >> 1)) before crossing clock domains so only one bit transitions per increment.',
    trap: 'Directly comparing binary pointers across clock domains causes empty/full flag misfires, causing FIFO underflows and silent RF sample drops.'
  },
  {
    id: 'axi4-stream',
    term: 'AXI4-Stream Protocol (AXIS)',
    aliases: ['TVALID/TREADY Handshake', 'Streaming Point-to-Point Protocol', 'Xilinx/ARM High-Speed Bus', 'Backpressure Handshake'],
    domain: 'Bus Protocols & SoC',
    phase: 'Phase 4',
    link: '/docs/Phase-4/',
    intuition: 'A high-speed industrial conveyor belt with a laser sensor. The sender signals "box is ready" (TVALID) and the receiver signals "I have room" (TREADY). The box moves ONLY when both lights are green on the exact same clock beat.',
    reality: 'Unidirectional data transfer strictly on posedge clk when (TVALID && TREADY) == 1. Key signals: TDATA, TVALID, TREADY, TLAST (frame boundary), and TKEEP (byte qualifiers).',
    trap: 'The AXI-Stream Protocol Deadlock: Rule 1 of ARM AXI specifies TVALID must NEVER wait for TREADY to assert! Violating this creates circular lockups that freeze the entire SoC bus.'
  },
  {
    id: 'axi-dma',
    term: 'Direct Memory Access (DMA) & Scatter-Gather',
    aliases: ['Zero-Copy Bus Master', 'PL-to-PS Streaming Bridge', 'Ring-Buffer DMA', 'AXI DMA Engine'],
    domain: 'Bus Protocols & SoC',
    phase: 'Phase 4',
    link: '/docs/Phase-4/',
    intuition: 'Instead of the CPU manually hauling every single radio sample from the FPGA into DDR RAM with an eyedropper, DMA acts as a robotic forklift moving gigabytes of data behind the CPU\'s back.',
    reality: 'Master bus core that consumes high-speed AXI-Stream samples from the FPGA logic (PL) and writes long AXI4 memory bursts into system DDR memory, alerting Linux via an IRQ interrupt.',
    trap: 'Cache Incoherency Nightmare! When DMA writes new RF samples into DDR RAM, the ARM CPU core might continue reading stale old data from its internal L1/L2 cache unless you properly invalidate the cache range.'
  },
  {
    id: 'cic-filter',
    term: 'Cascaded Integrator-Comb (CIC) Filter',
    aliases: ['Hogenauer Filter', 'Multiplierless Decimator/Interpolator', 'Sinc Filter', 'High-Rate Resampler'],
    domain: 'DSP & RF',
    phase: 'Phase 3',
    link: '/docs/Phase-3/Fixed-Point-Math',
    intuition: 'Performing extreme sample rate decimation (like turning a 100 MHz ADC stream into 1 MHz) without using a single expensive hardware multiplier—only adders and subtractors!',
    reality: 'Consists of N cascaded Integrator stages running at high speed, an R-fold rate decimation, and N Comb stages running at low speed. Transfer function: H(z) = [ (1 - z^(-R*M)) / (1 - z^-1) ]^N.',
    trap: 'Catastrophic Register Overflow: CIC filters rely on Two\'s Complement math wrapping around without error. But if your internal register bit width is even 1 bit narrower than B_max = N*log2(R*M) + B_in, the output turns to garbage.'
  },
  {
    id: 'polyphase-channelizer',
    term: 'Polyphase Filter Bank (PFB)',
    aliases: ['M-Channel Analysis Bank', 'Polyphase Identity Commutator', 'Digital Channelizer', 'Spectrum Slicer'],
    domain: 'DSP & RF',
    phase: 'Phase 1',
    link: '/docs/Phase-1/Filtering-and-Decimation',
    intuition: 'Taking a 100 MHz radio band with 64 different stations and tuning all 64 stations at the exact same time without burning 64 separate filters—by swapping the filter and FFT orders!',
    reality: 'Uses the Noble Polyphase Identity to perform filtering after decimation. An input commutator distributes samples into M polyphase branches, filtered by sub-filters and combined through an M-point IFFT.',
    trap: 'Scalloping Loss: If your prototype polyphase low-pass filter transition band isn\'t wide enough, signals sitting right on the channel borders experience severe amplitude dips.'
  },
  {
    id: 'sfdr-snr',
    term: 'Spurious-Free Dynamic Range (SFDR)',
    aliases: ['Carrier-to-Worst-Spur Ratio', 'Dynamic Range', 'Spur Floor', 'In-Band Purity'],
    domain: 'DSP & RF',
    phase: 'Phase 1',
    link: '/docs/Phase-1/DSP-Theory',
    intuition: 'How quiet the stadium is around the lead singer. It measures the vertical distance in decibels between your wanted radio signal and the highest unwanted harmonic spike.',
    reality: 'SFDR (dB) = 20*log10(A_fundamental / A_highest_spur). For ideal D-bit quantization, theoretical maximum SFDR is approximately 6.02 * D dB.',
    trap: 'A single non-linear amplifier or periodic truncation pattern in your NCO can generate an unexpected spur that drowns out faint adjacent signals in tactical military radios.'
  },
  {
    id: 'cordic',
    term: 'CORDIC Algorithm',
    aliases: ['Coordinate Rotation Digital Computer', 'Volder\'s Algorithm', 'Shift-and-Add Trigonometry', 'Vectoring/Rotation CORDIC'],
    domain: 'DSP & RF',
    phase: 'Phase 3',
    link: '/docs/Phase-3/DDS-NCO',
    intuition: 'Rotating a vector towards a target angle using only pre-calculated angular steps of halving sizes (45 deg, 26.5 deg, 14 deg...), needing only bit-shifts and additions—no multipliers!',
    reality: 'Iteratively solves rotations: x(i+1) = x(i) - d*y(i)*2^(-i), y(i+1) = y(i) + d*x(i)*2^(-i), z(i+1) = z(i) - d*atan(2^(-i)). Converges to polar or Cartesian coordinates.',
    trap: 'CORDIC Processing Gain: The algorithm amplifies vector magnitude by a factor of K ~ 1.64676. You must scale down the final result by 1/K (~0.60725) or your output registers will saturate.'
  },
  {
    id: 'rrc-isi',
    term: 'Root-Raised Cosine (RRC) & ISI',
    aliases: ['Nyquist Pulse Shaping', 'Matched Filtering', 'Intersymbol Interference Minimizer', 'Raised-Cosine Spectrum'],
    domain: 'Modulation & Comms',
    phase: 'Phase 1',
    link: '/docs/Phase-1/GNU-Radio-Lab',
    intuition: 'Squeezing sharp square pulses through a bandlimited air channel without letting them spill over into their neighbors. Split equally between transmitter and receiver so they combine into a perfect Nyquist pulse.',
    reality: 'Frequency response has roll-off factor alpha (0.2 to 0.35). Cascading transmitter RRC and receiver RRC yields an overall Raised Cosine response whose impulse response has zero crossings at every symbol epoch T.',
    trap: 'Alpha roll-off mismatch: If the transmitter uses alpha=0.35 and receiver uses alpha=0.20, the zero-crossing property collapses, introducing severe Intersymbol Interference (ISI).'
  },
  {
    id: 'costas-loop',
    term: 'Costas Loop & Carrier Recovery',
    aliases: ['BPSK/QPSK Carrier Tracking Loop', 'Suppressed Carrier PLL', 'Phase-Locked Loop', 'Frequency Error Discriminator'],
    domain: 'Modulation & Comms',
    phase: 'Phase 1',
    link: '/docs/Phase-1/GNU-Radio-Lab',
    intuition: 'A self-steering compass that locks onto the invisible carrier wave of a digital signal even when the radio carrier tone itself has been completely eliminated from transmission.',
    reality: 'Multiplies I and Q branches with a phase detector: error = I * Q for BPSK, or sign(I)*Q - sign(Q)*I for QPSK. Error drives a proportional-integral (PI) loop filter adjusting an internal NCO.',
    trap: 'Phase Ambiguity! A Costas Loop locks happily onto 0, 90, 180, or 270 degrees. Without differential encoding or a known sync preamble (Barker code), all your ones and zeros might be inverted.'
  },
  {
    id: 'gardner-ted',
    term: 'Gardner Timing Error Detector (TED)',
    aliases: ['Non-Data-Aided Symbol Synchronizer', 'Baud-Rate Clock Recovery', 'Fractional Delay Interpolator Loop'],
    domain: 'Modulation & Comms',
    phase: 'Phase 5',
    link: '/docs/Phase-5/',
    intuition: 'Figuring out the exact microsecond to snap a photo of a high-speed runner by measuring whether their feet are touching the track ahead of or behind the line.',
    reality: 'Requires only 2 samples per symbol. Error metric: e[n] = I[n-1/2]*(I[n] - I[n-1]) + Q[n-1/2]*(Q[n] - Q[n-1]). Controls a Farrow fractional delay filter to align sampling strobe.',
    trap: 'Carrier Offset Sensitivity: Large carrier frequency offsets rotate the constellation faster than the Gardner TED can track, causing the symbol clock recovery to lose lock.'
  },
  {
    id: 'evm-constellation',
    term: 'Error Vector Magnitude (EVM)',
    aliases: ['Constellation Distortion Metric', 'Modulation Accuracy', 'IQ Vector Error', 'Scatter Cloud Cleanliness'],
    domain: 'Modulation & Comms',
    phase: 'Phase 1',
    link: '/docs/Phase-1/Python-SDR',
    intuition: 'How close your arrow hits the target bullseye. If ideal QPSK constellation points are at (1,1), EVM measures the cloud of fuzzy scatter around that ideal point caused by noise, phase jitter, and distortion.',
    reality: 'EVM (%) = sqrt( (1/N) * sum(|S_meas - S_ideal|^2) ) / |S_max_ideal| * 100%. Measured in dB as 20*log10(EVM_percent/100).',
    trap: 'Power Amplifier Non-Linearity: Cranking up RF transmitter gain drives the power amp into saturation (clipping), compressing outer constellation points and degrading EVM drastically.'
  },
  {
    id: 'static-timing-analysis',
    term: 'Static Timing Analysis (STA) & Slack',
    aliases: ['Timing Closure', 'Setup/Hold Margin Verification', 'Critical Path Analysis', 'f_max Timing Constraints'],
    domain: 'Verification & Tools',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilator-Lab',
    intuition: 'Mathematically proving that electrons traveling through silicon will arrive at every single register before the clock tick whistle blows, even on the hottest day of summer with low battery voltage.',
    reality: 'Setup Slack = T_clk - (T_clk_to_q + T_logic + T_routing + T_setup - T_skew). If Slack < 0, timing fails and the circuit will calculate corrupted results at rated frequency.',
    trap: 'A design that works fine on your desk at room temperature can suddenly start generating random memory corruption when placed in an uncooled enclosure due to negative temperature slack.'
  },
  {
    id: 'verilator-lab',
    term: 'Verilator (Cycle-Accurate C++ Simulation)',
    aliases: ['2-State C++ Transpiler', 'Fast RTL Testbench Engine', 'Open-Source Hardware Verification'],
    domain: 'Verification & Tools',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilator-Lab',
    intuition: 'Translates your Verilog hardware into ultra-optimized, compiled C++ code that simulates hundreds of thousands of clock cycles per second—fast enough to test real streaming RF data.',
    reality: 'Flattens synthesis-ready Verilog into deterministic 2-state (0 and 1) evaluation loops. Bypasses the slow event-driven queue architectures of legacy commercial simulators.',
    trap: 'The 2-State Trap! Verilator ignores undefined \'X\' and high-impedance \'Z\' states. If an uninitialized register causes a real hardware bug, Verilator may silently initialize it as 0 and falsely pass!'
  },
  {
    id: 'lut-fabric',
    term: 'Look-Up Table (LUT) & FPGA Fabric',
    aliases: ['Configurable Logic Block (CLB)', 'Logic Element (LE)', 'K-Input Function Generator', 'Distributed RAM'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilog-Paradigms',
    intuition: 'Instead of soldering real NAND and OR gates, an FPGA has millions of tiny 6-input memory tables loaded with your logic answers. Whatever 6 bits you put in, the table instantly emits the output bit.',
    reality: 'Modern architectures use 6-input LUTs (64 bits of static RAM) paired with multiplexers, dedicated carry chains, and flip-flops within a Configurable Logic Block (CLB).',
    trap: 'Long combinational LUT cascades: Chaining complex `case` and arithmetic operations through 8 consecutive LUTs creates huge propagation delays, killing your maximum operating clock frequency.'
  },
  {
    id: 'bram-memory',
    term: 'Block RAM (BRAM) & Dual-Port Memory',
    aliases: ['Embedded SRAM Macro', 'True Dual-Port RAM', 'FIFO Memory Primitive', 'UltraRAM (URAM)'],
    domain: 'FPGA & Verilog',
    phase: 'Phase 2',
    link: '/docs/Phase-2/Verilog-Paradigms',
    intuition: 'Dedicated on-chip memory bank vaults located directly on the silicon wafer. Perfect for storing FIR coefficients, sine lookup tables, and RF packet buffers.',
    reality: 'Typically 18Kb or 36Kb synchronous dual-port RAM macros supporting independent clocks, addresses, and read/write operations on Port A and Port B simultaneously.',
    trap: 'Synchronous Read Latency: BRAM outputs data at least 1 clock cycle AFTER the address is presented. Expecting combinational (0-cycle) reads will break your DSP pipeline!'
  }
];

const DOMAINS = ['All', 'DSP & RF', 'FPGA & Verilog', 'Fixed-Point Math', 'Bus Protocols & SoC', 'Modulation & Comms', 'Verification & Tools'];
const PHASES = ['All Phases', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

export default function FieldCodex(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedPhase, setSelectedPhase] = useState('All Phases');
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdr-fpga-codex-starred');
      if (saved) {
        setStarredIds(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore in SSR
    }
  }, []);

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
    } catch (e) {}
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
    if (isFlashcardMode) {
      setFlashcardIndex(randomIndex);
      setIsFlipped(false);
    } else {
      const targetTerm = filteredTerms[randomIndex];
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
          <h1 className={styles.heroTitle}>SDR & FPGA Field Codex & Thesaurus</h1>
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
              onClick={() => setIsFlipped(!isFlipped)}>
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
                    👉 Click Card to Flip & Reveal
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
                    <div className={styles.sectionTitle}>⚙️ Hardware & Math Reality</div>
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
                <Link to={currentFlashcard.link} className={styles.phaseLink} onClick={e => e.stopPropagation()}>
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
                        <Link to={item.link} className={styles.phaseLink}>
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
