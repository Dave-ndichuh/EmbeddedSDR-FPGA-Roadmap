---
sidebar_position: 2
---

# Phase 2: HDL & FPGA Basics

Field Programmable Gate Arrays (FPGAs) do not execute software; they physically wire logic gates. This phase requires a paradigm shift from sequential programming (C++/Python) to parallel hardware description using Verilog.

## Goals
- **Objective:** Master clock domains, state machines, and writing testbenches for logic verification.
- **Key Concepts:** Combinational vs. sequential logic, Verilog syntax, simulation.
- **Hardware Needed:** Intel Cyclone IV or V development board (e.g., DE10-Nano).

## Workflow

1. **Write RTL** (Verilog)
2. **Simulate** (Verilator / Testbench)
3. **Synthesize** (Quartus / Vivado)
4. **Deploy** (Cyclone / Zynq)

## Resources
- **HDLBits (hdlbits.01xz.net):** An interactive, web-based Verilog practice platform. Complete up to the "Finite State Machines" section.
- **Verilator (verilator.org):** The industry-standard open-source Verilog simulator. Learn to write testbenches in C++ to verify your Verilog code before deploying to hardware.

## Verilog Code Example

```verilog
module dff (
    input clk,
    input d,
    output reg q
);
    always @(posedge clk) begin
        q <= d;
    end
endmodule
```
