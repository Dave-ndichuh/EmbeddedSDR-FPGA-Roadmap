---
sidebar_position: 4
---

# 4. GNU Radio Lab

With the theory of Sampling, Aliasing, Filtering, and Decimation under your belt, it's time to build a real-time signal processing pipeline. 

[GNU Radio](https://www.gnuradio.org/) is an open-source visual programming framework where you connect DSP blocks to form a "flowgraph." It executes highly optimized C++ DSP routines under the hood, making it significantly faster than pure Python.

## Objective
Build a flowgraph that captures live RF data, isolates a specific signal using a Decimating Low-Pass Filter, and visualizes the spectrum before and after filtering.

## Lab Instructions

### Step 1: Initial Setup
1. Open **GNU Radio Companion (GRC)**.
2. In the top `Options` block, give your flowgraph an ID (e.g., `fm_receiver`).
3. Double-click the `samp_rate` variable block. Set it to `2.4e6` (2.4 MSPS).

### Step 2: Ingesting the Signal
1. From the block list on the right, drag an **RTL-SDR Source** block into the workspace. 
   *(Note: If you don't have an SDR plugged in, use a **File Source** pointing to the `.dat` file you generated in the Python lab, followed by a **Throttle** block set to `samp_rate`).*
2. Double-click the SDR Source:
   - **Sample Rate:** `samp_rate`
   - **Ch0: Frequency:** `100e6` (or any local strong FM station).
   - **Ch0: Gain Mode:** Automatic (or manual ~30 dB).

### Step 3: Visualizing the Wideband Spectrum
1. Add a **QT GUI Sink** block.
2. Connect the output of the RTL-SDR Source to the input of the QT GUI Sink.
3. Double-click the QT GUI Sink:
   - **Name:** "Wideband Input"
   - **Bandwidth:** `samp_rate`
   - **Center Frequency:** `100e6`

*If you hit the "Play" button now, you will see a real-time FFT waterfall of the entire 2.4 MHz spectrum.*

### Step 4: The Decimating Low-Pass Filter
Our target FM radio station is only about $200 \text{ kHz}$ wide, but we are processing $2.4 \text{ MHz}$ of bandwidth. We will decimate by $M=10$ to reduce our processing load to $240 \text{ kSPS}$.

1. Add a **Low Pass Filter** block to the workspace.
2. Disconnect the SDR from the QT Sink. Connect the SDR output to the Low Pass Filter input.
3. Double click the Low Pass Filter:
   - **Decimation:** `10` *(This handles the downsampling step automatically!)*
   - **Sample Rate:** `samp_rate` *(The input rate).*
   - **Cutoff Freq:** `100e3` (100 kHz. Since it's a complex signal spanning $-100 \text{ kHz}$ to $+100 \text{ kHz}$, this gives us our $200 \text{ kHz}$ bandwidth).
   - **Transition Width:** `20e3` (20 kHz. The area where the filter rolls off from passband to stopband).
   - **Window:** Hamming (A standard FIR filter window).

### Step 5: Visualizing the Decimated Spectrum
1. Add a *second* **QT GUI Sink** block.
2. Connect the output of the Low Pass Filter to this new sink.
3. Double-click the new QT GUI Sink:
   - **Name:** "Decimated Output"
   - **Bandwidth:** `samp_rate / 10` *(Crucial! Our sample rate is now strictly 240 kHz).*
   - **Center Frequency:** `0` (Baseband).

### Step 6: Execution and Analysis
Click the **Execute (Play)** button. You should see two windows:
1. **Wideband Input:** Showing 2.4 MHz of spectrum. You will likely see multiple radio stations as peaks.
2. **Decimated Output:** Showing only 240 kHz of spectrum, perfectly zoomed in on your target station, with all adjacent stations mathematically filtered out to prevent aliasing.

---

### 📝 Practice Activity
1. **Observe Aliasing in Real-Time:** In your Low Pass Filter block, change the **Cutoff Freq** to `300e3` (300 kHz), but leave the **Decimation** at `10`. By doing this, you are explicitly violating the Nyquist rule for the new sample rate ($240 \text{ kSPS}$). Run the flowgraph. What happens to the adjacent stations in the decimated spectrum? (Hint: Watch them fold over into your baseband!)
2. **Exporting:** To prepare for Phase 2 (Verilog), add a **File Sink** block to the output of your Low Pass Filter to record clean, decimated I/Q data. You will use this data to write Verilog testbenches later!
