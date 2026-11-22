---
sidebar_position: 1
---

import DiagramBlock from '@site/src/components/Interactive/DiagramBlock';
import VideoLectureCard from '@site/src/components/Interactive/VideoLectureCard';
import InteractiveQuiz from '@site/src/components/Interactive/InteractiveQuiz';

# 1. Verilog Paradigms & Architecture

Moving from Python/C++ to Verilog requires a massive mental shift. You are no longer writing a sequential list of instructions for a CPU to execute one by one. **You are describing physical hardware wiring.** 

In an FPGA, everything happens simultaneously. If you write 100 lines of Verilog, all 100 lines are essentially executing at the exact same time in parallel.

<DiagramBlock
  type="fpga-fabric"
  caption="Inside the FPGA Fabric: Configurable Logic Block (CLB) with 6-LUT, Fast Carry Chains, Multiplexers, Flip-Flops, and DSP48 Hard Slices"
/>

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

## 🎥 Video Masterclass: Verilog Simulation Cycle & Latches

<VideoLectureCard
  title="Digital Design & Verilog: The Simulation Cycle & Blocking vs Non-Blocking"
  youtubeId="xK3k3gX8D0g"
  speaker="Ben Eater & MIT OpenCourseWare"
  description="Understanding the physical electrical reality of flip-flops, propagation delays, setup/hold margins, and why the IEEE Verilog event queue behaves the way it does."
  takeaways={[
    "Blocking assignments (=) execute sequentially and create combinational dependencies",
    "Non-blocking assignments (<=) update at the end of the time step in the NBA queue",
    "Latches in FPGAs cause critical timing closure and glitch issues"
  ]}
/>

---

## 🧠 Interactive Knowledge Check

<InteractiveQuiz
  title="Challenge 1: The Inadvertent Latch Trap"
  question="Examine this Verilog block: 'always @(*) begin if (sel == 2'b00) y = a; else if (sel == 2'b01) y = b; end'. What physical hardware does the synthesis tool generate?"
  options={[
    "A pure 2-to-1 multiplexer with zero delay",
    "An unclocked transparent latch that remembers 'y' when sel is 2'b10 or 2'b11",
    "A D flip-flop triggered on the posedge of 'sel'",
    "A syntax error that prevents synthesis from completing"
  ]}
  correctIndex={1}
  hint="What happens to 'y' when sel is 2'b10 or 2'b11? Did you tell the synthesizer what value to assign?"
  explanation="Exactly! Because the 'if' statement doesn't have an 'else' clause handling 2'b10 and 2'b11, the synthesis tool must preserve the old value of 'y'. To do that without a clock, it infers an asynchronous transparent latch using combinational feedback loops—a major hardware hazard in FPGAs!"
/>

<InteractiveQuiz
  title="Challenge 2: Shift Register Bug"
  question="A junior engineer writes: 'always @(posedge clk) begin b = a; c = b; end' intending to build a 2-stage shift register. What actually happens in hardware?"
  options={[
    "It correctly infers two cascaded flip-flops with 2 cycles of latency",
    "Both 'b' and 'c' update concurrently with the previous value of 'a'",
    "The blocking '=' assignment causes 'c' to receive 'a' in the very same clock cycle, inferring only 1 effective flip-flop stage",
    "The synthesizer will throw a fatal syntax error because '=' is forbidden"
  ]}
  correctIndex={2}
  hint="Think about the IEEE active event queue: blocking '=' statements update their LHS variable immediately before moving to the next line."
  explanation="Spot on! With blocking '=', line 1 executes immediately, updating 'b'. Then line 2 executes with the newly updated 'b', meaning 'c' gets the value of 'a' immediately. Only one flip-flop is inferred for 'a' to drive both registers simultaneously, destroying the desired 2-cycle delay line!"
/>

---

### 📝 Practice Activity
1. **HDLBits Checklist:** Complete the following sections on [HDLBits](https://hdlbits.01xz.net/):
   - `Verilog Language -> Basics`
   - `Circuits -> Combinational Logic`
   - `Circuits -> Sequential Logic -> Latches and Flip-Flops`
