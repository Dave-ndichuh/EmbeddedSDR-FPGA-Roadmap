---
sidebar_position: 1
---

# Phase 1: SDR & DSP Software Fundamentals

Before designing digital hardware, it is critical to master signal processing in the software domain. This phase bridges mathematical theory with applied telecommunications, focusing on the ingestion, processing, and modulation of real-world I/Q data streams.

## Goals
- **Objective:** Build software flowgraphs and scripts to capture, demodulate, and filter real-world RF signals.
- **Key Concepts:** Nyquist-Shannon sampling, FFTs, QPSK/QAM modulation, FIR/IIR filtering.
- **Hardware Needed:** An RTL-SDR dongle (approx. $30) for data ingestion.

## DSP Concepts

| Concept | Mathematical Function | Applied SDR Use-Case |
|---------|-----------------------|----------------------|
| **Digital Mixing** | Multiplication by a complex sinusoid | Frequency shifting signals to baseband for analysis. |
| **Decimation** | Low-pass filter followed by downsampling | Reducing high sample rates to manageable computational loads. |
| **FIR Filtering** | Discrete convolution | Isolating specific transmission bands and removing adjacent noise. |
| **FFT** | Time domain to frequency domain conversion | Visualizing the RF spectrum and identifying active signal peaks. |

## Resources
- **PySDR (pysdr.org):** A comprehensive, free online guide to SDR and DSP using Python. Complete up through Pulse Shaping and Synchronization.
- **GNU Radio (gnuradio.org):** Download the framework and complete the official "Guided Tutorials".

## LaTeX Math Example
Here is an example of embedding DSP math formulas:

$$
X(k) = \sum_{n=0}^{N-1} x(n) e^{-j 2 \pi k n / N}
$$
