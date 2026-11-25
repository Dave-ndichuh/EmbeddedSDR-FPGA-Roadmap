export interface ExplanationItem {
  id: string;
  triggers: string[];
  title: string;
  type: 'formula' | 'concept' | 'hardware' | 'protocol';
  formula?: string;
  simplified: string;
  derivation?: {
    overview: string;
    steps: {
      label: string;
      math?: string;
      desc: string;
    }[];
    conclusion: string;
  };
  hardwareReality: string;
  gotcha: string;
  relatedLink: string;
}

export const EXPLAINER_DATABASE: ExplanationItem[] = [
  {
    id: 'nyquist-shannon',
    triggers: [
      'nyquist', 'sampling theorem', 'shannon', 'fs > 2 fmax', 'fs > 2fmax',
      'folding frequency', 'f_alias', 'falias', 'whittaker-shannon', 'aliasing',
      'anti-aliasing', 'nyquist rate', 'nyquist criterion'
    ],
    title: 'Nyquist-Shannon Sampling Theorem & Aliasing',
    type: 'formula',
    formula: 'f_s > 2 f_{\\max} \\quad \\implies \\quad f_{\\text{alias}} = |f_{\\text{in}} - k \\cdot f_s|',
    simplified: 'To digitally capture an analog wave without losing information, you must take samples at more than TWICE the highest frequency component present. If you sample any slower, high frequencies masquerade as low frequencies (aliasing), just like a helicopter rotor appearing to spin backwards on camera.',
    derivation: {
      overview: 'How does discrete time sampling mathematically create spectral replicas and aliasing?',
      steps: [
        {
          label: '1. Ideal Dirac Impulse Train Sampling',
          math: 'x_s(t) = x(t) \\cdot p(t) = x(t) \\cdot \\sum_{n=-\\infty}^{\\infty} \\delta(t - n T_s)',
          desc: 'Sampling in time is modeled by multiplying the continuous signal x(t) with a periodic Dirac delta impulse comb p(t) spaced by Ts = 1/fs.'
        },
        {
          label: '2. Multiplication in Time = Convolution in Frequency',
          math: 'X_s(f) = X(f) * P(f)',
          desc: 'By the Fourier Transform convolution theorem, multiplying two time-domain signals equals convolving their respective frequency spectra.'
        },
        {
          label: '3. Fourier Transform of the Dirac Comb',
          math: 'P(f) = \\mathcal{F}\\left\\{\\sum_{n=-\\infty}^{\\infty} \\delta(t - n T_s)\\right\\} = \\frac{1}{T_s} \\sum_{k=-\\infty}^{\\infty} \\delta(f - k f_s)',
          desc: 'The Fourier transform of a Dirac delta train of period Ts is another Dirac delta train in frequency spaced by fs = 1/Ts with scaling 1/Ts.'
        },
        {
          label: '4. Spectral Replicas Generated',
          math: 'X_s(f) = X(f) * \\left[ \\frac{1}{T_s} \\sum_{k=-\\infty}^{\\infty} \\delta(f - k f_s) \\right] = \\frac{1}{T_s} \\sum_{k=-\\infty}^{\\infty} X(f - k f_s)',
          desc: 'Convolving X(f) with each shifted delta function creates infinite spectral copies (replicas) of the original spectrum centered at multiples of fs (0, ±fs, ±2fs, ...).'
        },
        {
          label: '5. Non-Overlapping Condition (The Nyquist Bound)',
          math: 'f_s - f_{\\max} > f_{\\max} \\implies f_s > 2 f_{\\max}',
          desc: 'The baseband replica extends from -fmax to +fmax. The first adjacent replica centered at fs extends from (fs - fmax) to (fs + fmax). To prevent the lower edge of the replica from overlapping the upper edge of baseband, we must have fs - fmax > fmax, yielding fs > 2 fmax.'
        },
        {
          label: '6. Sinc Interpolation Reconstruction',
          math: 'x(t) = \\sum_{n=-\\infty}^{\\infty} x(n T_s) \\operatorname{sinc}\\left(\\frac{t - n T_s}{T_s}\\right)',
          desc: 'Passing Xs(f) through an ideal brick-wall analog low-pass filter (rect in frequency) multiplies by rect(f/fs), which corresponds to convolving discrete samples with a sinc function in time.'
        }
      ],
      conclusion: 'If fs <= 2 fmax, the spectral replicas collide and fold into baseband at f_alias = |f_in - k*fs|. Once aliased, no mathematical or software filter can ever separate the alias from true baseband signals.'
    },
    hardwareReality: 'In real SDR hardware, ADCs are preceded by an analog Anti-Aliasing Filter (AAF). Engineers intentionally oversample (e.g., 4x or 8x Nyquist) to widen the analog transition band, allowing simple, cheap analog LC filters followed by sharp digital decimation filters in the FPGA.',
    gotcha: 'Trying to filter out aliased signals in Verilog or Python! Once sampled, a 65 MHz alias sampled at 40 MHz looks identical to a genuine 15 MHz signal. The analog filter MUST precede the ADC.',
    relatedLink: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'iq-sampling',
    triggers: [
      'iq', 'in-phase', 'quadrature', 'complex baseband', 'analytic signal',
      'hilbert', 'complex envelope', 'cos(2pi fc t)', 'sin(2pi fc t)', 'z[n] = i[n] + jq[n]'
    ],
    title: 'In-Phase & Quadrature (IQ) Complex Representation',
    type: 'formula',
    formula: 's(t) = I(t)\\cos(2\\pi f_c t) - Q(t)\\sin(2\\pi f_c t) \\longleftrightarrow z[n] = I[n] + j Q[n]',
    simplified: 'Real-only numbers cannot distinguish between clockwise and counter-clockwise rotation because cos(ωt) = cos(-ωt). By splitting a radio wave into two orthogonal channels 90 degrees apart (I and Q), we get a 2D rotating vector (phasor) that cleanly separates positive from negative frequencies.',
    derivation: {
      overview: 'Deriving the complex envelope and quadrature demodulation equations.',
      steps: [
        {
          label: '1. General Bandpass Signal Representation',
          math: 's(t) = A(t) \\cos(2\\pi f_c t + \\phi(t))',
          desc: 'Any modulated radio carrier has time-varying amplitude A(t) and phase phi(t).'
        },
        {
          label: '2. Trigonometric Expansion',
          math: 's(t) = A(t)\\cos(\\phi(t))\\cos(2\\pi f_c t) - A(t)\\sin(\\phi(t))\\sin(2\\pi f_c t)',
          desc: 'Using the angle addition identity: cos(a + b) = cos(a)cos(b) - sin(a)sin(b).'
        },
        {
          label: '3. Defining In-Phase and Quadrature Components',
          math: 'I(t) \\triangleq A(t)\\cos(\\phi(t)), \\quad Q(t) \\triangleq A(t)\\sin(\\phi(t))',
          desc: 'I(t) is in-phase with the cosine carrier; Q(t) is in quadrature (90° out of phase) with the sine carrier.'
        },
        {
          label: '4. Complex Analytic Signal (Euler Notation)',
          math: 'z(t) = I(t) + j Q(t) = A(t) e^{j \\phi(t)}',
          desc: 'Expressing [I, Q] as a complex number enables instantaneous magnitude A(t) = sqrt(I^2 + Q^2) and instantaneous phase phi(t) = atan2(Q, I).'
        }
      ],
      conclusion: 'IQ mixing translates an asymmetric RF bandwidth centered at fc down to baseband centered at 0 Hz without folding positive and negative sidebands onto each other.'
    },
    hardwareReality: 'The RF front-end splits the antenna signal to two analog mixers: one driven by LO cos(2pi fc t) and the other by LO shifted by 90° (-sin(2pi fc t)). Both outputs pass through identical ADCs to produce two parallel digital buses.',
    gotcha: 'IQ Imbalance! Even a 0.5 dB gain difference or 1° phase error between the two analog mixer branches creates an unwanted ghost image spur at -f in your FFT spectrum.',
    relatedLink: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'dds-nco',
    triggers: [
      'dds', 'nco', 'numerically controlled oscillator', 'direct digital synthesis',
      'tuning word', 'phase accumulator', 'fout = (m * fclk) / 2^n', 'phase truncation'
    ],
    title: 'Direct Digital Synthesis (DDS / NCO) Frequency Equation',
    type: 'formula',
    formula: 'f_{\\text{out}} = \\frac{M \\cdot f_{\\text{clk}}}{2^N} \\quad \\implies \\quad \\Delta f = \\frac{f_{\\text{clk}}}{2^N}',
    simplified: 'A digital frequency synthesizer is like an odometer that increments by a constant step M every clock tick. When the N-bit odometer rolls over (360° phase), it indexes a lookup table to output a pure sine wave with micro-Hertz precision.',
    derivation: {
      overview: 'Deriving the exact DDS tuning word equation from phase accumulator rollover.',
      steps: [
        {
          label: '1. Phase Accumulator Update Rule',
          math: '\\theta[n] = (\\theta[n-1] + M) \\pmod{2^N}',
          desc: 'An N-bit register accumulates an integer Tuning Word M on every positive clock edge.'
        },
        {
          label: '2. Full Cycle Definition',
          math: '2^N \\text{ counts} = 2\\pi \\text{ radians} = 1 \\text{ full sine cycle}',
          desc: 'The binary range 0 to 2^N - 1 maps linearly to phase angles 0 to 2pi.'
        },
        {
          label: '3. Number of Clock Cycles per Output Wave',
          math: 'T_{\\text{out}} = \\frac{2^N}{M} \\cdot T_{\\text{clk}} = \\frac{2^N}{M \\cdot f_{\\text{clk}}}',
          desc: 'Because each clock cycle adds M counts, it takes 2^N / M clock periods for the accumulator to wrap around exactly once.'
        },
        {
          label: '4. Output Frequency Inversion',
          math: 'f_{\\text{out}} = \\frac{1}{T_{\\text{out}}} = \\frac{M \\cdot f_{\\text{clk}}}{2^N}',
          desc: 'Taking the reciprocal yields the fundamental output frequency formula.'
        },
        {
          label: '5. Tuning Resolution (Minimum Frequency Step)',
          math: '\\Delta f = \\left. f_{\\text{out}} \\right|_{M=1} = \\frac{f_{\\text{clk}}}{2^N}',
          desc: 'For a 100 MHz clock and a 32-bit accumulator (N=32), delta_f = 100e6 / 2^32 = 0.02328 Hz per bit!'
        }
      ],
      conclusion: 'By altering the 32-bit integer M, you can tune the frequency instantaneously in a single clock cycle with phase-continuous agility—ideal for radar chirps and frequency-hopping SDR.'
    },
    hardwareReality: 'In Verilog, a DDS is simply: always @(posedge clk) phase_acc <= phase_acc + tuning_word; followed by taking the top 10-12 bits to address a BRAM sine ROM table.',
    gotcha: 'Phase Truncation Spurs! Because a 32-bit LUT would require 4 billion memory entries, you only use the upper P bits (e.g. 10 bits) for the ROM address. Discarding the lower bits creates periodic phase truncation noise (SFDR spurs).',
    relatedLink: '/docs/Phase-3/DDS-NCO'
  },
  {
    id: 'fixed-point-q',
    triggers: [
      'fixed point', 'fixed-point', 'q1.15', 'qm.n', 'q-format', 'radix point',
      'two\'s complement', 'fractional bits', 'saturation', 'bit growth'
    ],
    title: 'Fixed-Point Arithmetic (Qm.n) & Multiplication Growth',
    type: 'formula',
    formula: 'Q_{m_1.n_1} \\times Q_{m_2.n_2} \\longrightarrow Q_{(m_1+m_2).(n_1+n_2)} \\quad \\text{e.g. } Q_{1.15} \\times Q_{1.15} = Q_{2.30}',
    simplified: 'FPGAs do not have hardware floating-point ALUs by default. Instead, we use standard integer binary numbers with an agreed-upon imaginary decimal point. Multiplying two 16-bit Q1.15 fractions produces a 32-bit Q2.30 result that must be trimmed back.',
    derivation: {
      overview: 'Mathematical rules of fixed-point scaling, range, resolution, and bit-growth.',
      steps: [
        {
          label: '1. Value Representation',
          math: 'X = \\text{Integer} \\times 2^{-n}',
          desc: 'A Qm.n number represents a real value equal to its binary two\'s complement integer divided by 2^n.'
        },
        {
          label: '2. Range and Resolution',
          math: '\\text{Resolution} = 2^{-n}, \\quad \\text{Range} = [-2^{m-1}, \\; 2^{m-1} - 2^{-n}]',
          desc: 'For signed Q1.15: m=1 (sign), n=15 (fractions). Range is [-1.0, +0.999969] with resolution 2^-15 = 3.05e-5.'
        },
        {
          label: '3. Multiplication Bit Growth',
          math: '(A \\cdot 2^{-n_1}) \\times (B \\cdot 2^{-n_2}) = (A \\cdot B) \\cdot 2^{-(n_1 + n_2)}',
          desc: 'Multiplying two numbers adds their integer bits and fractional bits. Q1.15 x Q1.15 = Q2.30 (32 bits total).'
        },
        {
          label: '4. Truncation / Normalization to Q1.15',
          math: '\\text{Result}[15:0] = \\text{Product}[30:15]',
          desc: 'In Q2.30, bit 31 and bit 30 are redundant sign bits for values in [-1, +1). We drop bit 31, slice bits [30:15], and discard lower fractional bits [14:0].'
        }
      ],
      conclusion: 'Always account for sign bits and bit-growth during arithmetic elaboration to avoid silent overflows.'
    },
    hardwareReality: 'Modern FPGA DSP slices (like DSP48E2) take 27x18 or 25x18 bit signed inputs and accumulate into a wide 48-bit register, preventing intermediate overflow during FIR MAC operations.',
    gotcha: 'The Two\'s Complement -1.0 x -1.0 Trap! In Q1.15, -1.0 is 0x8000. Squaring it produces +1.0 (0x40000000 in Q2.30), which cannot be represented in signed Q1.15 (max is +0.9999) and wraps around to -1.0 without saturation logic!',
    relatedLink: '/docs/Phase-3/Fixed-Point-Math'
  },
  {
    id: 'fir-transposed',
    triggers: [
      'transposed fir', 'direct form', 'fir filter', 'taps', 'convolution',
      'symmetric fir', 'pre-adder', 'y[n] = sum(bk * x[n-k])', 'dsp slice'
    ],
    title: 'Transposed Form vs. Direct Form FIR Filter Architecture',
    type: 'hardware',
    formula: 'y[n] = \\sum_{k=0}^{M} b_k \\cdot x[n-k] \\quad \\longleftrightarrow \\quad t_{\\text{crit}} = t_{\\text{mult}} + t_{\\text{add}}',
    simplified: 'Direct Form feeds samples through a shift register delay line and adds all products together in a giant adder tree (which fails timing at high speeds). Transposed Form broadcasts the input simultaneously to all multipliers and places registers between each adder, keeping the critical path delay constant regardless of tap count.',
    derivation: {
      overview: 'Transforming Direct Form into Transposed Form via Tellegen\'s Theorem (Signal Flow Graph Transposition).',
      steps: [
        {
          label: '1. Standard FIR Difference Equation',
          math: 'Y(z) = \\sum_{k=0}^{M} b_k X(z) z^{-k} = b_0 X(z) + b_1 X(z)z^{-1} + b_2 X(z)z^{-2} + \\dots',
          desc: 'In Direct Form, the input X(z) is delayed tap by tap, multiplied by bk, and summed.'
        },
        {
          label: '2. Factoring the Delay Elements (Horner\'s Form)',
          math: 'Y(z) = b_0 X(z) + z^{-1}\\left(b_1 X(z) + z^{-1}\\left(b_2 X(z) + \\dots\\right)\\right)',
          desc: 'By factoring out z^-1 recursively, every addition is followed immediately by a single delay element z^-1.'
        },
        {
          label: '3. Critical Path Boundedness',
          math: 't_{\\text{crit, Transposed}} = t_{\\text{mult}} + t_{\\text{add}} \\quad \\text{vs} \\quad t_{\\text{crit, Direct}} = t_{\\text{mult}} + \\lceil \\log_2(M) \\rceil \\cdot t_{\\text{add}}',
          desc: 'In Direct Form, summing M taps requires an adder tree with log2(M) cascaded logic levels. In Transposed Form, registers sit between every single adder stage!'
        }
      ],
      conclusion: 'Transposed Form achieves the maximum possible clock frequency (f_max > 400 MHz) in modern FPGAs.'
    },
    hardwareReality: 'FPGA DSP slices have built-in cascade registers (PCOUT to PCIN) wired in silicon specifically for Transposed FIR chains, bypassing generic routing wires entirely.',
    gotcha: 'Initial latency delay: Unlike Direct Form, where output appears immediately for tap b0, Transposed Form has an initial pipeline latency equal to the number of taps before the first output settles.',
    relatedLink: '/docs/Phase-3/Hardware-FIR'
  },
  {
    id: 'static-timing-analysis',
    triggers: [
      'static timing analysis', 'sta', 'setup slack', 'hold slack', 'tsetup',
      'thold', 'tclk_to_q', 'critical path', 'timing closure', 'metastability',
      'fmax'
    ],
    title: 'Static Timing Analysis (STA) & Setup/Hold Slack',
    type: 'formula',
    formula: '\\text{Slack}_{\\text{setup}} = T_{\\text{clk}} + T_{\\text{skew}} - (T_{\\text{co}} + T_{\\text{comb}} + T_{\\text{su}})',
    simplified: 'STA mathematically proves that electrical signals traveling through physical silicon transistors arrive at the next flip-flop before the clock edge ticks. If the arrival delay exceeds the clock period, Slack becomes negative and the circuit corrupts data.',
    derivation: {
      overview: 'Deriving the fundamental setup and hold timing inequality equations.',
      steps: [
        {
          label: '1. Launch-to-Capture Clock Period',
          math: 'T_{\\text{arrival}} = T_{\\text{co}} + T_{\\text{data_path}}',
          desc: 'When flip-flop 1 launches data on a clock edge, it takes Tco (clock-to-output) to exit the register, plus Tdata_path to propagate through combinational LUTs and routing wires.'
        },
        {
          label: '2. Capture Edge Required Time',
          math: 'T_{\\text{required}} = T_{\\text{clk}} + T_{\\text{skew}} - T_{\\text{su}}',
          desc: 'The capturing flip-flop requires data to be completely stable for at least Tsu (setup time) prior to the next clock edge.'
        },
        {
          label: '3. Setup Slack Equation',
          math: '\\text{Slack}_{\\text{setup}} = T_{\\text{required}} - T_{\\text{arrival}} = (T_{\\text{clk}} + T_{\\text{skew}} - T_{\\text{su}}) - (T_{\\text{co}} + T_{\\text{data_path}})',
          desc: 'Positive slack means data arrives with margin to spare. Negative slack means timing violation and hardware failure.'
        },
        {
          label: '4. Maximum Operating Clock Frequency',
          math: 'f_{\\max} = \\frac{1}{T_{\\text{co}} + T_{\\text{data_path}} + T_{\\text{su}} - T_{\\text{skew}}}',
          desc: 'The longest data path in the design (the Critical Path) dictates the absolute ceiling on FPGA clock speed.'
        }
      ],
      conclusion: 'To increase f_max, insert pipeline registers into long combinational logic paths to divide Tdata_path into smaller segments.'
    },
    hardwareReality: 'The FPGA vendor place-and-route engine (Vivado / Quartus) reports Worst Negative Slack (WNS). If WNS < 0, the bitstream cannot be certified for production.',
    gotcha: 'A design that passes simulation with flying colors can fail completely on the physical FPGA chip if negative setup slack violates timing margins at high ambient temperatures.',
    relatedLink: '/docs/Phase-2/Verilog-Paradigms'
  },
  {
    id: 'axi-stream',
    triggers: [
      'axi4-stream', 'axis', 'tvalid', 'tready', 'tdata', 'tlast',
      'backpressure', 'handshake', 'amba'
    ],
    title: 'AXI4-Stream Protocol Handshake & Anti-Deadlock Rule',
    type: 'protocol',
    formula: '\\text{Transfer} \\iff (\\text{TVALID} \\land \\text{TREADY} \\land \\text{posedge ACLK}) == 1',
    simplified: 'A high-speed industrial conveyor belt with two indicator lights: Producer says "data is valid" (TVALID) and Consumer says "I have buffer space" (TREADY). Data transfers ONLY on clock ticks where BOTH lights are asserted simultaneously.',
    derivation: {
      overview: 'ARM AMBA AXI4-Stream state machine handshaking rules.',
      steps: [
        {
          label: '1. Handshake Strobe Condition',
          math: '\\text{posedge ACLK}: \\; (\\text{TVALID} == 1 \\;\\land\\; \\text{TREADY} == 1)',
          desc: 'Data cannot be transferred if either TVALID or TREADY is 0.'
        },
        {
          label: '2. The Fundamental Anti-Deadlock Rule',
          math: '\\text{TVALID} \\text{ MUST NOT depend on } \\text{TREADY}',
          desc: 'A master must NEVER wait for TREADY to assert before it asserts TVALID. A master must assert TVALID whenever it has data ready.'
        },
        {
          label: '3. Data Stability Guarantee',
          math: '\\text{Once TVALID is asserted, TDATA must remain unchanged until handshake occurs}',
          desc: 'The master cannot change or withdraw TDATA until TREADY asserts and the clock edge captures it.'
        }
      ],
      conclusion: 'Adhering to these rules guarantees lossless, zero-copy streaming between ADC IP cores, FIR filters, and DMA controllers.'
    },
    hardwareReality: 'In Verilog, standard AXIS modules use skid buffers or synchronous FIFOs to isolate timing paths between master TVALID and slave TREADY.',
    gotcha: 'Circular Deadlock! If Master A waits for Slave B to assert TREADY before asserting TVALID, and Slave B waits for Master A to assert TVALID before asserting TREADY, the bus freezes permanently.',
    relatedLink: '/docs/Phase-4'
  },
  {
    id: 'dft-fft',
    triggers: [
      'dft', 'fft', 'fast fourier transform', 'discrete fourier transform',
      'frequency resolution', 'delta f = fs / n', 'spectral bins'
    ],
    title: 'Discrete Fourier Transform (DFT) & Bin Resolution',
    type: 'formula',
    formula: 'X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j 2 \\pi \\frac{k n}{N}} \\quad \\implies \\quad \\Delta f = \\frac{f_s}{N}',
    simplified: 'The DFT decomposes a discrete time-domain signal into its constituent frequency sine waves. The Fast Fourier Transform (FFT) is an ultra-fast O(N log N) algorithm to calculate the exact same DFT result.',
    derivation: {
      overview: 'Orthogonal projection of discrete samples onto complex sinusoids.',
      steps: [
        {
          label: '1. Complex Basis Sinusoids',
          math: '\\phi_k[n] = e^{j 2\\pi \\frac{k n}{N}} = \\cos\\left(\\frac{2\\pi k n}{N}\\right) + j \\sin\\left(\\frac{2\\pi k n}{N}\\right)',
          desc: 'The set of N complex sinusoids forms an orthogonal basis spanning the N-dimensional discrete vector space.'
        },
        {
          label: '2. Inner Product Projection (The DFT)',
          math: 'X[k] = \\langle x[n], \\phi_k[n] \\rangle = \\sum_{n=0}^{N-1} x[n] e^{-j 2\\pi \\frac{k n}{N}}',
          desc: 'Taking the inner product measures the correlation (spectral energy) between input signal x[n] and the k-th frequency harmonic.'
        },
        {
          label: '3. Frequency Bin Resolution',
          math: '\\Delta f = \\frac{f_s}{N} = \\frac{1}{N T_s} = \\frac{1}{T_{\\text{window}}}',
          desc: 'The width of each FFT bin is exactly equal to the sample rate divided by the FFT point size N.'
        }
      ],
      conclusion: 'To resolve two closely spaced radio signals, you must increase the observation window time T_window = N / fs.'
    },
    hardwareReality: 'FPGA FFT cores (like Xilinx LogiCORE FFT) use Radix-2 or Radix-4 Cooley-Tukey butterfly architectures pipelined with Block RAMs to process real-time streaming IQ data.',
    gotcha: 'Spectral Leakage: If an input signal frequency does not land exactly on an integer FFT bin, its energy smears across adjacent bins. Windowing functions (Hann, Blackman-Harris) are required to suppress sidelobes.',
    relatedLink: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'cordic-algorithm',
    triggers: [
      'cordic', 'volder', 'vectoring', 'rotation mode', 'shift and add',
      'atan(2^-i)', 'cordic gain', 'k = 1.64676'
    ],
    title: 'CORDIC Algorithm & Processing Gain',
    type: 'formula',
    formula: 'x_{i+1} = x_i - d_i y_i 2^{-i}, \\quad y_{i+1} = y_i + d_i x_i 2^{-i} \\quad \\implies \\quad K = \\prod_{i=0}^{\\infty} \\sqrt{1 + 2^{-2i}} \\approx 1.64676',
    simplified: 'CORDIC computes sines, cosines, Cartesian-to-polar coordinates, and vector rotations using ONLY bit-shifts and additions—zero hardware multipliers needed! It rotates a vector in halving angular increments (45°, 26.5°, 14°...).',
    derivation: {
      overview: 'Decomposing 2D Givens rotation into power-of-2 tangent steps.',
      steps: [
        {
          label: '1. Standard 2D Rotation Matrix',
          math: '\\begin{bmatrix} x_{i+1} \\\\ y_{i+1} \\end{bmatrix} = \\begin{bmatrix} \\cos\\theta_i & -\\sin\\theta_i \\\\ \\sin\\theta_i & \\cos\\theta_i \\end{bmatrix} \\begin{bmatrix} x_i \\\\ y_i \\end{bmatrix} = \\cos\\theta_i \\begin{bmatrix} 1 & -\\tan\\theta_i \\\\ \\tan\\theta_i & 1 \\end{bmatrix} \\begin{bmatrix} x_i \\\\ y_i \\end{bmatrix}',
          desc: 'Factoring out cos(theta_i) leaves tangent operations.'
        },
        {
          label: '2. Restricting Angles to Powers of 2',
          math: '\\tan\\theta_i = d_i \\cdot 2^{-i}, \\quad d_i \\in \\{-1, +1\\}',
          desc: 'By choosing angles where tan(theta_i) = 2^-i, multiplication by tangent reduces to a simple right bit-shift (>> i).'
        },
        {
          label: '3. Accumulating the Systematic Gain',
          math: 'K = \\prod_{i=0}^{N-1} \\frac{1}{\\cos\\theta_i} = \\prod_{i=0}^{N-1} \\sqrt{1 + \\tan^2\\theta_i} = \\prod_{i=0}^{N-1} \\sqrt{1 + 2^{-2i}} \\approx 1.646760258',
          desc: 'Because each pseudo-rotation stretches the vector length by sqrt(1 + 2^-2i), the overall vector grows by constant factor K.'
        }
      ],
      conclusion: 'To recover the true amplitude, multiply the final result by 1/K ≈ 0.607252935.'
    },
    hardwareReality: 'Ideal for FPGAs without spare DSP slices: an N-stage pipelined CORDIC outputs 1 sine/cosine sample every single clock cycle using only standard LUT adders and registers.',
    gotcha: 'Forgetting to scale down by 1/K! The ~1.647x magnitude growth will overflow fixed-point registers unless extra headroom bits are provided.',
    relatedLink: '/docs/Phase-3/DDS-NCO'
  },
  {
    id: 'inferred-latches',
    triggers: [
      'latch', 'inferred latch', 'transparent latch', 'incomplete if',
      'missing else', 'always @(*)', 'always_comb'
    ],
    title: 'Inferred Transparent Latches & Combinational Hazards',
    type: 'hardware',
    formula: '\\text{Incomplete Branch in } \\text{always @(*)} \\implies \\text{Unintentional Memory Latch}',
    simplified: 'In Verilog, if you tell the FPGA what to do when an input is TRUE, but forget to define what happens when it is FALSE, the FPGA must retain its previous value. Because there is no clock, it infers an asynchronous transparent latch using loopback LUT gates.',
    derivation: {
      overview: 'Why incomplete assignments force the synthesizer to infer level-sensitive latches.',
      steps: [
        {
          label: '1. Combinational Invariance Rule',
          math: 'Y = f(X_1, X_2, \\dots, X_n)',
          desc: 'In pure combinational logic, output Y must be a direct function of current inputs only, with zero memory of past states.'
        },
        {
          label: '2. Incomplete Specification Hazard',
          math: '\\text{if (enable) } Y = A; \\quad \\text{// What if enable == 0?}',
          desc: 'When enable is 0, the semantics of IEEE Verilog require Y to hold its previous value: Y(t) = Y(t - dt).'
        },
        {
          label: '3. Hardware Inference of Asynchronous Latch',
          math: 'Y = \\text{enable} \\cdot A + \\overline{\\text{enable}} \\cdot Y',
          desc: 'To hold state without a clock, the tool builds a feedback loop inside a LUT. This forms an asynchronous D-latch.'
        }
      ],
      conclusion: 'Modern FPGAs do not have native physical latches. Synthesizing them from LUT feedback loops creates severe glitches, race conditions, and timing analysis failures.'
    },
    hardwareReality: 'Always initialize outputs to default values at the top of the block, or use SystemVerilog `always_comb` which raises a compile-time error if a latch is inferred.',
    gotcha: 'Board thermal runaway: Inferred latches create asynchronous feedback paths that cause high-frequency internal oscillations, causing the FPGA chip to overheat and lock up.',
    relatedLink: '/docs/Phase-2/Verilog-Paradigms'
  }
];

export function findExplanation(query: string): ExplanationItem | null {
  if (!query || query.trim().length === 0) return null;
  const clean = query.trim().toLowerCase();

  // 1. Direct Trigger Substring or Exact Match
  for (const item of EXPLAINER_DATABASE) {
    for (const trigger of item.triggers) {
      if (clean === trigger || clean.includes(trigger) || trigger.includes(clean)) {
        return item;
      }
    }
  }

  // 2. Title Match
  for (const item of EXPLAINER_DATABASE) {
    if (item.title.toLowerCase().includes(clean) || clean.includes(item.id)) {
      return item;
    }
  }

  // 3. Fallback: Search in Simplified and Reality text
  for (const item of EXPLAINER_DATABASE) {
    if (item.simplified.toLowerCase().includes(clean) || item.hardwareReality.toLowerCase().includes(clean)) {
      return item;
    }
  }

  return null;
}
