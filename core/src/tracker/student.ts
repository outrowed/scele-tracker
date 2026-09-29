/**
 * Academic program and class year utilities for Universitas Indonesia (UI).
 */

export const ORG_CODE_PRODI_MAP: Record<string, string> = {
  // Fakultas Ilmu Komputer (Fasilkom UI)
  '01.00.12.01': 'Ilmu Komputer',
  '02.00.12.01': 'Ilmu Komputer (Kelas Internasional)',
  '03.00.12.01': 'Ilmu Komputer (S2)',
  '04.00.12.01': 'Teknologi Informasi (S2)',
  '05.00.12.01': 'Ilmu Komputer (S3)',
  '06.00.12.01': 'Sistem Informasi',
  '07.00.12.01': 'Sistem Informasi (Ekstensi)',
  '08.00.12.01': 'Sistem Informasi (Paralel)',
  '09.00.12.01': 'Ilmu Komputer (Paralel)',
};

export type StudentInfo = {
  npm?: string;
  kd_org?: string;
  jurusan?: string;
  prodi?: string;
  angkatan?: string;
  academicInfo?: string; // Formatted e.g. "Ilmu Komputer 2026"
};

/**
 * Derives class year (angkatan) from NPM or direct year string.
 * In Universitas Indonesia, 10-digit NPM starts with 2-digit admission year:
 * e.g. "2606..." -> 2026, "2406..." -> 2024, "2306..." -> 2023.
 */
export function deriveClassYear(npmOrYear?: string): string | undefined {
  if (!npmOrYear || typeof npmOrYear !== 'string') return undefined;
  const trimmed = npmOrYear.trim();
  if (/^20\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{2})06\d{6}$/);
  if (match) {
    return `20${match[1]}`;
  }
  const generalMatch = trimmed.match(/^(\d{2})\d{8}$/);
  if (generalMatch) {
    return `20${generalMatch[1]}`;
  }
  return undefined;
}

/**
 * Derives study program (prodi) name from attributes:
 * Priority:
 * 1. kd_org mapping if known
 * 2. explicit prodi or jurusan attribute
 * 3. fallback to "Ilmu Komputer" in Fasilkom context
 */
export function deriveProdi(kdOrg?: string, jurusan?: string, prodi?: string): string {
  if (kdOrg && ORG_CODE_PRODI_MAP[kdOrg]) {
    return ORG_CODE_PRODI_MAP[kdOrg];
  }
  if (prodi && typeof prodi === 'string' && prodi.trim()) {
    return prodi.trim();
  }
  if (jurusan && typeof jurusan === 'string' && jurusan.trim()) {
    return jurusan.trim();
  }
  return 'Ilmu Komputer';
}

export const PRODI_ORG_CODE_MAP: Record<string, string> = {
  'Ilmu Komputer': '01.00.12.01',
  'Ilmu Komputer (Kelas Internasional)': '02.00.12.01',
  'Ilmu Komputer (S2)': '03.00.12.01',
  'Teknologi Informasi (S2)': '04.00.12.01',
  'Ilmu Komputer (S3)': '05.00.12.01',
  'Sistem Informasi': '06.00.12.01',
  'Sistem Informasi (Ekstensi)': '07.00.12.01',
  'Sistem Informasi (Paralel)': '08.00.12.01',
  'Ilmu Komputer (Paralel)': '09.00.12.01',
};

/**
 * Derives organization code (kd_org) from study program if not already present.
 */
export function deriveOrgCode(kdOrg?: string, prodi?: string): string | undefined {
  if (kdOrg && typeof kdOrg === 'string' && kdOrg.trim()) {
    return kdOrg.trim();
  }
  if (prodi && PRODI_ORG_CODE_MAP[prodi]) {
    return PRODI_ORG_CODE_MAP[prodi];
  }
  return '01.00.12.01'; // Default for Ilmu Komputer (Fasilkom UI)
}

/**
 * Combines prodi and prodi code into a label without the class year.
 * e.g. "Ilmu Komputer (01.00.12.01)" or just "Ilmu Komputer".
 */
export function formatAcademicInfo(student: {
  npm?: string;
  kd_org?: string;
  jurusan?: string;
  prodi?: string;
  angkatan?: string;
  username?: string;
}): string {
  const prodi = deriveProdi(student.kd_org, student.jurusan, student.prodi);
  const kdOrg = deriveOrgCode(student.kd_org, prodi);
  if (kdOrg) {
    return `${prodi} (${kdOrg})`.trim();
  }
  return prodi;
}
