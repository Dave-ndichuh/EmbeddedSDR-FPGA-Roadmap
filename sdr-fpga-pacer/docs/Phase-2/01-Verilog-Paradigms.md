---
sidebar_position: 1
---

# 1. Verilog Paradigms & Architecture

Moving from Python/C++ to Verilog requires a massive mental shift. You are no longer writing a sequential list of instructions for a CPU to execute one by one. **You are describing physical hardware wiring.** 

In an FPGA, everything happens simultaneously. If you write 100 lines of Verilog, all 100 lines are essentially executing at the exact same time in parallel.

## 1. Combinational vs. Sequential Logic

Digital hardware is divided into two strict categories. Mixing them improperly is the #1 cause of FPGA bugs.

### Combinational Logic
Logic where the output depends **only** on the current state of the inputs. There is no memory, no clock, and no history. Think of it as pure math operations (AND, OR, Addition, Multiplication).

**Implementation:**
Use the `assign` keyword for simple logic, or an `always @(*)` block for complex routing.
```verilog
// Continuous Assignment
assign sum = a + b;
assign is_equal = (a == b) ? 1'b1 : 1'b0;

// Always block (combinational)
always @(*) begin
    if (enable)
        out = data_in;
    else
        out = 8'b0;
end
```

### Sequential Logic
Logic where the output depends on current inputs **and** past states. This requires memory (Flip-Flops) and is driven by a **Clock**. 

**Implementation:**
Use an `always @(posedge clk)` block. This tells the synthesizer to instantiate physical D-Flip-Flops triggered on the rising edge of the clock signal.
```verilog
always @(posedge clk or posedge reset) begin
    if (reset) begin
        counter <= 8'b0;      // Reset state
    end else if (enable) begin
        counter <= counter + 1'b1; // Memory / State change
    end
end
```

## 2. Blocking vs. Non-Blocking Assignments

This is the most critical syntax rule in Verilog.

- **Blocking (`=`):** Used **ONLY** in Combinational logic (`always @(*)`). It evaluates sequentially within the block, blocking the next line until it finishes.
- **Non-Blocking (`<=`):** Used **ONLY** in Sequential logic (`always @(posedge clk)`). All non-blocking assignments in a block evaluate simultaneously at the clock edge.

**The Race Condition Trap:**
If you use blocking assignments (`=`) inside a clocked block, you will create a race condition. Simulation might behave differently than physical hardware because the synthesizer doesn't know which line to evaluate first.

**The Golden Rule:**
> *Never use `<=` and `=` in the same `always` block.*

## 3. Clock Domains

In complex SDR systems, data moves between different speed domains. For example, your ADC might sample at $100 \text{ MHz}$, but your USB controller might run at $60 \text{ MHz}$.

You cannot simply wire a signal from a $100 \text{ MHz}$ `always` block into a $60 \text{ MHz}$ `always` block. Because the clocks are asynchronous to each other, the receiving flip-flop might sample the signal exactly as it's transitioning between 0 and 1. This causes **Metastability**, where the flip-flop gets "stuck" between voltage levels, crashing your pipeline.

*Note: We will cover Clock Domain Crossing (CDC) mechanisms like Async FIFOs in Phase 4.*

---

### 📝 Practice Activity
1. **HDLBits Checklist:** Complete the following sections on [HDLBits](https://hdlbits.01xz.net/):
   - `Verilog Language -> Basics`
   - `Circuits -> Combinational Logic`
   - `Circuits -> Sequential Logic -> Latches and Flip-Flops`
2. **Mental Exercise:** Look at the following code. Is it creating Combinational or Sequential hardware? Does it violate the Golden Rule?
```verilog
always @(posedge clk) begin
    temp = a & b;
    q <= temp | c;
end
```
*(Answer: It creates Sequential hardware because of `posedge clk`, but it violates the Golden Rule by mixing `=` and `<=`. In industry code, `temp` should either be calculated outside the block using `assign`, or the whole block should strictly use `<=`).*
