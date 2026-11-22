---
sidebar_position: 1
---

import NyquistSimulator from '@site/src/components/Interactive/NyquistSimulator';
import IQSimulator from '@site/src/components/Interactive/IQSimulator';
import DiagramBlock from '@site/src/components/Interactive/DiagramBlock';
import VideoLectureCard from '@site/src/components/Interactive/VideoLectureCard';
import InteractiveQuiz from '@site/src/components/Interactive/InteractiveQuiz';

# 1. Core DSP Theory & Sampling

Before writing code or configuring flowgraphs, you must understand the mathematical foundation of Digital Signal Processing (DSP). This page covers the absolute essentials for SDR, starting with the rigorous mechanics of how analog signals enter the digital domain.

<DiagramBlock
  type="sdr-chain"
  caption="End-to-End SDR Signal Chain: Antenna → LNA → IQ Mixer → Anti-Aliasing Filter → ADC → FPGA Digital Downconversion (DDC)"
/>

## 1. Sampling

Sampling is the process of converting a continuous-time (analog) signal into a discrete-time signal by measuring its amplitude at regular time intervals.

- **Sampling Period ($T_s$):** The fixed time duration between successive samples.
- **Sampling Frequency / Rate ($f_s$):** The number of samples taken per second, measured in Hertz (Hz):
  $$f_s = \frac{1}{T_s}$$

In the frequency domain, ideal sampling multiplies the continuous signal $x(t)$ with a periodic train of Dirac delta impulses. This operation creates copies (spectral replicas) of the original signal’s spectrum, shifted by integer multiples of the sampling frequency:
$$X_s(f) = \frac{1}{T_s} \sum_{k=-\infty}^{\infty} X(f - k f_s)$$

## 2. Nyquist–Shannon Sampling Theorem

The Nyquist–Shannon Sampling Theorem defines the minimum sampling rate required to perfectly reconstruct a continuous-time signal from its discrete samples without loss of information.

- **Bandlimited Signal:** A signal whose Fourier transform is strictly zero outside a finite frequency band:
  $$\vert X(f) \vert = 0 \quad \text{for} \quad \vert f \vert > f_{\max}$$
- **Nyquist Criterion:** The sampling rate must be strictly greater than twice the highest frequency component present in the signal:
  $$f_s > 2 f_{\max}$$
- **Nyquist Frequency (Folding Frequency):** Half of the sampling rate, representing the maximum frequency that can be uniquely resolved:
  $$f_{\text{Nyquist}} = \frac{f_s}{2}$$
- **Nyquist Rate:** The minimum theoretical sampling rate required for a signal with maximum frequency $f_{\max}$, equal to $2 f_{\max}$.

When this condition is satisfied, the original continuous signal can be reconstructed using sinc interpolation (Whittaker–Shannon interpolation formula):
$$x(t) = \sum_{n=-\infty}^{\infty} x(n T_s) \operatorname{sinc}\left(\frac{t - n T_s}{T_s}\right)$$

## 3. Aliasing

Aliasing occurs when a signal is sampled at an insufficient rate ($f_s \le 2 f_{\max}$).

When undersampled, the adjacent spectral replicas centered at $k f_s$ overlap with each other. This causes high-frequency content to "fold" into lower frequency bands, distorting the signal and making it indistinguishable from a lower-frequency counterpart (an "alias").

### Apparent Frequency Calculation
For an input frequency $f_{\text{in}} > \frac{f_s}{2}$, the alias frequency $f_{\text{alias}}$ observed in the baseband $[0, f_s / 2]$ is given by:
$$f_{\text{alias}} = \vert f_{\text{in}} - k \cdot f_s \vert$$
where $k$ is an integer chosen such that $0 \le f_{\text{alias}} \le \frac{f_s}{2}$.

**Example:** If $f_s = 100\text{ Hz}$ ($f_{\text{Nyquist}} = 50\text{ Hz}$) and an analog tone of $70\text{ Hz}$ is sampled:
$$f_{\text{alias}} = \vert 70 - 100 \vert = 30\text{ Hz}$$
The sampled data will appear as an authentic $30\text{ Hz}$ sine wave.

### Manifestations in Applications
- **Audio:** High-frequency sounds fold down into the audible spectrum, creating unwanted harmonic distortion, harsh buzzes, or false tones.
- **Computer Graphics / Vision:** High spatial frequencies produce visual artifacts such as the Moiré effect, jagged diagonal lines ("jaggies"), or false textures on fine patterns.
- **Video:** The stroboscopic effect (e.g., wagon-wheel effect, where rotating spokes appear stationary or rotate backwards).

## 4. Preventing Aliasing

Once aliasing occurs during the sampling process, it is mathematically impossible to separate the true signal from the alias using post-processing alone. Therefore, aliasing must be prevented prior to sampling:

- **Anti-Aliasing Filter (Analog Low-Pass Filter):** An analog low-pass filter is applied to the signal before the Analog-to-Digital Converter (ADC). It attenuates all frequency components above $\frac{f_s}{2}$ to an insignificant level.
- **Oversampling:** Sampling at a rate significantly higher than $2 f_{\max}$. This widens the transition band for the analog anti-aliasing filter, allowing the use of simpler, lower-order analog filters, followed by digital filtering and downsampling (decimation).

<NyquistSimulator />

---

## 5. Digital Mixing & IQ Sampling

Mixing is the process of shifting a signal's frequency. In software and SDR, this is achieved by multiplying the incoming time-domain signal $x[n]$ by a complex sinusoid (a local oscillator).

To shift a signal by frequency $f_c$:
$$y[n] = x[n] \cdot e^{-j 2 \pi \frac{f_c}{f_s} n}$$

**Why it matters in SDR:**
If you tune your SDR to 100 MHz, but the signal of interest is at 100.5 MHz, you don't need to retune the hardware. You can digitally shift the spectrum down by 500 kHz using this multiplication.

<IQSimulator />

## 6. The Fast Fourier Transform (FFT)

The FFT converts our time-domain I/Q samples into the frequency domain, allowing us to see the spectrum (like the waterfall plots in SDR software).

The Discrete Fourier Transform (DFT) is defined as:
$$X[k] = \sum_{n=0}^{N-1} x[n] e^{-j 2 \pi \frac{k n}{N}}$$

Where:
- $N$ is the FFT size (number of bins).
- $x[n]$ are the time-domain samples.
- $X[k]$ is the frequency-domain representation.

**Frequency Resolution:**
The width of each frequency bin depends on the sample rate and the FFT size:
$$\Delta f = \frac{f_s}{N}$$
To get a finer frequency resolution, you must increase the FFT size $N$.

---

## 🎥 Video Masterclass: Sampling & SDR Hardware

<VideoLectureCard
  title="Software Defined Radio with HackRF: Sampling & Nyquist Rate"
  youtubeId="5u_eXN1pD7k"
  speaker="Michael Ossmann (Great Scott Gadgets)"
  description="The legendary Michael Ossmann walks through analog electromagnetic signals, receiver front-ends, ADC conversion, and demonstrates how inadequate sampling corrupts spectrum observation."
  takeaways={[
    "Analog anti-aliasing filters are irreplaceable by software post-processing",
    "Sample rate determines both RF bandwidth captured and ADC dynamic resolution",
    "Quadrature (IQ) mixing separates positive and negative RF spectrum"
  ]}
/>

---

## 🧠 Interactive Knowledge Check

<InteractiveQuiz
  title="Challenge 1: Apparent Alias Frequency"
  question="An SDR system is sampling at f_s = 40 MHz. An unauthorized test transmitter broadcasts a strong CW tone at 65 MHz into your antenna. If your receiver lacks an analog anti-aliasing filter, at what frequency will this tone appear in your digital baseband spectrum [0, 20 MHz]?"
  options={[
    "15 MHz",
    "25 MHz",
    "40 MHz",
    "65 MHz"
  ]}
  correctIndex={0}
  hint="Recall the folding formula: f_alias = |f_in - k · f_s|, choosing integer k such that f_alias is between 0 and f_s / 2."
  explanation="Spot on! f_alias = |65 MHz - 1 × 40 MHz| = 25 MHz... Wait, let's check: 65 - 40 = 25 MHz, which is above the 20 MHz Nyquist limit (40/2 = 20 MHz)! It folds across 20 MHz down to: |65 - 2 × 40| = |-15| = 15 MHz! The phantom signal will show up right at 15 MHz."
/>

<InteractiveQuiz
  title="Challenge 2: Quadrature Sampling"
  question="Why does an SDR capture two data streams (In-Phase 'I' and Quadrature 'Q') instead of a single real-valued ADC channel?"
  options={[
    "To double the volume/amplitude of the received audio signal",
    "To unambiguously distinguish between positive (+f) and negative (-f) frequencies",
    "Because FPGAs cannot process odd numbers of data wires",
    "To provide redundant backup data in case one wire breaks"
  ]}
  correctIndex={1}
  hint="Think about Euler's formula: cos(ωt) = cos(-ωt), whereas e^(jωt) is asymmetric."
  explanation="Exactly! For real-only signals, cos(+ωt) and cos(-ωt) produce identical real samples, making it impossible to know whether a signal is above or below the center frequency. IQ complex sampling gives us a 2D rotating phasor that resolves direction of rotation."
/>

---

### 📝 Practice Activity
1. **Math Verification:** If your RTL-SDR is sampling at $2.048 \text{ MSPS}$ (Mega-Samples Per Second) and you compute a 1024-point FFT, what is the frequency resolution ($\Delta f$) of each bin? *(Calculate this and verify it)*.
2. **Apparent Frequency:** If an RTL-SDR is sampling at $2 \text{ MHz}$ without an anti-aliasing filter, and a strong out-of-band signal at $3.2 \text{ MHz}$ leaks into the ADC, at what frequency will it appear in your digital baseband?
3. **PySDR Reading:** Read [PySDR Chapter 2: Frequency Domain](https://pysdr.org/content/frequency_domain.html) to visualize these concepts.

