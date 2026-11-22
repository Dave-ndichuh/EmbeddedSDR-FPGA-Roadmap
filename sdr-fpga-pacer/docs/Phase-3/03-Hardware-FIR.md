---
sidebar_position: 3
---

import DiagramBlock from '@site/src/components/Interactive/DiagramBlock';
import InteractiveQuiz from '@site/src/components/Interactive/InteractiveQuiz';

# 3. Hardware FIR Filters

Translating the FIR filter equation $y[n] = \sum_{k=0}^{M} b_k \cdot x[n-k]$ into hardware requires orchestrating hundreds of multiplications and additions at hundreds of megahertz.

## DSP Slices
FPGAs contain hardened silicon blocks called **DSP Slices** (e.g., DSP48E1 in Xilinx, DSP Blocks in Intel). These blocks efficiently execute the **Multiply-Accumulate (MAC)** operation: $P = A \times B + C$.
Instead of building multipliers out of generic LUTs (which is huge and slow), the synthesizer maps your Verilog code directly into these DSP slices.

## Architecture: Transposed vs. Direct Form

<DiagramBlock
  type="fir-architecture"
  caption="Pipelined Transposed FIR Filter: Input broadcasts to all multipliers simultaneously; delay registers z^-1 sit between adders to guarantee O(1) critical path delay."
/>

There are two primary ways to wire a hardware FIR filter:

1. **Direct Form:** The input propagates through a shift register (delay line). At each tap, the delayed input is multiplied by a coefficient, and all products are summed together via an adder tree. 
   - *Drawback:* Large adder trees have long propagation delays ($t_{pd}$), limiting your maximum clock speed ($f_{max}$).
2. **Transposed Form:** The input is fed simultaneously to all multipliers. The *accumulation* propagates down the chain through registers.
   - *Advantage:* Because there is a register between every addition, the propagation delay is extremely short. This heavily pipelined architecture achieves the highest possible $f_{max}$ in FPGAs.

## Coefficient Symmetry Optimization

Most FIR filters designed for communication systems (like Root-Raised Cosine filters) have **Symmetric Coefficients**: $b_0 = b_M$, $b_1 = b_{M-1}$, etc.

$$y[n] = b_0(x[n] + x[n-M]) + b_1(x[n-1] + x[n-M+1]) + ...$$

**Hardware Magic:** By adding the delayed inputs together *before* multiplying, you cut the number of required multipliers (DSP slices) exactly in half! FPGA DSP slices contain a "Pre-Adder" specifically for this trick.

## Transposed FIR Verilog Implementation

Here is a 4-tap Transposed FIR filter. Notice how the registers `delay_line` break up the accumulation path.

```verilog
module fir_4tap_transposed #(
    parameter DATA_W = 16,
    parameter COEF_W = 16
)(
    input  wire clk,
    input  wire reset,
    input  wire signed [DATA_W-1:0] x_in,
    output wire signed [DATA_W-1:0] y_out
);

    // Hardcoded Q1.15 Coefficients
    wire signed [COEF_W-1:0] b0 = 16'd8192;  // 0.25
    wire signed [COEF_W-1:0] b1 = 16'd16384; // 0.50
    wire signed [COEF_W-1:0] b2 = 16'd16384; // 0.50
    wire signed [COEF_W-1:0] b3 = 16'd8192;  // 0.25

    // Multiplier outputs (Q2.30)
    wire signed [(DATA_W+COEF_W)-1:0] mult0 = x_in * b0;
    wire signed [(DATA_W+COEF_W)-1:0] mult1 = x_in * b1;
    wire signed [(DATA_W+COEF_W)-1:0] mult2 = x_in * b2;
    wire signed [(DATA_W+COEF_W)-1:0] mult3 = x_in * b3;

    // Accumulator Delay Line (Wide enough to prevent overflow)
    reg signed [(DATA_W+COEF_W):0] acc1, acc2, acc3;

    always @(posedge clk) begin
        if (reset) begin
            acc1 <= 0;
            acc2 <= 0;
            acc3 <= 0;
        end else begin
            // Transposed accumulation chain
            acc1 <= mult3;
            acc2 <= acc1 + mult2;
            acc3 <= acc2 + mult1;
        end
    end

    // Final addition and truncation back to Q1.15
    wire signed [(DATA_W+COEF_W):0] sum_final = acc3 + mult0;
    assign y_out = sum_final[30:15]; // Truncate Q2.30 to Q1.15

endmodule
```

---

## 🧠 Interactive Knowledge Check

<InteractiveQuiz
  title="Challenge 1: Direct Form vs. Transposed FIR Critical Path"
  question="Why is the Transposed Form FIR filter preferred over the Direct Form FIR filter when designing high-speed (>200 MHz) filters with many taps (e.g., 64 taps) on FPGAs?"
  options={[
    "Transposed Form does not require any multiplications",
    "In Transposed Form, the critical path is independent of tap count (1 multiplier + 1 adder), whereas Direct Form has a large multi-input adder tree with long routing delays",
    "Transposed Form consumes 75% fewer flip-flops than Direct Form",
    "Direct Form filters can only process integer signals, while Transposed Form natively supports floats"
  ]}
  correctIndex={1}
  hint="Look at the diagram above: what sits between every addition in the Transposed structure?"
  explanation="Exactly! In Transposed Form, registers (z^-1) sit right between each adder stage. Therefore, the critical path between registers is just a single multiplication followed by a single addition, regardless of whether you have 4 taps or 128 taps!"
/>

<InteractiveQuiz
  title="Challenge 2: Symmetric Coefficient Optimization"
  question="A Root-Raised Cosine (RRC) filter has 33 symmetric taps (b0 = b32, b1 = b31, etc.). How does utilizing the FPGA DSP slice 'Pre-Adder' optimize hardware utilization?"
  options={[
    "It doubles the clock speed of the FPGA",
    "It adds the symmetric input samples together BEFORE the multiplier, cutting the number of required multipliers from 33 down to 17",
    "It eliminates the need for Block RAM",
    "It converts the filter from an FIR into an IIR filter"
  ]}
  correctIndex={1}
  hint="b0*x[n] + b0*x[n-32] = b0*(x[n] + x[n-32]). How many multiplications is that?"
  explanation="Spot on! By using the distributive property, b0*(x[n] + x[n-32]) requires 1 addition and only 1 multiplication instead of 2. Modern DSP slices (like Xilinx DSP48E1/E2) have a dedicated pre-adder baked into the silicon block right before the multiplier!"
/>

---

### 📝 Practice Activity
1. **Pipeline Depth:** Look at the Verilog code above. If a change occurs at `x_in`, how many clock cycles does it take for that change to fully propagate through to `y_out`? 
2. **Coefficient Quantization:** Use Python's `scipy.signal.firls` to design a low-pass filter. The coefficients will be floats between -1 and 1. Multiply them by $2^{15}$, round them to integers, and inspect them. Did the frequency response (FFT) of the filter change after quantization?
