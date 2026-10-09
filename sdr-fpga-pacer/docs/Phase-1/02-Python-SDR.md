---
sidebar_position: 2
---

# 2. Python SDR Labs

With the theory established, we will use Python to ingest, process, and visualize real RF signals. Python is the perfect playground for DSP because libraries like NumPy and SciPy handle the heavy mathematical lifting.

## Lab 1: Reading and Visualizing I/Q Data

In this lab, we will use the `pyrtlsdr` library to capture FM radio signals and plot the Power Spectral Density (PSD) using `matplotlib`.

### Prerequisites
Install the required Python libraries:
```bash
pip install pyrtlsdr numpy matplotlib scipy
```
*(Note: You must have the RTL-SDR hardware drivers installed on your OS for `pyrtlsdr` to communicate with the dongle).*

### Python Script: Capturing the Spectrum

```python
import numpy as np
import matplotlib.pyplot as plt
from rtlsdr import RtlSdr
from scipy import signal

# 1. Configure the SDR
sdr = RtlSdr()
sdr.sample_rate = 2.048e6    # 2.048 MHz
sdr.center_freq = 99.5e6     # Tune to a local FM station (e.g., 99.5 MHz)
sdr.gain = 'auto'

print("Capturing samples...")
# 2. Read samples (must be a multiple of 1024)
samples = sdr.read_samples(256 * 1024)
sdr.close()

# 3. Compute Power Spectral Density (PSD)
# We use Welch's method for a smoother spectrum plot
f, Pxx_den = signal.welch(samples, 
                          sdr.sample_rate, 
                          nperseg=1024, 
                          return_onesided=False)

# Shift the FFT so the center frequency is in the middle of the plot
f = np.fft.fftshift(f)
Pxx_den = np.fft.fftshift(Pxx_den)

# 4. Plotting
plt.figure(figsize=(10, 6))
# Convert power to decibels (dB)
plt.plot((f + sdr.center_freq) / 1e6, 10 * np.log10(Pxx_den))
plt.title("FM Radio Spectrum")
plt.xlabel("Frequency (MHz)")
plt.ylabel("PSD (dB/Hz)")
plt.grid(True)
plt.show()
```

### 🔬 Experiment Analysis
When you run this code, you should see a peak at your center frequency. 
- Try changing the `nperseg` parameter in `signal.welch` to `2048` or `512`. How does the smoothness and resolution of the plot change?
- Try applying a digital mixing function (from the Theory page) to shift the data *before* plotting.

---

### 📝 Practice Activity
1. **PySDR Lab:** Complete [PySDR Chapter 3: Capturing Data](https://pysdr.org/content/rtl_sdr.html).
2. **Challenge:** Modify the Python script to save the captured I/Q samples to a binary `.dat` file using `np.ndarray.tofile()`. We will need this data for GNU Radio later.
