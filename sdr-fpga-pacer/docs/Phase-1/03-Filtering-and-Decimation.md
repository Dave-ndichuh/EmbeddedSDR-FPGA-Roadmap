---
sidebar_position: 3
---

# 3. Filtering and Decimation

Once a signal is properly sampled and brought into the digital domain, the next critical step is isolating the specific frequency band of interest and optimizing the data rate. This is achieved through digital filtering and decimation.

## 1. Digital Filters: FIR vs. IIR

Digital filters modify the frequency spectrum of a discrete-time signal. They are broadly categorized into two types: Finite Impulse Response (FIR) and Infinite Impulse Response (IIR).

### Finite Impulse Response (FIR)
An FIR filter computes the current output $y[n]$ strictly based on a weighted sum of the current and past input samples $x[n]$. It has no feedback.

**Difference Equation:**
$$y[n] = \sum_{k=0}^{M} b_k \cdot x[n-k]$$
Where:
- $M$ is the filter order.
- $b_k$ are the feedforward filter coefficients (the impulse response).

**Characteristics:**
- **Unconditionally Stable:** Because there is no feedback loop, bounded inputs always produce bounded outputs.
- **Strictly Linear Phase:** FIR filters can be designed to delay all frequencies equally, preserving the exact shape of waveforms (crucial for digital modulations like QAM/QPSK).
- **Drawback:** Requires a higher filter order $M$ (more mathematical operations per sample) to achieve sharp frequency cutoffs compared to IIR.

### Infinite Impulse Response (IIR)
An IIR filter utilizes feedback. The current output $y[n]$ depends on past inputs *and* past outputs.

**Difference Equation:**
$$y[n] = \sum_{k=0}^{M} b_k \cdot x[n-k] - \sum_{k=1}^{N} a_k \cdot y[n-k]$$
Where $a_k$ are the feedback coefficients.

**Characteristics:**
- **Computationally Efficient:** Achieves sharp cutoffs with significantly fewer coefficients than an FIR filter.
- **Non-Linear Phase:** Different frequencies are delayed by different amounts, which can distort the time-domain waveform.
- **Stability Risks:** Because of the feedback loop, improper design can place poles outside the unit circle in the Z-domain, causing the filter to oscillate out of control.

## 2. Decimation (Downsampling)

In SDR, hardware like the RTL-SDR often samples at a high rate (e.g., 2.4 MSPS) to capture a wide chunk of the spectrum. However, if your target signal (e.g., an FM broadcast) is only 200 kHz wide, processing 2.4 million complex samples per second is a massive waste of CPU/FPGA resources. 

**Decimation** is the process of reducing the sampling rate by an integer factor $M$.

### The Two-Step Decimation Process

If we simply throw away $M-1$ out of every $M$ samples, we violate the Nyquist-Shannon theorem. Dropping samples shrinks the Nyquist bandwidth to $f_s / (2M)$, meaning any noise or adjacent signals present in the original wideband signal will alias directly into our target signal.

Therefore, decimation is strictly a two-step process:

1. **Anti-Aliasing Digital Low-Pass Filter:** 
   Before dropping any samples, we must apply a digital low-pass filter (usually an FIR filter) to the high-rate signal. The filter's cutoff frequency $f_c$ must be less than the new, reduced Nyquist frequency:
   $$f_c < \frac{f_s}{2M}$$

2. **Downsampling:** 
   Once the out-of-band energy is filtered out, we can safely keep one out of every $M$ samples:
   $$y[m] = x_{\text{filtered}}[m \cdot M]$$

**Why this is magical in SDR:**
In GNU Radio and FPGA DSP, the FIR filter and the downsampler are almost always combined into a single **Decimating FIR Filter**. Because we only need every $M$-th output, we only *calculate* the FIR convolution for every $M$-th sample, resulting in massive computational savings!

---

### 📝 Practice Activity
1. **Filter Math:** If you have an incoming I/Q stream at $2.4 \text{ MSPS}$ and you want to decimate it by $M = 10$, what is the absolute maximum cutoff frequency $f_c$ your anti-aliasing filter can have to prevent aliasing?
2. **Phase Importance:** Research why "Linear Phase" is highly desirable when receiving Phase-Shift Keying (PSK) signals, making FIR filters the standard choice in SDR over IIR filters.
