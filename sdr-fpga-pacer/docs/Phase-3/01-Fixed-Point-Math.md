---
sidebar_position: 1
---

# 1. Fixed-Point Arithmetic

Before building DSP hardware, we must address how numbers are represented. In software (Phase 1), we used Python and `float64` floating-point numbers. In hardware, floating-point math requires massive, slow, and power-hungry IEEE-754 logic blocks. Instead, FPGAs use **Fixed-Point Arithmetic**.

## Q-Format Notation

Fixed-point numbers use standard binary integers, but we conceptually place a "binary point" (radix point) somewhere within the bits. 

We use **Q-format notation**, typically written as `Qm.n`, where:
- `m` = Number of integer bits (including the sign bit).
- `n` = Number of fractional bits.
- Total width = `m + n`.

**Example: Q1.15 Format (16-bit)**
- 1 sign bit (MSB).
- 15 fractional bits.
- Range: $[-1.0, +0.9999695]$
- Resolution: $2^{-15} = 0.0000305$

If a Q1.15 binary number is `0100000000000000`, its decimal value is $0.5$ (since the 1 is in the $2^{-1}$ position).

## Fixed-Point Mathematics in Verilog

### 1. Addition and Subtraction
To add or subtract two fixed-point numbers, **their binary points must align**. If you have a Q2.14 number and a Q1.15 number, you must shift one of them to align the fractional bits before adding.
```verilog
// Adding two Q1.15 numbers
wire signed [15:0] a, b;
wire signed [16:0] sum; // Need 1 extra bit for growth (overflow protection)
assign sum = a + b;
```

### 2. Multiplication
When multiplying an $A$-bit number by a $B$-bit number, the result requires $A+B$ bits.
If you multiply two Q1.15 numbers, the result is a **Q2.30** number (32 bits).
```verilog
wire signed [15:0] a; // Q1.15
wire signed [15:0] b; // Q1.15
wire signed [31:0] mult_out; // Q2.30
assign mult_out = a * b;
```

### 3. Truncation and Rounding
You usually don't want your bus width to grow infinitely. To pass the 32-bit Q2.30 result into a 16-bit register, you must truncate or round it back to Q1.15.

To convert Q2.30 back to Q1.15, you drop the duplicate sign bit at the top, take the next 15 bits, and discard the lower 15 bits.
```verilog
// Truncation (dropping lower 15 bits, taking top 16 minus the duplicate sign bit)
wire signed [15:0] truncated_result;
assign truncated_result = mult_out[30:15];
```

## Sign Extension

When aligning fixed-point numbers of different widths, you must pad the most significant bits of the smaller number. For signed math (Two's Complement), you must **sign-extend** by replicating the MSB.

```verilog
wire signed [7:0] small_val; // 8-bit
wire signed [15:0] padded_val;

// Sign extension in Verilog using replication operator
assign padded_val = { {8{small_val[7]}}, small_val };
```
*Note: In modern Verilog (2001+), using the `signed` keyword and `assign padded_val = small_val;` will infer sign extension automatically, but manual replication prevents synthesizer ambiguity.*
