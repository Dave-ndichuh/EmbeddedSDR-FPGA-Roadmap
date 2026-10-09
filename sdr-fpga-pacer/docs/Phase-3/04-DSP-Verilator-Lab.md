---
sidebar_position: 4
---

# 4. DSP Verilator Lab: Verifying the NCO

In Phase 2, we simulated a simple counter. Now, we will simulate the Direct Digital Synthesizer (DDS/NCO) we designed in `02-DDS-NCO.md`, capture its output, and mathematically verify its frequency using Python.

This lab perfectly demonstrates the intersection of Hardware Engineering and Software DSP.

## Objective
Use Verilator to drive the DDS module for 10,000 clock cycles. Write the generated sine wave data to a text file. Use a Python script to plot the data and compute the FFT to verify the Spurious-Free Dynamic Range (SFDR) and output frequency.

## Lab Instructions

### Step 1: Prepare the Hardware
1. Save the `dds_nco` Verilog code from the previous section into a file named `dds_nco.v`.
2. Complete the Python script to generate the `sine_lut.hex` file. 
   *(Hint: Loop 1024 times, calculate `sin(2*pi*i/1024)`, scale by $32767$, and format as a 4-character hex string).*

### Step 2: The C++ Testbench (`sim_dds.cpp`)
This testbench instantiates the NCO and writes the output to `output.txt`.

```cpp
#include "Vdds_nco.h"
#include "verilated.h"
#include <iostream>
#include <fstream>

int main(int argc, char** argv) {
    Verilated::commandArgs(argc, argv);
    Vdds_nco* dut = new Vdds_nco;

    std::ofstream outfile("output.txt");

    // Initialize inputs
    dut->clk = 0;
    dut->reset = 1;
    dut->enable = 0;
    // Set Tuning Word: Let's aim for f_out = (tuning_word * f_clk) / 2^32
    // If f_clk = 100MHz, tuning_word = 42949673 (approx 1 MHz)
    dut->tuning_word = 42949673; 

    // Reset loop
    for(int i=0; i<10; i++) {
        dut->clk = !dut->clk;
        dut->eval();
    }
    
    dut->reset = 0;
    dut->enable = 1;

    // Simulation Loop (10,000 samples)
    for (int time = 0; time < 10000; time++) {
        dut->clk = 1; dut->eval();
        
        // Write the signed 16-bit output to file
        // Cast to short to enforce 16-bit Two's Complement evaluation
        outfile << (short)dut->sine_out << std::endl; 
        
        dut->clk = 0; dut->eval();
    }

    outfile.close();
    delete dut;
    return 0;
}
```

### Step 3: Verilate and Execute
Compile the code in your terminal:
```bash
verilator -Wall --cc dds_nco.v --exe sim_dds.cpp
make -j -C obj_dir -f Vdds_nco.mk
./obj_dir/Vdds_nco
```
This will produce a file named `output.txt` containing 10,000 amplitude samples.

### Step 4: Python Verification (`verify.py`)
Now we return to our Phase 1 skills to verify our Phase 3 hardware!

```python
import numpy as np
import matplotlib.pyplot as plt

# 1. Load the hardware-generated data
data = np.loadtxt('output.txt')

# 2. Plot the Time Domain (First 200 samples)
plt.figure(figsize=(12, 6))
plt.subplot(2, 1, 1)
plt.plot(data[:200], marker='.')
plt.title("Time Domain: DDS Output")
plt.ylabel("Amplitude")

# 3. Compute and Plot the FFT (Frequency Domain)
fft_out = np.fft.fft(data)
fft_mag = 20 * np.log10(np.abs(fft_out) + 1e-10) # dB scale
fft_mag = fft_mag[:len(fft_mag)//2] # Take positive frequencies
freqs = np.linspace(0, 100e6/2, len(fft_mag)) # Assuming 100 MHz clock

plt.subplot(2, 1, 2)
plt.plot(freqs / 1e6, fft_mag)
plt.title("Frequency Domain (SFDR Analysis)")
plt.xlabel("Frequency (MHz)")
plt.ylabel("Magnitude (dB)")
plt.grid(True)

plt.tight_layout()
plt.show()
```

### Analysis
When you run the Python script:
1. Does the time-domain plot look like a clean sine wave?
2. In the frequency domain, is the primary peak exactly at $1 \text{ MHz}$?
3. Look at the noise floor. The difference between the peak at $1 \text{ MHz}$ and the highest spurious noise spike is your **Spurious-Free Dynamic Range (SFDR)**. Is it close to the theoretical $\sim 96 \text{ dB}$ for a 16-bit LUT?
