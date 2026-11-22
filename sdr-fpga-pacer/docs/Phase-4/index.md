---
sidebar_position: 4
---

import AXIStreamVisualizer from '@site/src/components/Interactive/AXIStreamVisualizer';
import VideoLectureCard from '@site/src/components/Interactive/VideoLectureCard';
import InteractiveQuiz from '@site/src/components/Interactive/InteractiveQuiz';

# Phase 4: SoC Architecture & System Integration

Modern defense and SDR systems require high-throughput data routing between programmable hardware logic (PL) and host operating systems (PS). This phase focuses on Systems-on-Chip (SoC) such as Xilinx Zynq and Intel Cyclone V, where the FPGA fabric interfaces with embedded ARM processors over high-speed buses.

## 1. High-Speed Interconnects: AXI4-Stream
The **ARM AMBA AXI4-Stream** protocol is the undisputed industry standard for moving high-speed RF samples between ADC/DAC IP cores, DSP filters, and DMA engines.

<AXIStreamVisualizer />

---

## 2. Direct Memory Access (DMA) & Zero-Copy Streaming
Instead of requiring the CPU to read each 16-bit IQ sample over a slow register bus, an **AXI DMA** core acts as an autonomous bus master. It packs streaming packets into DDR RAM bursts and fires an interrupt (`IRQ`) to alert Embedded Linux when a buffer is full.

---

## 🎥 Video Masterclass: AXI-Stream & SoC Interconnects

<VideoLectureCard
  title="AXI Protocol & Zynq Architecture Deep Dive"
  youtubeId="vQ8gNqX_n2Y"
  speaker="Phil's Lab & Xilinx University Program"
  description="Understanding how AXI4-Lite control registers, AXI4-Full memory-mapped transactions, and AXI4-Stream pipelines connect FPGA accelerators to ARM processing cores."
  takeaways={[
    "AXI4-Lite handles low-bandwidth control/status registers (CSRs)",
    "AXI-Stream handles point-to-point high-speed streaming without addresses",
    "DMA engines bridge AXI-Stream data into AXI4 memory mapped DDR space"
  ]}
/>

---

## 🧠 Interactive Knowledge Check

<InteractiveQuiz
  title="Challenge 1: AXI-Stream Protocol Compliance"
  question="According to the ARM AMBA AXI4-Stream Protocol Specification, which of the following handshaking rules is STRICTLY required to prevent bus deadlocks?"
  options={[
    "A Master is permitted to wait for TREADY to be asserted before it asserts TVALID",
    "A Master MUST NOT wait for TREADY to be asserted before asserting TVALID",
    "TREADY and TVALID must always transition in the exact same clock cycle",
    "TVALID must be deasserted immediately after every single sample"
  ]}
  correctIndex={1}
  hint="If Master A waits for Slave B's TREADY, and Slave B waits for Master A's TVALID, what happens to the system?"
  explanation="Correct! Section 2.2.1 of the ARM AMBA AXI-Stream specification dictates that TVALID must NEVER be combinationally dependent on TREADY. Violating this rule creates a circular dependency where both master and slave wait for each other indefinitely, causing a permanent system lockup!"
/>

---

## Goals
- **Objective:** Interface FPGA logic with CPU systems via streaming interfaces and Direct Memory Access (DMA).
- **Key Concepts:** AXI4-Stream protocols, Yocto/Buildroot for embedded Linux, memory mapping.
- **Hardware Needed:** SoC board (Analog Devices PlutoSDR, ZedBoard, or DE10-Nano).

## Resources
- **RocketBoards:** The definitive resource for integrating embedded Linux with Intel (Cyclone) SoCs.
- **Yocto Project Mega-Manual:** Learn how to bake custom embedded Linux distributions tailored to your hardware architecture.
