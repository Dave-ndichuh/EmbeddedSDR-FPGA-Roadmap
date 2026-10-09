---
sidebar_position: 1
---

# 1. Core DSP Theory

Before writing code or configuring flowgraphs, you must understand the mathematical foundation of Digital Signal Processing (DSP). This page covers the absolute essentials for SDR.

## 1. Nyquist-Shannon Sampling Theorem

To perfectly reconstruct an analog signal from discrete samples, the sampling rate ($f_s$) must be at least twice the maximum bandwidth ($B$) of the signal.

$$
f_s \ge 2B
$$

**Why it matters in SDR:**
If you sample at a rate lower than $2B$, high-frequency components will "fold" back into the lower frequencies, causing **aliasing**. When configuring your RTL-SDR, setting the sample rate dictates the maximum spectrum bandwidth you can observe at one time (e.g., $f_s = 2.4 \text{ MHz}$ allows you to see $2.4 \text{ MHz}$ of bandwidth using complex I/Q sampling).

## 2. Digital Mixing (Frequency Shifting)

Mixing is the process of shifting a signal's frequency. In software, this is achieved by multiplying the incoming time-domain signal $x[n]$ by a complex sinusoid (a local oscillator).

To shift a signal by frequency $f_c$:

$$
y[n] = x[n] \cdot e^{-j 2 \pi \frac{f_c}{f_s} n}
$$

**Why it matters in SDR:**
If you tune your SDR to 100 MHz, but the signal of interest is at 100.5 MHz, you don't need to retune the hardware. You can digitally shift the spectrum down by 500 kHz using this multiplication.

## 3. The Fast Fourier Transform (FFT)

The FFT converts our time-domain I/Q samples into the frequency domain, allowing us to see the spectrum (like the waterfall plots in SDR software).

The Discrete Fourier Transform (DFT) is defined as:

$$
X[k] = \sum_{n=0}^{N-1} x[n] e^{-j 2 \pi \frac{k n}{N}}
$$

Where:
- $N$ is the FFT size (number of bins).
- $x[n]$ are the time-domain samples.
- $X[k]$ is the frequency-domain representation.

**Frequency Resolution:**
The width of each frequency bin depends on the sample rate and the FFT size:
$$
\Delta f = \frac{f_s}{N}
$$
To get a finer frequency resolution, you must increase the FFT size $N$.

---

### 📝 Practice Activity
1. **Math Verification:** If your RTL-SDR is sampling at $2.048 \text{ MSPS}$ (Mega-Samples Per Second) and you compute a 1024-point FFT, what is the frequency resolution ($\Delta f$) of each bin? *(Calculate this and verify it)*.
2. **PySDR Reading:** Read [PySDR Chapter 2: Frequency Domain](https://pysdr.org/content/frequency_domain.html) to visualize these concepts.
