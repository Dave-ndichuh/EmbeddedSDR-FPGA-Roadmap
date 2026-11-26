import { GLOSSARY_TERMS } from './glossaryData';
import { EXPLAINER_DATABASE } from './explainerData';

export type PhaseLabel = 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Phase 5' | 'Reference';

export interface ModuleCatalogItem {
  id: string;
  path: string;
  title: string;
  phase: PhaseLabel;
  kind: 'Overview' | 'Theory' | 'Lab' | 'Reference';
  interactiveTags: Array<'Simulator' | 'Quiz' | 'Video' | 'Diagram' | 'Flashcards'>;
}

export interface QuizCatalogItem {
  id: string;
  title: string;
  phase: Exclude<PhaseLabel, 'Reference'>;
  moduleId: string;
  modulePath: string;
}

export interface SimulatorCatalogItem {
  id: string;
  title: string;
  phase: Exclude<PhaseLabel, 'Reference'>;
  moduleId: string;
  modulePath: string;
  kind: 'Canvas Simulator' | 'Protocol Engine';
}

export interface VideoCatalogItem {
  id: string;
  youtubeId: string;
  title: string;
  speaker: string;
  phase: Exclude<PhaseLabel, 'Reference'>;
  moduleId: string;
  modulePath: string;
}

export interface ConceptCatalogItem {
  id: string;
  title: string;
  domain: string;
  phase: PhaseLabel;
  link: string;
  hasDerivation: boolean;
  inCodex: boolean;
  inExplainer: boolean;
}

export interface PacerPhaseDef {
  id: string;
  phaseLabel: Exclude<PhaseLabel, 'Reference'>;
  title: string;
  link: string;
  tasks: { id: string; text: string }[];
}

export const PACER_PHASES: PacerPhaseDef[] = [
  {
    id: 'phase1',
    phaseLabel: 'Phase 1',
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
    phaseLabel: 'Phase 2',
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
    phaseLabel: 'Phase 3',
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
    phaseLabel: 'Phase 4',
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
    phaseLabel: 'Phase 5',
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

export const CURRICULUM_MODULES: ModuleCatalogItem[] = [
  {
    id: 'phase-1-overview',
    path: '/docs/Phase-1',
    title: 'Phase 1: SDR & DSP Software Fundamentals',
    phase: 'Phase 1',
    kind: 'Overview',
    interactiveTags: []
  },
  {
    id: 'phase-1-dsp-theory',
    path: '/docs/Phase-1/DSP-Theory',
    title: 'Core DSP Theory & Sampling',
    phase: 'Phase 1',
    kind: 'Theory',
    interactiveTags: ['Diagram', 'Simulator', 'Video', 'Quiz']
  },
  {
    id: 'phase-1-python-sdr',
    path: '/docs/Phase-1/Python-SDR',
    title: 'Python SDR Labs',
    phase: 'Phase 1',
    kind: 'Lab',
    interactiveTags: []
  },
  {
    id: 'phase-1-filtering-decimation',
    path: '/docs/Phase-1/Filtering-and-Decimation',
    title: 'Filtering and Decimation',
    phase: 'Phase 1',
    kind: 'Theory',
    interactiveTags: []
  },
  {
    id: 'phase-1-gnu-radio-lab',
    path: '/docs/Phase-1/GNU-Radio-Lab',
    title: 'GNU Radio Lab',
    phase: 'Phase 1',
    kind: 'Lab',
    interactiveTags: []
  },
  {
    id: 'phase-2-overview',
    path: '/docs/Phase-2',
    title: 'Phase 2: HDL & FPGA Basics',
    phase: 'Phase 2',
    kind: 'Overview',
    interactiveTags: []
  },
  {
    id: 'phase-2-verilog-paradigms',
    path: '/docs/Phase-2/Verilog-Paradigms',
    title: 'Verilog Paradigms & Architecture',
    phase: 'Phase 2',
    kind: 'Theory',
    interactiveTags: ['Diagram', 'Video', 'Quiz']
  },
  {
    id: 'phase-2-verilator-lab',
    path: '/docs/Phase-2/Verilator-Lab',
    title: 'Verilator Simulation Lab',
    phase: 'Phase 2',
    kind: 'Lab',
    interactiveTags: []
  },
  {
    id: 'phase-3-overview',
    path: '/docs/Phase-3',
    title: 'Phase 3: Hardware-Accelerated DSP',
    phase: 'Phase 3',
    kind: 'Overview',
    interactiveTags: []
  },
  {
    id: 'phase-3-fixed-point-math',
    path: '/docs/Phase-3/Fixed-Point-Math',
    title: 'Fixed-Point Arithmetic',
    phase: 'Phase 3',
    kind: 'Theory',
    interactiveTags: []
  },
  {
    id: 'phase-3-dds-nco',
    path: '/docs/Phase-3/DDS-NCO',
    title: 'Direct Digital Synthesis (DDS / NCO)',
    phase: 'Phase 3',
    kind: 'Theory',
    interactiveTags: []
  },
  {
    id: 'phase-3-hardware-fir',
    path: '/docs/Phase-3/Hardware-FIR',
    title: 'Hardware FIR Filters',
    phase: 'Phase 3',
    kind: 'Theory',
    interactiveTags: ['Diagram', 'Quiz']
  },
  {
    id: 'phase-3-dsp-verilator-lab',
    path: '/docs/Phase-3/DSP-Verilator-Lab',
    title: 'DSP Verilator Lab: Verifying the NCO',
    phase: 'Phase 3',
    kind: 'Lab',
    interactiveTags: []
  },
  {
    id: 'phase-4-soc-integration',
    path: '/docs/Phase-4',
    title: 'Phase 4: SoC Architecture & System Integration',
    phase: 'Phase 4',
    kind: 'Theory',
    interactiveTags: ['Simulator', 'Video', 'Quiz']
  },
  {
    id: 'phase-5-capstone',
    path: '/docs/Phase-5',
    title: 'Phase 5: The Capstone Portfolio Project',
    phase: 'Phase 5',
    kind: 'Lab',
    interactiveTags: []
  },
  {
    id: 'docs-thesaurus-glossary',
    path: '/docs/Thesaurus-and-Glossary',
    title: 'Field Codex & Thesaurus (Doc Guide)',
    phase: 'Reference',
    kind: 'Reference',
    interactiveTags: []
  },
  {
    id: 'interactive-field-codex',
    path: '/glossary',
    title: 'Interactive Field Codex & Flashcards',
    phase: 'Reference',
    kind: 'Reference',
    interactiveTags: ['Flashcards']
  }
];

export const INTERACTIVE_SIMULATORS: SimulatorCatalogItem[] = [
  {
    id: 'nyquist-simulator',
    title: 'Nyquist & Aliasing Time-Domain Simulator',
    phase: 'Phase 1',
    moduleId: 'phase-1-dsp-theory',
    modulePath: '/docs/Phase-1/DSP-Theory',
    kind: 'Canvas Simulator'
  },
  {
    id: 'iq-simulator',
    title: 'Complex IQ Phasor & Constellation Analyzer',
    phase: 'Phase 1',
    moduleId: 'phase-1-dsp-theory',
    modulePath: '/docs/Phase-1/DSP-Theory',
    kind: 'Canvas Simulator'
  },
  {
    id: 'axi-stream-visualizer',
    title: 'AXI4-Stream Bus Handshake Engine',
    phase: 'Phase 4',
    moduleId: 'phase-4-soc-integration',
    modulePath: '/docs/Phase-4',
    kind: 'Protocol Engine'
  }
];

export const INTERACTIVE_QUIZZES: QuizCatalogItem[] = [
  {
    id: 'quiz-apparent-alias-frequency',
    title: 'Challenge 1: Apparent Alias Frequency',
    phase: 'Phase 1',
    moduleId: 'phase-1-dsp-theory',
    modulePath: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'quiz-quadrature-sampling',
    title: 'Challenge 2: Quadrature Sampling',
    phase: 'Phase 1',
    moduleId: 'phase-1-dsp-theory',
    modulePath: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'quiz-inadvertent-latch-trap',
    title: 'Challenge 1: The Inadvertent Latch Trap',
    phase: 'Phase 2',
    moduleId: 'phase-2-verilog-paradigms',
    modulePath: '/docs/Phase-2/Verilog-Paradigms'
  },
  {
    id: 'quiz-shift-register-bug',
    title: 'Challenge 2: Shift Register Bug',
    phase: 'Phase 2',
    moduleId: 'phase-2-verilog-paradigms',
    modulePath: '/docs/Phase-2/Verilog-Paradigms'
  },
  {
    id: 'quiz-transposed-fir-critical-path',
    title: 'Challenge 1: Direct Form vs. Transposed FIR Critical Path',
    phase: 'Phase 3',
    moduleId: 'phase-3-hardware-fir',
    modulePath: '/docs/Phase-3/Hardware-FIR'
  },
  {
    id: 'quiz-symmetric-coefficient-optimization',
    title: 'Challenge 2: Symmetric Coefficient Optimization',
    phase: 'Phase 3',
    moduleId: 'phase-3-hardware-fir',
    modulePath: '/docs/Phase-3/Hardware-FIR'
  },
  {
    id: 'quiz-axi-stream-protocol-compliance',
    title: 'Challenge 1: AXI-Stream Protocol Compliance',
    phase: 'Phase 4',
    moduleId: 'phase-4-soc-integration',
    modulePath: '/docs/Phase-4'
  }
];

export const VIDEO_LECTURES: VideoCatalogItem[] = [
  {
    id: 'video-5u_eXN1pD7k',
    youtubeId: '5u_eXN1pD7k',
    title: 'Software Defined Radio with HackRF: Sampling & Nyquist Rate',
    speaker: 'Michael Ossmann (Great Scott Gadgets)',
    phase: 'Phase 1',
    moduleId: 'phase-1-dsp-theory',
    modulePath: '/docs/Phase-1/DSP-Theory'
  },
  {
    id: 'video-xK3k3gX8D0g',
    youtubeId: 'xK3k3gX8D0g',
    title: 'Digital Design & Verilog: The Simulation Cycle & Blocking vs Non-Blocking',
    speaker: 'Ben Eater & MIT OpenCourseWare',
    phase: 'Phase 2',
    moduleId: 'phase-2-verilog-paradigms',
    modulePath: '/docs/Phase-2/Verilog-Paradigms'
  },
  {
    id: 'video-vQ8gNqX_n2Y',
    youtubeId: 'vQ8gNqX_n2Y',
    title: 'AXI Protocol & Zynq Architecture Deep Dive',
    speaker: 'Phil\'s Lab & Xilinx University Program',
    phase: 'Phase 4',
    moduleId: 'phase-4-soc-integration',
    modulePath: '/docs/Phase-4'
  }
];

export const EXPLAINER_TO_CONCEPT_ID: Record<string, string> = {
  'nyquist-shannon': 'nyquist-aliasing',
  'iq-sampling': 'iq-sampling',
  'dds-nco': 'dds-nco',
  'fixed-point-q': 'fixed-point-q',
  'fir-transposed': 'transposed-fir',
  'static-timing-analysis': 'static-timing-analysis',
  'axi-stream': 'axi4-stream',
  'dft-fft': 'dft-fft',
  'cordic-algorithm': 'cordic',
  'inferred-latches': 'inferred-latch'
};

export const CONCEPT_CATALOG: ConceptCatalogItem[] = (() => {
  const map = new Map<string, ConceptCatalogItem>();

  for (const term of GLOSSARY_TERMS) {
    map.set(term.id, {
      id: term.id,
      title: term.term,
      domain: term.domain,
      phase: term.phase,
      link: `/glossary#${term.id}`,
      hasDerivation: false,
      inCodex: true,
      inExplainer: false
    });
  }

  for (const exp of EXPLAINER_DATABASE) {
    const canonicalId = EXPLAINER_TO_CONCEPT_ID[exp.id] || exp.id;
    const existing = map.get(canonicalId);
    if (existing) {
      existing.hasDerivation = Boolean(exp.derivation);
      existing.inExplainer = true;
    } else {
      map.set(canonicalId, {
        id: canonicalId,
        title: exp.title,
        domain: 'DSP & RF',
        phase: 'Phase 1',
        link: exp.relatedLink,
        hasDerivation: Boolean(exp.derivation),
        inCodex: false,
        inExplainer: true
      });
    }
  }

  return Array.from(map.values());
})();

export function normalizeAppPath(pathname: string): string {
  if (!pathname) return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export function findModuleByPath(pathname: string): ModuleCatalogItem | undefined {
  const normalized = normalizeAppPath(pathname).toLowerCase();
  return CURRICULUM_MODULES.find((m) => m.path.toLowerCase() === normalized);
}

export function resolveQuizCatalogItem(title: string, explicitId?: string): QuizCatalogItem | undefined {
  if (explicitId) {
    const byId = INTERACTIVE_QUIZZES.find((q) => q.id === explicitId);
    if (byId) return byId;
  }
  const normalized = title.trim().toLowerCase();
  return INTERACTIVE_QUIZZES.find((q) => q.title.trim().toLowerCase() === normalized);
}

export function slugifyId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
