---
sidebar_position: 1
---

# 1. Verilog Paradigms & Architecture

Moving from Python/C++ to Verilog requires a massive mental shift. You are no longer writing a sequential list of instructions for a CPU to execute one by one. **You are describing physical hardware wiring.** 

In an FPGA, everything happens simultaneously. If you write 100 lines of Verilog, all 100 lines are essentially executing at the exact same time in parallel.

## Deep Dive: Why the Mental Shift Matters

In software (C/Python), instructions sit in RAM and are executed in program order by an ALU. In Verilog, your code is an **elaboration blueprint**:

- **Gates and Wires:** You are instantiating physical Look-Up Tables (LUTs), dedicated arithmetic blocks (DSPs), and multiplexers.
- **Propagation Delay:** In combinational logic, signals travel as electrical waveforms. Changes propagate through gates with physical delays ($t_{pd}$). There is no instruction pointer—wires continuously carry voltage levels.
- **Setup & Hold Times:** In sequential logic, data arriving at a flip-flop must be stable before the clock edge ($t_{\text{setup}}$) and remain stable after the clock edge ($t_{\text{hold}}$) to prevent entering an invalid, metastable state.

---

## 1. Combinational Logic & Latch Generation

Combinational logic is logic where the output depends **only** on the current state of the inputs. There is no memory, no clock, and no history. Think of it as pure math operations (AND, OR, Addition, Multiplexing).

### Implementation
Use the `assign` keyword for simple logic, or an `always @(*)` block for complex routing.
```verilog
// Continuous Assignment
assign sum = a + b;
assign is_equal = (a == b) ? 1'b1 : 1'b0;
```

### ⚠️ Trap: Inadvertent Latch Generation (Combinational Hazard)
In an `always @(*)` combinational block, if any output signal is not explicitly assigned a value across **all possible execution branches**, the synthesis tool infers a transparent hardware latch rather than pure combinational gates.

Latches introduce asynchronous feedback loops, timing closure complications, and severe glitch susceptibility in FPGAs.

**Prevention Strategy:**
Always provide an explicit `else` or default clause for every condition:
```verilog
always @(*) begin
    if (enable)
        out = data_in;
    else
        out = 8'b0; // Explicitly handled
end
```
Or assign safe default values at the very top of the `always @(*)` block:
```verilog
always @(*) begin
    out = 8'b0; // Default assignment prevents latch inference
    if (enable)
        out = data_in;
end
```

---

## 2. Sequential Logic & Assignment Mechanics

Sequential logic depends on current inputs **and** past states. This requires memory (Flip-Flops) and is driven by a **Clock**. Use an `always @(posedge clk)` block.

### The Mechanics of Non-Blocking (`<=`) vs. Blocking (`=`)

The distinction between `=` and `<=` corresponds to different regions in the IEEE Verilog simulation cycle:

- **Blocking (`=`):** Evaluated in the Active Events region immediately in source-text order.
- **Non-Blocking (`<=`):** RHS (Right-Hand Side) expressions are evaluated and captured during the Active region, but the updates to the LHS (Left-Hand Side) are scheduled into the NBA (Non-Blocking Assignment) Update region. All registers update concurrently after all evaluations settle.

### Example Comparison (Shift Register)

```verilog
// Intended: 2-stage shift register using <=
always @(posedge clk) begin
    b <= a;
    c <= b; // 'c' receives old value of 'b'
end
// Hardware inferred: Two cascaded flip-flops.

// Broken: Using =
always @(posedge clk) begin
    b = a;
    c = b; // 'c' immediately receives 'a'!
end
// Hardware inferred: One flip-flop ('a' drives both 'b' and 'c' directly).
```

### Resolving Mixed Blocks

Consider this broken mental exercise pattern:
```verilog
always @(posedge clk) begin
    temp = a & b;
    q <= temp | c;
end
```
While simulators might technically execute this sequentially in the active queue, synthesizing this style leads to simulation/synthesis mismatches (RTL bugs vs. gate-level behavior) and violates strict team linting rules.

**Standard Fix 1: Combinational generation for intermediate signals**
```verilog
wire temp;
assign temp = a & b;

always @(posedge clk) begin
    q <= temp | c;
end
```

**Standard Fix 2: Pure non-blocking sequential block (if intermediate state is registered)**
```verilog
reg temp;
always @(posedge clk) begin
    temp <= a & b;
    q    <= temp | c; // Note: 'temp' now has 1 cycle of latency
end
```

---

## 3. Practical Rules of Thumb (Industry Standard)

To avoid hardware traps, memorize this RTL Coding Style Summary:

- **`assign`** $\rightarrow$ Simple combinational logic, intermediate wires, bus concatenation.
- **`always @(*)`** $\rightarrow$ Complex combinational logic, priority encoders, decoders, multiplexers. **Always use blocking `=`.**
- **`always @(posedge clk)`** $\rightarrow$ Registers, counters, state machines, pipelines. **Always use non-blocking `<=`.**

> **SystemVerilog Note:** Modern designs often migrate to SystemVerilog. It introduces the keywords `always_comb`, `always_ff`, and `always_latch`. These enforce the above rules at compile time and emit hard warnings if a latch is accidentally inferred in a combinational block.

---

### 📝 Practice Activity
1. **HDLBits Checklist:** Complete the following sections on [HDLBits](https://hdlbits.01xz.net/):
   - `Verilog Language -> Basics`
   - `Circuits -> Combinational Logic`
   - `Circuits -> Sequential Logic -> Latches and Flip-Flops`
