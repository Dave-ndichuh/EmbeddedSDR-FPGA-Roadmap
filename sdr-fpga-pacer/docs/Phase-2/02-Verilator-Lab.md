---
sidebar_position: 2
---

# 2. Verilator Simulation Lab

Before you ever flash a bitstream to a physical FPGA board, you **must** simulate your hardware. FPGAs take a long time to synthesize (minutes to hours), and debugging directly on hardware using oscilloscopes is painful.

[Verilator](https://www.veripool.org/verilator/) is the industry standard for fast, cycle-accurate simulation. It compiles your Verilog code directly into high-performance C++ classes. 

## Objective
Write a Verilog module for an N-bit counter, compile it into C++ using Verilator, write a C++ testbench to drive the clock, and generate a VCD waveform to view in GTKWave.

## Lab Instructions

### Step 1: The Verilog Hardware (`counter.v`)
Create a parameterized counter that increments every clock cycle when enabled.

```verilog
// counter.v
module counter #(
    parameter WIDTH = 8
)(
    input  wire             clk,
    input  wire             reset,
    input  wire             enable,
    output reg  [WIDTH-1:0] count
);

    always @(posedge clk) begin
        if (reset) begin
            count <= {WIDTH{1'b0}};
        end else if (enable) begin
            count <= count + 1'b1;
        end
    end

endmodule
```

### Step 2: The C++ Testbench (`sim_main.cpp`)
Verilator converts `counter.v` into a C++ class named `Vcounter`. We will write a C++ `main()` function to instantiate this class, toggle the `clk` pin, and dump the state to a waveform file.

```cpp
// sim_main.cpp
#include "Vcounter.h"       // The Verilated hardware class
#include "verilated.h"
#include "verilated_vcd_c.h" // For Waveform generation

int main(int argc, char** argv) {
    // 1. Initialize Verilator arguments
    Verilated::commandArgs(argc, argv);
    Verilated::traceEverOn(true); // Enable waveform tracing

    // 2. Instantiate the module
    Vcounter* dut = new Vcounter;

    // 3. Setup Waveform Dumper
    VerilatedVcdC* tfp = new VerilatedVcdC;
    dut->trace(tfp, 99); // Trace 99 levels of hierarchy
    tfp->open("waveform.vcd");

    // 4. Initialize Inputs
    dut->clk = 0;
    dut->reset = 1;
    dut->enable = 0;

    int time = 0;

    // 5. Run the Simulation Loop
    while (time < 100) {
        // Toggle the clock
        dut->clk = !dut->clk;

        // Apply stimuli at specific times
        if (time == 10) dut->reset = 0;    // Release reset
        if (time == 20) dut->enable = 1;   // Start counting
        if (time == 80) dut->enable = 0;   // Pause counting

        // Evaluate the hardware models
        dut->eval();

        // Dump variables to VCD file
        tfp->dump(time);

        time++;
    }

    // 6. Clean up
    tfp->close();
    delete dut;
    return 0;
}
```

### Step 3: Compilation and Execution
To run this, you need a Linux environment (or WSL on Windows) with `verilator`, `make`, and `g++` installed.

1. **Verilate:** Convert Verilog to C++ and enable tracing.
   ```bash
   verilator -Wall --cc --trace counter.v --exe sim_main.cpp
   ```
2. **Build:** Compile the generated C++ files using the automatically generated Makefile.
   ```bash
   make -j -C obj_dir -f Vcounter.mk
   ```
3. **Execute:** Run the resulting executable to simulate the hardware and generate the `waveform.vcd` file.
   ```bash
   ./obj_dir/Vcounter
   ```

### Step 4: Waveform Analysis
Open the generated `waveform.vcd` file using **GTKWave**:
```bash
gtkwave waveform.vcd
```
Inside GTKWave, drag the `clk`, `reset`, `enable`, and `count` signals into the viewing area. You should visually see the counter remain at 0 until `reset` goes low and `enable` goes high, at which point `count` will increment by 1 exactly on every rising edge of `clk`.

---

### 📝 Practice Activity
1. **Testbench Modification:** Modify `sim_main.cpp` to include a C++ `assert()` statement that automatically checks if `count` is equal to `0` when `reset == 1`. This is the foundation of "Self-Checking Testbenches" in the defense industry.
2. **Verilog Modification:** Add a new `output wire max_reached` to `counter.v` that outputs `1'b1` (High) whenever the counter reaches `255`, and is `1'b0` otherwise. Re-run the simulation and verify it in GTKWave!
