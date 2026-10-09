---
sidebar_position: 3
---

# 3. Hardware FIR Filters

Translating the FIR filter equation $y[n] = \sum_{k=0}^{M} b_k \cdot x[n-k]$ into hardware requires orchestrating hundreds of multiplications and additions at hundreds of megahertz.

## DSP Slices
FPGAs contain hardened silicon blocks called **DSP Slices** (e.g., DSP48E1 in Xilinx, DSP Blocks in Intel). These blocks efficiently execute the **Multiply-Accumulate (MAC)** operation: $P = A \times B + C$.
Instead of building multipliers out of generic LUTs (which is huge and slow), the synthesizer maps your Verilog code directly into these DSP slices.

## Architecture: Transposed vs. Direct Form

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

### 📝 Practice Activity
1. **Pipeline Depth:** Look at the Verilog code above. If a change occurs at `x_in`, how many clock cycles does it take for that change to fully propagate through to `y_out`? 
2. **Coefficient Quantization:** Use Python's `scipy.signal.firls` to design a low-pass filter. The coefficients will be floats between -1 and 1. Multiply them by $2^{15}$, round them to integers, and inspect them. Did the frequency response (FFT) of the filter change after quantization?
