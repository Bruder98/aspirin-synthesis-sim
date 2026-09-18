/**
 * 3D Molecular Data, CPK Geometries, Intermediate States, and Crystal Lattice Models
 * References: SPEC-UI-3D-PEDAGOGY-001, Section 3
 */

import { Atom3D, Bond3D, Molecule3D } from './types';

export const CPK_COLORS = {
  C: '#334155',    // Carbon (Slate 700)
  H: '#F8FAFC',    // Hydrogen (Off-white)
  O: '#EF4444',    // Oxygen (Red 500)
  P: '#F59E0B',    // Phosphorus (Amber 500)
  'H+': '#00F0FF', // Proton (Cyan glow)
} as const;

export const CPK_SPHERE_RADII = {
  C: 0.45,
  H: 0.28,
  O: 0.40,
  P: 0.52,
  'H+': 0.20,
} as const;

/**
 * 1. Salicylic Acid (C7H6O3) - 16 atoms
 */
export const SALICYLIC_ACID_3D: Molecule3D = {
  name: 'Salicylic Acid',
  formula: 'C7H6O3',
  atoms: [
    { id: 'SA_C1', element: 'C', pos: [0.00, 1.40, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C2', element: 'C', pos: [1.21, 0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C3', element: 'C', pos: [1.21, -0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C4', element: 'C', pos: [0.00, -1.40, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C5', element: 'C', pos: [-1.21, -0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C6', element: 'C', pos: [-1.21, 0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_C7', element: 'C', pos: [-0.05, 2.90, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'SA_O1', element: 'O', pos: [-1.15, 3.52, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'SA_O2', element: 'O', pos: [1.12, 3.52, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'SA_O3', element: 'O', pos: [2.42, 1.35, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O }, // Phenolic -OH
    { id: 'SA_H1', element: 'H', pos: [2.14, -1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'SA_H2', element: 'H', pos: [0.00, -2.48, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'SA_H3', element: 'H', pos: [-2.14, -1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'SA_H4', element: 'H', pos: [-2.14, 1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'SA_H5', element: 'H', pos: [-1.02, 4.48, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'SA_H6', element: 'H', pos: [2.35, 2.31, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H }, // Phenolic H
  ],
  bonds: [
    { atom1Id: 'SA_C1', atom2Id: 'SA_C2', order: 1.5 },
    { atom1Id: 'SA_C2', atom2Id: 'SA_C3', order: 1.5 },
    { atom1Id: 'SA_C3', atom2Id: 'SA_C4', order: 1.5 },
    { atom1Id: 'SA_C4', atom2Id: 'SA_C5', order: 1.5 },
    { atom1Id: 'SA_C5', atom2Id: 'SA_C6', order: 1.5 },
    { atom1Id: 'SA_C6', atom2Id: 'SA_C1', order: 1.5 },
    { atom1Id: 'SA_C1', atom2Id: 'SA_C7', order: 1.0 },
    { atom1Id: 'SA_C7', atom2Id: 'SA_O1', order: 1.0 },
    { atom1Id: 'SA_C7', atom2Id: 'SA_O2', order: 2.0 },
    { atom1Id: 'SA_C2', atom2Id: 'SA_O3', order: 1.0 },
    { atom1Id: 'SA_O1', atom2Id: 'SA_H5', order: 1.0 },
    { atom1Id: 'SA_O3', atom2Id: 'SA_H6', order: 1.0 },
    { atom1Id: 'SA_C3', atom2Id: 'SA_H1', order: 1.0 },
    { atom1Id: 'SA_C4', atom2Id: 'SA_H2', order: 1.0 },
    { atom1Id: 'SA_C5', atom2Id: 'SA_H3', order: 1.0 },
    { atom1Id: 'SA_C6', atom2Id: 'SA_H4', order: 1.0 },
  ]
};

/**
 * 2. Acetic Anhydride (C4H6O3) - 13 atoms
 */
export const ACETIC_ANHYDRIDE_3D: Molecule3D = {
  name: 'Acetic Anhydride',
  formula: 'C4H6O3',
  atoms: [
    { id: 'AA_O_bridge', element: 'O', pos: [0.00, 0.00, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'AA_C1', element: 'C', pos: [-1.18, 0.65, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AA_C2', element: 'C', pos: [1.18, -0.65, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AA_O1', element: 'O', pos: [-1.22, 1.86, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'AA_O2', element: 'O', pos: [1.22, -1.86, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'AA_Cme1', element: 'C', pos: [-2.42, -0.22, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AA_Cme2', element: 'C', pos: [2.42, 0.22, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AA_H1', element: 'H', pos: [-2.45, -0.86, 0.89], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AA_H2', element: 'H', pos: [-2.45, -0.86, -0.89], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AA_H3', element: 'H', pos: [-3.28, 0.44, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AA_H4', element: 'H', pos: [2.45, 0.86, 0.89], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AA_H5', element: 'H', pos: [2.45, 0.86, -0.89], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AA_H6', element: 'H', pos: [3.28, -0.44, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
  ],
  bonds: [
    { atom1Id: 'AA_O_bridge', atom2Id: 'AA_C1', order: 1.0 },
    { atom1Id: 'AA_O_bridge', atom2Id: 'AA_C2', order: 1.0 },
    { atom1Id: 'AA_C1', atom2Id: 'AA_O1', order: 2.0 },
    { atom1Id: 'AA_C2', atom2Id: 'AA_O2', order: 2.0 },
    { atom1Id: 'AA_C1', atom2Id: 'AA_Cme1', order: 1.0 },
    { atom1Id: 'AA_C2', atom2Id: 'AA_Cme2', order: 1.0 },
    { atom1Id: 'AA_Cme1', atom2Id: 'AA_H1', order: 1.0 },
    { atom1Id: 'AA_Cme1', atom2Id: 'AA_H2', order: 1.0 },
    { atom1Id: 'AA_Cme1', atom2Id: 'AA_H3', order: 1.0 },
    { atom1Id: 'AA_Cme2', atom2Id: 'AA_H4', order: 1.0 },
    { atom1Id: 'AA_Cme2', atom2Id: 'AA_H5', order: 1.0 },
    { atom1Id: 'AA_Cme2', atom2Id: 'AA_H6', order: 1.0 },
  ]
};

/**
 * 3. Phosphoric Acid Catalyst (H3PO4) - 8 atoms
 */
export const PHOSPHORIC_ACID_3D: Molecule3D = {
  name: 'Phosphoric Acid',
  formula: 'H3PO4',
  atoms: [
    { id: 'PA_P1', element: 'P', pos: [0.00, 0.00, 0.00], color: CPK_COLORS.P, radius: CPK_SPHERE_RADII.P },
    { id: 'PA_O1', element: 'O', pos: [0.00, 1.52, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O }, // P=O
    { id: 'PA_O2', element: 'O', pos: [1.43, -0.51, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O }, // P-OH
    { id: 'PA_O3', element: 'O', pos: [-0.72, -0.51, 1.24], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'PA_O4', element: 'O', pos: [-0.72, -0.51, -1.24], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'PA_H1', element: 'H', pos: [2.14, 0.12, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'PA_H2', element: 'H', pos: [-1.08, 0.12, 1.86], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'PA_H3', element: 'H', pos: [-1.08, 0.12, -1.86], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
  ],
  bonds: [
    { atom1Id: 'PA_P1', atom2Id: 'PA_O1', order: 2.0 },
    { atom1Id: 'PA_P1', atom2Id: 'PA_O2', order: 1.0 },
    { atom1Id: 'PA_P1', atom2Id: 'PA_O3', order: 1.0 },
    { atom1Id: 'PA_P1', atom2Id: 'PA_O4', order: 1.0 },
    { atom1Id: 'PA_O2', atom2Id: 'PA_H1', order: 1.0 },
    { atom1Id: 'PA_O3', atom2Id: 'PA_H2', order: 1.0 },
    { atom1Id: 'PA_O4', atom2Id: 'PA_H3', order: 1.0 },
  ]
};

/**
 * 4. Activated Oxonium Ion Intermediate ([C4H7O3]+)
 */
export const OXONIUM_ION_3D: Molecule3D = {
  name: 'Oxonium Ion Intermediate',
  formula: '[C4H7O3]+',
  atoms: [
    ...ACETIC_ANHYDRIDE_3D.atoms,
    { id: 'OX_H_proton', element: 'H+', pos: [-1.22, 2.76, 0.00], color: CPK_COLORS['H+'], radius: CPK_SPHERE_RADII['H+'] }
  ],
  bonds: [
    ...ACETIC_ANHYDRIDE_3D.bonds.filter(b => !(b.atom1Id === 'AA_C1' && b.atom2Id === 'AA_O1')),
    { atom1Id: 'AA_C1', atom2Id: 'AA_O1', order: 1.5 }, // Delocalized C-O+
    { atom1Id: 'AA_O1', atom2Id: 'OX_H_proton', order: 1.0 }
  ]
};

/**
 * 5. Acetylsalicylic Acid (Aspirin, C9H8O4) - 21 atoms
 */
export const ASPIRIN_3D: Molecule3D = {
  name: 'Acetylsalicylic Acid (Aspirin)',
  formula: 'C9H8O4',
  atoms: [
    // Benzene ring
    { id: 'ASA_C1', element: 'C', pos: [0.00, 1.40, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_C2', element: 'C', pos: [1.21, 0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_C3', element: 'C', pos: [1.21, -0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_C4', element: 'C', pos: [0.00, -1.40, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_C5', element: 'C', pos: [-1.21, -0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_C6', element: 'C', pos: [-1.21, 0.70, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    // Carboxyl group on C1
    { id: 'ASA_C7', element: 'C', pos: [-0.05, 2.90, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_O1', element: 'O', pos: [-1.15, 3.52, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'ASA_O2', element: 'O', pos: [1.12, 3.52, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'ASA_H5', element: 'H', pos: [-1.02, 4.48, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    // Ester linkage on C2
    { id: 'ASA_O3', element: 'O', pos: [2.42, 1.35, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'ASA_C8', element: 'C', pos: [3.58, 0.75, 0.20], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'ASA_O4', element: 'O', pos: [3.65, -0.42, 0.45], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'ASA_C9', element: 'C', pos: [4.75, 1.68, 0.10], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    // Methyl hydrogens on C9
    { id: 'ASA_H7', element: 'H', pos: [4.65, 2.45, 0.88], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'ASA_H8', element: 'H', pos: [4.75, 2.18, -0.88], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'ASA_H9', element: 'H', pos: [5.68, 1.12, 0.22], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    // Ring hydrogens
    { id: 'ASA_H1', element: 'H', pos: [2.14, -1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'ASA_H2', element: 'H', pos: [0.00, -2.48, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'ASA_H3', element: 'H', pos: [-2.14, -1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'ASA_H4', element: 'H', pos: [-2.14, 1.25, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
  ],
  bonds: [
    { atom1Id: 'ASA_C1', atom2Id: 'ASA_C2', order: 1.5 },
    { atom1Id: 'ASA_C2', atom2Id: 'ASA_C3', order: 1.5 },
    { atom1Id: 'ASA_C3', atom2Id: 'ASA_C4', order: 1.5 },
    { atom1Id: 'ASA_C4', atom2Id: 'ASA_C5', order: 1.5 },
    { atom1Id: 'ASA_C5', atom2Id: 'ASA_C6', order: 1.5 },
    { atom1Id: 'ASA_C6', atom2Id: 'ASA_C1', order: 1.5 },
    { atom1Id: 'ASA_C1', atom2Id: 'ASA_C7', order: 1.0 },
    { atom1Id: 'ASA_C7', atom2Id: 'ASA_O1', order: 1.0 },
    { atom1Id: 'ASA_C7', atom2Id: 'ASA_O2', order: 2.0 },
    { atom1Id: 'ASA_O1', atom2Id: 'ASA_H5', order: 1.0 },
    { atom1Id: 'ASA_C2', atom2Id: 'ASA_O3', order: 1.0 },
    { atom1Id: 'ASA_O3', atom2Id: 'ASA_C8', order: 1.0 },
    { atom1Id: 'ASA_C8', atom2Id: 'ASA_O4', order: 2.0 },
    { atom1Id: 'ASA_C8', atom2Id: 'ASA_C9', order: 1.0 },
    { atom1Id: 'ASA_C9', atom2Id: 'ASA_H7', order: 1.0 },
    { atom1Id: 'ASA_C9', atom2Id: 'ASA_H8', order: 1.0 },
    { atom1Id: 'ASA_C9', atom2Id: 'ASA_H9', order: 1.0 },
    { atom1Id: 'ASA_C3', atom2Id: 'ASA_H1', order: 1.0 },
    { atom1Id: 'ASA_C4', atom2Id: 'ASA_H2', order: 1.0 },
    { atom1Id: 'ASA_C5', atom2Id: 'ASA_H3', order: 1.0 },
    { atom1Id: 'ASA_C6', atom2Id: 'ASA_H4', order: 1.0 },
  ]
};

/**
 * 6. Acetic Acid Byproduct (C2H4O2) - 8 atoms
 */
export const ACETIC_ACID_3D: Molecule3D = {
  name: 'Acetic Acid',
  formula: 'C2H4O2',
  atoms: [
    { id: 'AcOH_C1', element: 'C', pos: [0.00, 0.00, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AcOH_O1', element: 'O', pos: [1.22, 0.00, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O }, // =O
    { id: 'AcOH_O2', element: 'O', pos: [-0.65, 1.18, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O }, // -OH
    { id: 'AcOH_H1', element: 'H', pos: [-1.62, 1.10, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AcOH_C2', element: 'C', pos: [-0.85, -1.25, 0.00], color: CPK_COLORS.C, radius: CPK_SPHERE_RADII.C },
    { id: 'AcOH_H2', element: 'H', pos: [-0.45, -1.82, 0.88], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AcOH_H3', element: 'H', pos: [-0.45, -1.82, -0.88], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'AcOH_H4', element: 'H', pos: [-1.91, -1.02, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
  ],
  bonds: [
    { atom1Id: 'AcOH_C1', atom2Id: 'AcOH_O1', order: 2.0 },
    { atom1Id: 'AcOH_C1', atom2Id: 'AcOH_O2', order: 1.0 },
    { atom1Id: 'AcOH_O2', atom2Id: 'AcOH_H1', order: 1.0 },
    { atom1Id: 'AcOH_C1', atom2Id: 'AcOH_C2', order: 1.0 },
    { atom1Id: 'AcOH_C2', atom2Id: 'AcOH_H2', order: 1.0 },
    { atom1Id: 'AcOH_C2', atom2Id: 'AcOH_H3', order: 1.0 },
    { atom1Id: 'AcOH_C2', atom2Id: 'AcOH_H4', order: 1.0 },
  ]
};

/**
 * 7. Water Molecule (H2O) - 3 atoms
 */
export const WATER_3D: Molecule3D = {
  name: 'Water',
  formula: 'H2O',
  atoms: [
    { id: 'W_O1', element: 'O', pos: [0.00, 0.00, 0.00], color: CPK_COLORS.O, radius: CPK_SPHERE_RADII.O },
    { id: 'W_H1', element: 'H', pos: [0.78, 0.58, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
    { id: 'W_H2', element: 'H', pos: [-0.78, 0.58, 0.00], color: CPK_COLORS.H, radius: CPK_SPHERE_RADII.H },
  ],
  bonds: [
    { atom1Id: 'W_O1', atom2Id: 'W_H1', order: 1.0 },
    { atom1Id: 'W_O1', atom2Id: 'W_H2', order: 1.0 },
  ]
};

/**
 * 8. Aspirin Centrosymmetric Dimer in Crystal Lattice (R_2^2(8) synthon)
 * Forms the fundamental building block of monoclinic Form I aspirin crystals.
 */
export const ASPIRIN_DIMER_3D: Molecule3D = {
  name: 'Aspirin Carboxylic Acid Dimer (R_2^2(8))',
  formula: '(C9H8O4)2',
  atoms: [
    // Monomer 1 (centered at [-2.5, 0, 0])
    ...ASPIRIN_3D.atoms.map(a => ({
      ...a,
      id: `${a.id}_m1`,
      pos: [a.pos[0] - 2.8, a.pos[1], a.pos[2]] as [number, number, number]
    })),
    // Monomer 2 (inverted and centered at [2.5, 0, 0])
    ...ASPIRIN_3D.atoms.map(a => ({
      ...a,
      id: `${a.id}_m2`,
      pos: [-a.pos[0] + 2.8, -a.pos[1] + 6.4, -a.pos[2]] as [number, number, number]
    }))
  ],
  bonds: [
    ...ASPIRIN_3D.bonds.map(b => ({
      ...b,
      atom1Id: `${b.atom1Id}_m1`,
      atom2Id: `${b.atom2Id}_m1`
    })),
    ...ASPIRIN_3D.bonds.map(b => ({
      ...b,
      atom1Id: `${b.atom1Id}_m2`,
      atom2Id: `${b.atom2Id}_m2`
    })),
    // Hydrogen bonds linking the carboxyl groups: O-H ... O=C
    { atom1Id: 'ASA_O1_m1', atom2Id: 'ASA_O2_m2', order: 1.0, type: 'hydrogen' },
    { atom1Id: 'ASA_O1_m2', atom2Id: 'ASA_O2_m1', order: 1.0, type: 'hydrogen' },
  ]
};

/**
 * 9. sp3 Tetrahedral Intermediate ([C11H13O6]+)
 * Transient adduct formed during nucleophilic addition before acetate leaving-group departure.
 */
export const TETRAHEDRAL_INTERMEDIATE_3D: Molecule3D = {
  name: 'sp3 Tetrahedral Intermediate',
  formula: '[C11H13O6]+',
  atoms: [
    ...SALICYLIC_ACID_3D.atoms.map(a => ({
      ...a,
      pos: [a.pos[0] - 1.5, a.pos[1] - 0.2, a.pos[2]] as [number, number, number]
    })),
    ...ACETIC_ANHYDRIDE_3D.atoms.map(a => ({
      ...a,
      pos: [a.pos[0] + 1.5, a.pos[1] + 0.2, a.pos[2]] as [number, number, number]
    }))
  ],
  bonds: [
    ...SALICYLIC_ACID_3D.bonds,
    ...ACETIC_ANHYDRIDE_3D.bonds.filter(b => !(b.atom1Id === 'AA_C1' && b.atom2Id === 'AA_O1')),
    { atom1Id: 'AA_C1', atom2Id: 'AA_O1', order: 1.0 },
    { atom1Id: 'SA_O3', atom2Id: 'AA_C1', order: 1.0 },
  ]
};

/**
 * Crystal Lattice Unit Cell Parameters (Monoclinic Form I, space group P2_1/c)
 */
export const CRYSTAL_LATTICE_CONSTANTS = {
  SPACE_GROUP: 'P2_1/c',
  A_ANGSTROM: 11.45,
  B_ANGSTROM: 6.60,
  C_ANGSTROM: 11.39,
  BETA_DEG: 95.6,
  Z_MOLECULES: 4,
  SYNTHON: 'R_2^2(8) Carboxylic Acid Dimer',
  FAST_GROWTH_AXIS: '[001] (Needle habit)',
} as const;
