---
sidebar_position: 5
---

# Phase 5: The Capstone Portfolio Project

To demonstrate readiness for a defense-grade engineering role, you must build a comprehensive, full-stack SDR project. This project will serve as the primary talking point in technical interviews, proving you can handle the product life-cycle from research prototype to embedded device.

## The Mission
Acquire a bladeRF or LimeSDR board. Modify its open-source FPGA image to include a custom digital hardware block, and route the processed data to a custom C++ application.

### 1. The Custom IP Core
Write a Verilog module for a specialized task (e.g., a burst detector or custom decimator). Write exhaustive Verilator testbenches to prove its timing stability and mathematical accuracy.

### 2. Integration & Synthesis
Instantiate your module within the existing bladeRF/LimeSDR FPGA image. Re-compile the image, ensuring all clock domains and AXI streaming interfaces are correctly mapped.

### 3. Data Exfiltration
Ensure the hardware-accelerated output correctly feeds into the board's USB 3.0 or PCIe data pipeline, making it available to the host processor without packet loss.

### 4. Lab Validation
Use a logic analyzer (or internal SignalTap/ILA cores) alongside an oscilloscope to validate that physical signals match your software simulations exactly.
