---
sidebar_position: 4
---

# Phase 4: SoC Architecture & System Integration

Modern defense systems require complex data routing between hardware logic and host operating systems. This phase focuses on Systems-on-Chip (SoC) where the FPGA fabric interfaces with embedded ARM processors over high-speed buses.

## Goals
- **Objective:** Interface FPGA logic with CPU systems via streaming interfaces and Direct Memory Access (DMA).
- **Key Concepts:** AXI4-Stream protocols, Yocto/Buildroot for embedded Linux, memory mapping.
- **Hardware Needed:** SoC board (Analog Devices PlutoSDR or DE10-Nano).

## Resources
- **RocketBoards:** The definitive resource for integrating embedded Linux with Intel (Cyclone) SoCs.
- **Yocto Project Mega-Manual:** Learn how to bake custom embedded Linux distributions tailored to your hardware architecture.
