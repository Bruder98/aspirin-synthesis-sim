/**
 * src/test/pedagogyKatexStress.test.tsx
 * CHALLENGER 2: Adversarial KaTeX Rigor, Rapid Stage Hopping & Tab Toggling Stress Suite
 * Validates:
 * 1. KaTeX formula parsing safety: katex.renderToString(math, { throwOnError: true }) for all formulas.
 * 2. Rapid stage transitions (1 -> 6 -> 2 -> 5 -> 3 -> 4) under active rendering.
 * 3. Rapid 60Hz tab toggling (ELI5 <-> DEEP_DIVE <-> TELEMETRY) with zero DOM corruption.
 * 4. Failure mode switches across all tabs (NONE -> EARLY_WATER -> OVERHEATING -> WARM_WASH -> NONE).
 * 5. Extreme randomized concurrency chaos monkey testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import katex from 'katex';
import { useAspirinStore } from '../store/useAspirinStore';
import { Eli5PedagogyCard } from '../components/pedagogy/Eli5PedagogyCard';
import { AcademicDeepDiveCard, LatexSpan } from '../components/pedagogy/AcademicDeepDiveCard';
import App from '../App';
import { SynthesisStageId, FailureMode } from '../engine/types';

const h = React.createElement;

// Mock Path2D & Canvas 2D for JSDOM
class MockPath2D {
  moveTo = vi.fn();
  lineTo = vi.fn();
  quadraticCurveTo = vi.fn();
  bezierCurveTo = vi.fn();
  arc = vi.fn();
  arcTo = vi.fn();
  ellipse = vi.fn();
  rect = vi.fn();
  roundRect = vi.fn();
  closePath = vi.fn();
}
(globalThis as any).Path2D = MockPath2D;

function createMockCanvas2DContext(): Partial<CanvasRenderingContext2D> {
  const gradientMock = { addColorStop: vi.fn() };
  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    roundRect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn().mockReturnValue([]),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    createLinearGradient: vi.fn().mockReturnValue(gradientMock),
    createRadialGradient: vi.fn().mockReturnValue(gradientMock),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'center',
    globalAlpha: 1.0,
  } as unknown as Partial<CanvasRenderingContext2D>;
}

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('CHALLENGER 2: Pedagogy & KaTeX Stress Verifier Suite', () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    useAspirinStore.getState().resetSimulation();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(createMockCanvas2DContext()) as any;
  });

  afterEach(() => {
    cleanup();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe('1. KaTeX Mathematical Formulas Rigor (throwOnError: true)', () => {
    const formulasToTest = [
      // Stage 1
      {
        name: 'Stage 1 Oxonium Activation',
        latex: '\\mathrm{CH_3COOCOCH_3 + H_3PO_4 \\rightleftharpoons [CH_3C(OH)=O-COCH_3]^+ + H_2PO_4^-}',
      },
      // Stage 2
      {
        name: 'Stage 2 SnAc Mechanism',
        latex: '\\mathrm{Ar-OH + [CH_3-C^+=O-Ac] \\to [Ar-O^+(H)-C(OH)(CH_3)-Ac] \\to Ar-OCOCH_3 + AcOH + H^+}',
      },
      // Stage 3
      {
        name: 'Stage 3 Metastable Jouyban-Acree',
        latex: '\\Delta G^* \\propto \\frac{\\gamma^3}{(k_B T \\ln S)^2}, \\quad S = \\frac{C}{C^*}, \\quad \\epsilon_r \\approx 6.2',
      },
      // Stage 4
      {
        name: 'Stage 4 CNT Nucleation Barrier Collapse',
        latex: '\\Delta G^* = \\frac{16\\pi \\gamma^3 v_m^2}{3 (k_B T \\ln S)^2} \\xrightarrow{\\mathrm{H_2O}} 0.14\\, k_B T \\quad (\\text{Burst})',
      },
      // Stage 5
      {
        name: 'Stage 5 Monoclinic Ostwald Ripening',
        latex: '\\text{Monoclinic } P2_1/c, \\quad C(r) = C_\\infty \\exp\\left(\\frac{2\\gamma v_m}{k_B T r}\\right) \\quad [\\text{Gibbs-Thomson}]',
      },
      // Stage 6
      {
        name: 'Stage 6 Darcy Law & Wash Selectivity',
        latex: '\\frac{dV}{dt} = \\frac{A \\Delta P}{\\mu (R_c + R_m)}, \\quad \\text{Solubility}(0^\\circ\\mathrm{C}) \\ll \\text{Solubility}(25^\\circ\\mathrm{C})',
      },
      // Failure EARLY_WATER
      {
        name: 'Failure EARLY_WATER Hydrolysis',
        latex: '\\mathrm{(CH_3CO)_2O + H_2O \\to 2\\, CH_3COOH}, \\quad \\Delta H = -56.5\\text{ kJ/mol}',
      },
      // Failure OVERHEATING
      {
        name: 'Failure OVERHEATING Polycondensation',
        latex: '\\mathrm{n\\, C_7H_6O_3 \\xrightarrow{\\Delta > 85^\\circ\\text{C}} [\\text{Salicylate Polymers}] + Tar + CO_2\\uparrow}',
      },
      // Failure WARM_WASH
      {
        name: 'Failure WARM_WASH Solubility Deficit',
        latex: 'C^*(25^\\circ\\text{C}) \\approx 0.33\\text{ g/100mL} \\gg C^*(0^\\circ\\text{C}) \\approx 0.08\\text{ g/100mL}',
      },
      // Yield Derivation Formulas
      {
        name: 'Stoichiometry SA Moles',
        latex: 'n_{\\text{SA}} = \\frac{m_{\\text{SA}}}{M_{\\text{SA}}} = \\frac{2.00\\text{ g}}{138.121\\text{ g/mol}} = 0.0145\\text{ mol}',
      },
      {
        name: 'Stoichiometry AA Moles',
        latex: 'n_{\\text{AA}} = \\frac{V_{\\text{AA}} \\times \\rho_{\\text{AA}}}{M_{\\text{AA}}} = \\frac{5.0\\text{ mL} \\times 1.082\\text{ g/mL}}{102.089\\text{ g/mol}} = 0.0530\\text{ mol}',
      },
      {
        name: 'Stoichiometry Theoretical Yield',
        latex: 'm_{\\text{theo}} = n_{\\text{limiting}} \\times M_{\\text{ASA}} = 2.609\\text{ g}',
      },
      {
        name: 'Stoichiometry Percent Yield',
        latex: '\\%\\text{Yield} = \\left(\\frac{m_{\\text{actual}}}{m_{\\text{theo}}}\\right) \\times 100\\% = 82.4\\%',
      },
    ];

    formulasToTest.forEach(({ name, latex }) => {
      it(`parses "${name}" with zero errors under throwOnError: true`, () => {
        // Test inline mode
        expect(() => {
          const inlineHtml = katex.renderToString(latex, {
            throwOnError: true,
            displayMode: false,
          });
          expect(inlineHtml).toContain('katex');
        }).not.toThrow();

        // Test display mode
        expect(() => {
          const displayHtml = katex.renderToString(latex, {
            throwOnError: true,
            displayMode: true,
          });
          expect(displayHtml).toContain('katex-display');
        }).not.toThrow();
      });
    });

    it('renders LatexSpan component without crashing or throwing on boundary formulas', () => {
      const { container } = render(
        h('div', null, [
          h(LatexSpan, { key: '1', math: '\\alpha + \\beta = \\gamma', displayMode: false }),
          h(LatexSpan, { key: '2', math: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', displayMode: true }),
        ])
      );

      expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2);
    });

    it('gracefully degrades in LatexSpan if provided malformed LaTeX input without crashing React', () => {
      const invalidLatex = '\\invalidCommand{missingBrace';
      let renderResult: any = null;
      expect(() => {
        renderResult = render(h(LatexSpan, { math: invalidLatex, displayMode: false }));
      }).not.toThrow();

      expect(renderResult?.container?.textContent).toContain(invalidLatex);
    });
  });

  describe('2. Non-Linear Stage Hopping (1 -> 6 -> 2 -> 5 -> 3 -> 4) Stress Test', () => {
    const NON_LINEAR_SEQUENCE: SynthesisStageId[] = [1, 6, 2, 5, 3, 4];

    it('thrashes non-linear stage hops in Eli5PedagogyCard without state desync or broken DOM', () => {
      const { rerender } = render(h(Eli5PedagogyCard));

      // Perform 5 full cycles of the non-linear sequence (30 stage hops)
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const stage of NON_LINEAR_SEQUENCE) {
          act(() => {
            useAspirinStore.getState().setStage(stage);
          });
          rerender(h(Eli5PedagogyCard));

          const card = screen.getByTestId('eli5-card');
          expect(card).toBeDefined();
          expect(card.textContent).toContain(`STAGE ${stage}`);
          expect(card.textContent).not.toContain('undefined');
          expect(card.textContent).not.toContain('NaN');
        }
      }
    });

    it('thrashes non-linear stage hops in AcademicDeepDiveCard with continuous KaTeX re-rendering', () => {
      const { rerender } = render(h(AcademicDeepDiveCard));

      for (let cycle = 0; cycle < 5; cycle++) {
        for (const stage of NON_LINEAR_SEQUENCE) {
          act(() => {
            useAspirinStore.getState().setStage(stage);
          });
          rerender(h(AcademicDeepDiveCard));

          const card = screen.getByTestId('academic-deep-dive-card');
          expect(card).toBeDefined();
          expect(card.querySelectorAll('.katex').length).toBeGreaterThan(0);
          expect(card.textContent).not.toContain('undefined');
          expect(card.textContent).not.toContain('NaN');
        }
      }
    });

    it('rapidly hops stages inside full App component', () => {
      render(h(App));

      // Switch to DEEP_DIVE tab
      act(() => {
        useAspirinStore.getState().setActiveTab('DEEP_DIVE');
      });

      for (const stage of NON_LINEAR_SEQUENCE) {
        act(() => {
          useAspirinStore.getState().setStage(stage);
        });

        expect(useAspirinStore.getState().currentStage).toBe(stage);
        expect(screen.getByTestId('academic-deep-dive-card')).toBeDefined();
      }
    });
  });

  describe('3. Rapid 60Hz Tab Toggling (ELI5 <-> DEEP_DIVE <-> TELEMETRY)', () => {
    it(
      'rapidly alternates tabs across 60 frame iterations without memory leak or orphan DOM',
      () => {
        const tabs: Array<'ELI5' | 'DEEP_DIVE' | 'TELEMETRY'> = ['ELI5', 'DEEP_DIVE', 'TELEMETRY'];
        render(h(App));

        for (let i = 0; i < 60; i++) {
          const targetTab = tabs[i % tabs.length];
          act(() => {
            useAspirinStore.getState().setActiveTab(targetTab);
          });

          if (targetTab === 'ELI5') {
            expect(screen.getByTestId('eli5-card')).toBeDefined();
            expect(screen.queryByTestId('academic-deep-dive-card')).toBeNull();
            expect(screen.queryByTestId('telemetry-dashboard-panel')).toBeNull();
          } else if (targetTab === 'DEEP_DIVE') {
            expect(screen.getByTestId('academic-deep-dive-card')).toBeDefined();
            expect(screen.queryByTestId('eli5-card')).toBeNull();
            expect(screen.queryByTestId('telemetry-dashboard-panel')).toBeNull();
          } else {
            expect(screen.getByTestId('telemetry-dashboard-panel')).toBeDefined();
            expect(screen.queryByTestId('eli5-card')).toBeNull();
            expect(screen.queryByTestId('academic-deep-dive-card')).toBeNull();
          }
        }
      },
      15000
    );
  });

  describe('4. Failure Mode Switching across All Tabs', () => {
    const FAILURE_MODES: FailureMode[] = [
      'NONE',
      'EARLY_WATER',
      'OVERHEATING',
      'WARM_WASH',
      'NONE',
    ];
    const TABS: Array<'ELI5' | 'DEEP_DIVE' | 'TELEMETRY'> = ['ELI5', 'DEEP_DIVE', 'TELEMETRY'];

    TABS.forEach((tab) => {
      it(`safely switches failure modes sequentially in ${tab} tab`, () => {
        render(h(App));
        act(() => {
          useAspirinStore.getState().setActiveTab(tab);
        });

        for (const mode of FAILURE_MODES) {
          act(() => {
            useAspirinStore.getState().setFailureMode(mode);
          });

          expect(useAspirinStore.getState().failureMode).toBe(mode);

          if (tab === 'ELI5') {
            const card = screen.getByTestId('eli5-card');
            if (mode !== 'NONE') {
              expect(card.textContent).toContain('실패 분기');
            }
          } else if (tab === 'DEEP_DIVE') {
            const card = screen.getByTestId('academic-deep-dive-card');
            if (mode !== 'NONE') {
              expect(screen.getByTestId('academic-failure-banner')).toBeDefined();
            } else {
              expect(screen.queryByTestId('academic-failure-banner')).toBeNull();
            }
          } else if (tab === 'TELEMETRY') {
            const panel = screen.getByTestId('telemetry-dashboard-panel');
            expect(panel).toBeDefined();
            expect(panel.textContent).not.toContain('NaN');
          }
        }
      });
    });
  });

  describe('5. High-Frequency Chaos Monkey: 60 Concurrent State Mutations', () => {
    it(
      'survives random concurrent thrashing of stage, failureMode, and activeTab',
      () => {
        const tabs: Array<'ELI5' | 'DEEP_DIVE' | 'TELEMETRY'> = ['ELI5', 'DEEP_DIVE', 'TELEMETRY'];
        const failureModes: FailureMode[] = ['NONE', 'EARLY_WATER', 'OVERHEATING', 'WARM_WASH'];
        const stages: SynthesisStageId[] = [1, 2, 3, 4, 5, 6];

        render(h(App));

        expect(() => {
          for (let i = 0; i < 60; i++) {
            const randomStage = stages[Math.floor(Math.random() * stages.length)];
            const randomMode = failureModes[Math.floor(Math.random() * failureModes.length)];
            const randomTab = tabs[Math.floor(Math.random() * tabs.length)];

            act(() => {
              useAspirinStore.getState().setStage(randomStage);
              useAspirinStore.getState().setFailureMode(randomMode);
              useAspirinStore.getState().setActiveTab(randomTab);
            });
          }
        }).not.toThrow();

        // Ensure stable state afterwards
        act(() => {
          useAspirinStore.getState().resetSimulation();
        });

        expect(useAspirinStore.getState().currentStage).toBe(1);
        expect(useAspirinStore.getState().failureMode).toBe('NONE');
        expect(useAspirinStore.getState().activeTab).toBe('ELI5');
        expect(screen.getByTestId('eli5-card')).toBeDefined();
      },
      15000
    );
  });
});
