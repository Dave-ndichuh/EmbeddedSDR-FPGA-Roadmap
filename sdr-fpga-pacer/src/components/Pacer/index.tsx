import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

const PHASES = [
  {
    id: 'phase1',
    title: 'Phase 1: SDR & DSP Software',
    link: '/docs/Phase-1',
    tasks: [
      { id: 'p1_1', text: 'Understand Nyquist-Shannon Sampling' },
      { id: 'p1_2', text: 'Implement Digital Mixing' },
      { id: 'p1_3', text: 'Build FIR Filter (Discrete Convolution)' },
      { id: 'p1_4', text: 'Complete PySDR chapters (Pulse Shaping & Sync)' },
      { id: 'p1_5', text: 'Complete GNU Radio Guided Tutorials' }
    ]
  },
  {
    id: 'phase2',
    title: 'Phase 2: HDL & FPGA Basics',
    link: '/docs/Phase-2',
    tasks: [
      { id: 'p2_1', text: 'Master Combinational vs Sequential Logic' },
      { id: 'p2_2', text: 'Complete HDLBits up to Finite State Machines' },
      { id: 'p2_3', text: 'Write Verilator C++ Testbenches' },
      { id: 'p2_4', text: 'Synthesize & Deploy to Cyclone/Zynq Board' }
    ]
  },
  {
    id: 'phase3',
    title: 'Phase 3: Hardware-Accelerated DSP',
    link: '/docs/Phase-3',
    tasks: [
      { id: 'p3_1', text: 'Implement Direct Digital Synthesis (DDS)' },
      { id: 'p3_2', text: 'Build a Hardware FIR Filter in Verilog' },
      { id: 'p3_3', text: 'Implement Fixed-point Arithmetic Modules' },
      { id: 'p3_4', text: 'Study ZipCPU DSP FPGA Guidelines' }
    ]
  },
  {
    id: 'phase4',
    title: 'Phase 4: SoC Architecture & System Integration',
    link: '/docs/Phase-4',
    tasks: [
      { id: 'p4_1', text: 'Understand AXI4-Stream Protocols' },
      { id: 'p4_2', text: 'Implement Direct Memory Access (DMA)' },
      { id: 'p4_3', text: 'Study Embedded Linux (Yocto/Buildroot)' },
      { id: 'p4_4', text: 'Complete RocketBoards Tutorials' }
    ]
  },
  {
    id: 'phase5',
    title: 'Phase 5: The Capstone Portfolio Project',
    link: '/docs/Phase-5',
    tasks: [
      { id: 'p5_1', text: 'Write Custom IP Core (e.g., Burst Detector)' },
      { id: 'p5_2', text: 'Verify with Exhaustive Testbenches' },
      { id: 'p5_3', text: 'Integrate into bladeRF/LimeSDR Image' },
      { id: 'p5_4', text: 'Ensure USB 3.0 / PCIe Data Exfiltration' },
      { id: 'p5_5', text: 'Perform Lab Validation (Oscilloscope/Logic Analyzer)' }
    ]
  }
];

export default function PacerDashboard() {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('sdr-fpga-pacer-progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const toggleTask = (taskId) => {
    const updated = { ...progress, [taskId]: !progress[taskId] };
    setProgress(updated);
    localStorage.setItem('sdr-fpga-pacer-progress', JSON.stringify(updated));
  };

  const calculatePhaseProgress = (tasks) => {
    const completed = tasks.filter(t => progress[t.id]).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const totalTasks = PHASES.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const totalCompleted = Object.values(progress).filter(Boolean).length;
  const overallProgress = Math.round((totalCompleted / totalTasks) * 100) || 0;

  return (
    <div className={styles.pacerContainer}>
      <div className={styles.pacerHeader}>
        <h1>SDR & FPGA Pacer</h1>
        <p>Overall Curriculum Progress: {overallProgress}%</p>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarFill} style={{ width: `${overallProgress}%`, backgroundColor: 'var(--ifm-color-success)' }}></div>
        </div>
      </div>

      {PHASES.map((phase) => {
        const phaseProgress = calculatePhaseProgress(phase.tasks);
        return (
          <div key={phase.id} className={styles.phaseCard}>
            <div className={styles.phaseHeader}>
              <h2 className={styles.phaseTitle}>
                <Link to={phase.link}>{phase.title}</Link>
              </h2>
              <span>{phaseProgress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${phaseProgress}%` }}></div>
            </div>
            <ul className={styles.taskList}>
              {phase.tasks.map((task) => (
                <li key={task.id} className={styles.taskItem}>
                  <input
                    type="checkbox"
                    id={task.id}
                    checked={!!progress[task.id]}
                    onChange={() => toggleTask(task.id)}
                  />
                  <label htmlFor={task.id}>{task.text}</label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
