---
sidebar_position: 6
---

# 📖 SDR & FPGA Engineer's Field Codex & Thesaurus

Welcome to the **SDR & FPGA Engineer's Field Codex & Thesaurus**. 

Bridging software DSP, digital communications, digital electronics, and FPGA microarchitecture requires navigating a dense forest of industry jargon, academic acronyms, and vendor dialects. A single concept is often called three different things depending on whether you are talking to an RF engineer, a DSP mathematician, or an ASIC/FPGA digital designer.

This guide provides:
1. **Thesaurus & Aliases (Cross-Domain Terminology)**: What other fields call the exact same thing.
2. **The 10-Second Intuition (Mental Model)**: Plain English analogies to anchor the core concept.
3. **The Hardware / Mathematical Reality**: Formulas, Verilog semantics, and bus timing diagrams.
4. **The 2 AM War Story (The Trap / Gotcha)**: High-stakes mistakes that burn junior engineers in the lab.

> [!TIP]
> **Prefer an interactive UI?** Check out the live [Interactive Field Codex & Flashcards](/glossary) for dynamic search, domain filters, and active-recall flashcard study mode!

---

## 📡 1. Digital Signal Processing & RF Mathematics

### Nyquist-Shannon Sampling Theorem & Aliasing
- **Thesaurus / Also Known As:** Whittaker-Shannon Theorem, Cardinal Interpolation, Folding Frequency, Anti-Aliasing Filter (AAF).
- **Curriculum Link:** [Phase 1: DSP Theory](/docs/Phase-1/DSP-Theory)
- **The 10-Second Intuition:** Like watching a helicopter or car wheel on video: if the camera shutter clicks too slowly, the propeller appears stationary or spins backwards! Insufficient sampling makes high-frequency oscillations appear identical to slower ones.
- **The Rigorous Reality:**
  - Nyquist Criterion: $f_s > 2 f_{\max}$.
  - Reconstruction: $x(t) = \sum_{n=-\infty}^{\infty} x(n T_s) \operatorname{sinc}\left(\frac{t - n T_s}{T_s}\right)$.
  - Aliasing calculation for an input $f_{\text{in}} > f_s/2$:
    $$f_{\text{alias}} = |f_{\text{in}} - k \cdot f_s| \quad \text{where } 0 \le f_{\text{alias}} \le \frac{f_s}{2}$$
- **The 2 AM War Story:** Once an analog signal is sampled and aliased, **no digital filter or software algorithm can ever remove the alias**. An analog Low-Pass Anti-Aliasing Filter (AAF) *must* precede the ADC converter in hardware.

---

### In-Phase & Quadrature (IQ) Sampling
- **Thesaurus / Also Known As:** Complex Baseband, Quadrature Demodulation, Analytic Signal, Complex Envelope, Orthogonal Subcarriers.
- **Curriculum Link:** [Phase 1: DSP Theory](/docs/Phase-1/DSP-Theory)
- **The 10-Second Intuition:** Real-valued numbers only measure displacement along a single line; they cannot tell if a wheel rotates clockwise or counter-clockwise because $\cos(\omega t) = \cos(-\omega t)$. IQ representation gives you a 2D rotating vector (like clock hands), unlocking true positive vs. negative frequencies.
- **The Rigorous Reality:**
  $$s(t) = I(t)\cos(2\pi f_c t) - Q(t)\sin(2\pi f_c t)$$
  - Instantaneous Amplitude: $A(t) = \sqrt{I^2(t) + Q^2(t)}$
  - Instantaneous Phase: $\theta(t) = \operatorname{atan2}(Q(t), I(t))$
  - Complex Signal: $z[n] = I[n] + j Q[n]$
- **The 2 AM War Story:** **IQ Imbalance!** Analog mixers and ADCs are never perfectly matched. A tiny gain mismatch ($0.5\text{ dB}$) or phase skew ($1^\circ$) between the physical I and Q paths creates an "image frequency" ghost spike on the opposite side of DC in your FFT.

---

### Direct Digital Synthesis (DDS / NCO)
- **Thesaurus / Also Known As:** Numerically Controlled Oscillator (NCO), Phase Accumulator Synthesizer, Table-Lookup Oscillator.
- **Curriculum Link:** [Phase 3: DDS / NCO](/docs/Phase-3/DDS-NCO)
- **The 10-Second Intuition:** An odometer ticking upward by a fixed distance every single second. As the odometer rolls over ($360^\circ$), it indexes a pre-computed sine lookup table to produce an analog-pure tone.
- **The Rigorous Reality:**
  $$f_{\text{out}} = \frac{M \cdot f_{\text{clk}}}{2^N}$$
  - Tuning resolution: $\Delta f = \frac{f_{\text{clk}}}{2^N}$
  - For $f_{\text{clk}} = 100\text{ MHz}$ and $N = 32$, $\Delta f \approx 0.023\text{ Hz}$.
- **The 2 AM War Story:** **Phase Truncation Noise!** A 32-bit phase accumulator has 4.2 billion addresses. You cannot fit a 4-billion entry LUT in FPGA BRAM, so you truncate and use only the top 10-12 bits. This periodic truncation injects unwanted harmonic spurs (reducing your Spurious-Free Dynamic Range - SFDR).

---

### Polyphase Filter Bank (PFB) & Channelizer
- **Thesaurus / Also Known As:** Commutator Filter, M-Channel Analysis Bank, Polyphase Decomposition, Spectrum Slicer.
- **Curriculum Link:** [Phase 1: Filtering and Decimation](/docs/Phase-1/Filtering-and-Decimation)
- **The 10-Second Intuition:** Tuning 64 different radio stations simultaneously from a single 100 MHz digitized antenna stream without running 64 duplicate FIR filters.
- **The Rigorous Reality:** Uses the **Noble Polyphase Identity** to commute the downsampler before the filter. Samples are distributed into $M$ sub-filter branches by a rotary commutator, followed by an $M$-point IFFT to separate all sub-bands at the low sample rate.
- **The 2 AM War Story:** **Scalloping Loss:** If your prototype low-pass filter doesn't have an adequately flat passband or proper transition bandwidth, radio channels that land right on the bin boundaries will suffer severe amplitude drops.

---

## ⚡ 2. FPGA & Hardware Description (Verilog/VHDL)

### Inferred Transparent Latches
- **Thesaurus / Also Known As:** Combinational Memory Hazard, Incomplete Assignment Latch, Asynchronous Level-Sensitive Hazard.
- **Curriculum Link:** [Phase 2: Verilog Paradigms](/docs/Phase-2/Verilog-Paradigms)
- **The 10-Second Intuition:** Leaving the door unlocked: you told the FPGA what to do when a condition is met, but forgot to state what to do when it is *not* met. The FPGA is forced to remember old state, synthesizing an accidental latch.
- **The Rigorous Reality:** In an `always @(*)` combinational block, if any variable is not assigned a value across all execution paths (missing `else` or missing default in `case`), a latch is inferred.
- **The 2 AM War Story:** Modern FPGAs have **no dedicated physical transparent latches**! Synthesis tools create them using combinational feedback loops in LUTs, resulting in race conditions, massive timing closure failures, and designs that randomly break when the FPGA gets warm.
- **The Fix:** Always assign safe defaults at the top of your combinational blocks:
```verilog
always @(*) begin
    out = 8'h00; // Safe default prevents latch inference
    if (enable) out = data_in;
end
```

---

### Non-Blocking (`<=`) vs. Blocking (`=`) Assignments
- **Thesaurus / Also Known As:** NBA Update Region vs. Active Events Region, Sequential vs. Combinational Assignments.
- **Curriculum Link:** [Phase 2: Verilog Paradigms](/docs/Phase-2/Verilog-Paradigms)
- **The 10-Second Intuition:** Blocking `=` is cooking a recipe step-by-step in series. Non-blocking `<=` is an army marching forward in unison at the exact crack of the drum.
- **The Rigorous Reality:**
  - Blocking (`=`): Evaluated and written immediately in source text order during the simulator's Active Events region.
  - Non-blocking (`<=`): Evaluates all right-hand sides during the Active region, but defers register updates to the Non-Blocking Assignment (NBA) region.
- **The 2 AM War Story:** Using `=` in sequential `always @(posedge clk)` blocks collapses multi-stage shift registers into single-stage bypasses, creating simulation vs. synthesis mismatches that escape to physical hardware.

---

### Transposed Form vs. Direct Form FIR
- **Thesaurus / Also Known As:** Pipelined Filter Architecture, Broadcast Accumulator Line.
- **Curriculum Link:** [Phase 3: Hardware FIR Filters](/docs/Phase-3/Hardware-FIR)
- **The 10-Second Intuition:** Direct Form lines up a bucket brigade for inputs and dumps them into one giant multi-input adder bowl. Transposed Form broadcasts the input to all multipliers at once and carries partial sums down a conveyor belt with registers in between.
- **The Rigorous Reality:** Transposed form places the unit delay elements ($z^{-1}$) along the summation backbone between adders. The critical path delay is bounded to:
  $$t_{\text{crit}} = t_{\text{mult}} + t_{\text{add}}$$
  independent of the number of filter taps $M$!
- **The 2 AM War Story:** Direct Form adder trees grow logarithmically. When you try to synthesize a 64-tap filter at $200\text{ MHz}$, the routing delay through the adder tree will fail timing closure every time. Transposed Form easily closes timing at maximum clock rate.

---

### DSP Slice (DSP48) & Coefficient Pre-Adder
- **Thesaurus / Also Known As:** Hardened Multiply-Accumulate (MAC), DSP Block, Symmetric Pre-Adder.
- **Curriculum Link:** [Phase 3: Hardware FIR Filters](/docs/Phase-3/Hardware-FIR)
- **The 10-Second Intuition:** Dedicated silicon sports cars embedded in a sea of generic logic gates.
- **The Rigorous Reality:** Hardened arithmetic units with $25 \times 18$ multiplier, 48-bit accumulator, and a **Pre-Adder**. For symmetric FIR filters ($b_k = b_{M-k}$):
  $$y[n] = \sum b_k \cdot (x[n-k] + x[n-M+k])$$
  The pre-adder adds both inputs *before* multiplying, cutting the number of required multipliers and DSP slices in half!
- **The 2 AM War Story:** If you write unpipelined combinational multipliers in Verilog, the synthesis tool cannot map them into DSP slices and instead infers thousands of LUTs, ballooning resource consumption.

---

## 🔢 3. Fixed-Point Math & Precision

### Q-Format Notation ($Q_{m.n}$)
- **Thesaurus / Also Known As:** Fractional Binary Representation, Integer-Scaled Arithmetic, Fixed Radix.
- **Curriculum Link:** [Phase 3: Fixed-Point Arithmetic](/docs/Phase-3/Fixed-Point-Math)
- **The 10-Second Intuition:** Putting an imaginary decimal point inside an ordinary integer. 
- **The Rigorous Reality:** A $Q_{m.n}$ number has $m$ integer bits (including sign) and $n$ fractional bits.
  - Resolution: $2^{-n}$
  - Range: $[-2^{m-1}, 2^{m-1} - 2^{-n}]$
  - Multiplying two $Q_{1.15}$ numbers yields a $Q_{2.30}$ 32-bit result.
- **The 2 AM War Story:** **The $-1.0 \times -1.0$ Overflow Trap!** In signed two's complement $Q_{1.15}$, $-1.0$ is represented as `0x8000`. Multiplying `0x8000` by `0x8000` yields `+1.0` (`0x40000000` in $Q_{2.30}$). When truncated back to 16 bits without saturation logic, it wraps around to $-1.0$ (`0x8000`), injecting an ear-splitting audio blast or corrupted constellation symbol.

---

## 🔌 4. Bus Protocols, Clock Domains & SoC Architecture

### AXI4-Stream Protocol (AXIS)
- **Thesaurus / Also Known As:** TVALID/TREADY Handshake, Point-to-Point Streaming, ARM AMBA Stream.
- **The 10-Second Intuition:** A high-speed industrial conveyor belt with two indicator lights: sender says "item is ready" (`TVALID`), receiver says "shelf has room" (`TREADY`). The item moves strictly on clock ticks where **both** lights are green.
- **The Rigorous Reality:**
  - Handshake condition: `posedge clk` with `TVALID && TREADY == 1`.
  - Signal bus: `TDATA`, `TVALID`, `TREADY`, `TLAST` (packet packet boundary), `TKEEP` (valid byte enables).
- **The 2 AM War Story:** **The AXI Deadlock Rule:** AMBA specification strictly mandates that **`TVALID` must never wait for `TREADY`**. If Master A waits for Slave B's `TREADY`, and Slave B waits for Master A's `TVALID`, the entire bus deadlocks forever.

---

### Clock Domain Crossing (CDC) & Metastability
- **Thesaurus / Also Known As:** Two-Flip-Flop Synchronizer, Setup/Hold Hazard, MTBF (Mean Time Between Failures).
- **The 10-Second Intuition:** Trying to hand a baton between runners on two different conveyor belts traveling at different speeds. If the baton passes during the transition window, the runner stumbles into a dazed, undefined state.
- **The Rigorous Reality:** Violating $t_{\text{setup}}$ or $t_{\text{hold}}$ leaves flip-flop transistor output voltages floating between logic 0 and 1 for an unpredictable resolution time $\tau$. Mitigated with a 2-stage synchronizer chain:
  $$\text{MTBF} \propto \frac{e^{t_{\text{slack}} / \tau}}{f_{\text{clk}} \cdot f_{\text{data}}}$$
- **The 2 AM War Story:** **The Multi-Bit Bus Trap:** Synchronizing a multi-bit binary counter across clock domains with 2-FF chains. Because physical routing delays differ by picoseconds, a transition like `0111` ($7$) to `1000` ($8$) will momentarily arrive as `1111` ($15$) or `0000` ($0$). Always use **Gray Code** or an **Asynchronous Dual-Clock FIFO**!

---

### Direct Memory Access (DMA) & Cache Incoherency
- **Thesaurus / Also Known As:** Zero-Copy Bus Master, PL-to-PS Streaming Bridge, Scatter-Gather Engine.
- **The 10-Second Intuition:** Instead of having the CPU personally carry every single radio sample from the FPGA into DDR RAM with an eyedropper, a DMA engine operates as a robotic forklift moving gigabytes in the background.
- **The Rigorous Reality:** Master AXI bus peripheral that packs AXI-Stream packets into burst-mode AXI4-Full transactions directly into physical system DDR memory, issuing an interrupt when the ring buffer fills.
- **The 2 AM War Story:** **The Stale Cache Bug!** DMA writes new RF samples into physical DDR memory, but the CPU continues reading old data out of its high-speed L1/L2 data cache. You must explicitly invalidate the CPU cache lines before reading DMA buffers in Linux!

---

## 🛰️ 5. Digital Modulation & Synchronization

### Root-Raised Cosine (RRC) & Intersymbol Interference (ISI)
- **Thesaurus / Also Known As:** Nyquist Pulse Shaping, Matched Filter Pair, Raised-Cosine Roll-Off.
- **The 10-Second Intuition:** Softening the edges of square digital pulses so they don't ring and smear into neighboring bit intervals as they travel through a narrow radio channel.
- **The Rigorous Reality:** RRC has a roll-off factor $\alpha \in [0, 1]$. Cascading transmitter and receiver filters ($H_{\text{total}}(f) = H_{\text{RRC}}(f) \cdot H_{\text{RRC}}(f) = H_{\text{RC}}(f)$) produces a Raised-Cosine impulse response with periodic zero-crossings at every symbol interval $k \cdot T$.
- **The 2 AM War Story:** Roll-off mismatch: If the transmitter uses $\alpha = 0.35$ and your FPGA receiver is hardcoded to $\alpha = 0.20$, the zero-crossing guarantee fails and your Eye Diagram collapses under severe ISI.

---

### Costas Loop & Phase Ambiguity
- **Thesaurus / Also Known As:** Suppressed-Carrier Phase-Locked Loop (PLL), Carrier Recovery Discriminator.
- **The 10-Second Intuition:** An automatic steering wheel that keeps your receiver locked onto the phase and frequency of a transmitter's carrier wave, even when no carrier tone is transmitted.
- **The Rigorous Reality:** Phase error detector:
  $$e[n] = I[n] \cdot Q[n] \quad \text{(for BPSK)}$$
  $$e[n] = \operatorname{sign}(I[n])Q[n] - \operatorname{sign}(Q[n])I[n] \quad \text{(for QPSK)}$$
  The error drives a proportional-integral (PI) loop filter adjusting an internal DDS/NCO.
- **The 2 AM War Story:** **Phase Ambiguity:** A Costas Loop locks equally stably at $0^\circ, 90^\circ, 180^\circ,$ and $270^\circ$. Without differential encoding or a known sync preamble (e.g., a Barker sequence), your receiver will periodically spit out inverted or flipped bitstreams!

---

## 🛠️ 6. Verification, Simulation & Toolchains

### Verilator (Cycle-Accurate C++ Simulation)
- **Thesaurus / Also Known As:** 2-State RTL Transpiler, High-Speed Hardware Simulator.
- **Curriculum Link:** [Phase 2: Verilator Lab](/docs/Phase-2/Verilator-Lab)
- **The 10-Second Intuition:** Turns your Verilog into hyper-optimized C++ code that compiles natively and runs up to 100x faster than traditional interpreted simulators.
- **The Rigorous Reality:** Synthesizes synthesizable Verilog down to an evaluation call tree using 2-state logic (`0` and `1`), ignoring the simulation overhead of `X` and `Z` states.
- **The 2 AM War Story:** **The 2-State Blindspot!** Because Verilator ignores `X` (unknown), an uninitialized register that would float unpredictably in real hardware might silently evaluate as `0` in Verilator. Always enforce explicit resets in your testbenches!

---

## 🚀 Quick Reference Summary Table

| Term | Domain | Primary Alias | Key Metric / Formula | Golden Rule / Gotcha |
| :--- | :--- | :--- | :--- | :--- |
| **Nyquist-Shannon** | DSP & RF | Whittaker-Shannon | $f_s > 2 f_{\max}$ | Anti-aliasing filter must precede ADC |
| **IQ Sampling** | DSP & RF | Complex Baseband | $z[n] = I[n] + jQ[n]$ | Mismatch causes mirror image spurs |
| **DDS / NCO** | DSP / FPGA | Numerically Controlled Osc | $f = (M \cdot f_{\text{clk}}) / 2^N$ | Phase truncation limits SFDR |
| **Q-Format** | Fixed-Point | Radix Scaling ($Q_{m.n}$) | $2^{-n}$ resolution | $-1 \times -1$ overflows without saturation |
| **Transposed FIR** | FPGA | Pipelined Filter | $t_{\text{crit}} = t_{\text{mult}} + t_{\text{add}}$ | Eliminates adder tree routing bottlenecks |
| **DSP48 Slice** | FPGA | Hardened MAC | $25\times 18$ Mult + 48-bit Acc | Use pre-adder for symmetric filters |
| **Inferred Latch** | FPGA | Combinational Memory | `always @(*)` incomplete if/case | Assign safe defaults at block start |
| **Non-Blocking (`<=`)**| FPGA | NBA Event Queue | Deferred evaluation | Use exclusively in sequential blocks |
| **CDC / Synchronizer** | FPGA / SoC | 2-FF Synchronizer | $\text{MTBF} \propto e^{t_{\text{slack}}/\tau}$ | Use Gray code for multi-bit buses |
| **AXI4-Stream** | SoC / Bus | TVALID/TREADY Handshake | `TVALID && TREADY == 1` | TVALID must never wait for TREADY |
| **DMA Engine** | SoC / Bus | Zero-Copy Bridge | AXI4 Burst to DDR | Invalidate CPU cache before reading |
| **RRC Filter** | Comms | Matched Filter Pair | Roll-off $\alpha$ | Mismatched $\alpha$ closes eye diagram |
| **Costas Loop** | Comms | Carrier Tracking Loop | $e = I \cdot Q$ | Ambiguity requires sync preamble |
| **Verilator** | Verification | 2-State C++ Sim | Native compiled C++ | Does not resolve `X` uninitialized state |
