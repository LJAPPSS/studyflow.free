export const SUBJECT_COLOR_KEYS = [
  'blue',
  'pink',
  'violet',
  'red',
  'yellow',
  'orange',
  'green',
  'teal',
  'cyan',
  'brown',
  'slate',
] as const;

export type SubjectColorKey = (typeof SUBJECT_COLOR_KEYS)[number];

export const SUBJECT_COLORS: Record<SubjectColorKey, { label: string; dot: string; soft: string; bar: string }> = {
  blue: { label: 'Blauw', dot: 'bg-blue-500', soft: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30', bar: 'bg-blue-500' },
  pink: { label: 'Roze', dot: 'bg-pink-500', soft: 'bg-pink-50 text-pink-800 ring-pink-200 dark:bg-pink-500/15 dark:text-pink-200 dark:ring-pink-500/30', bar: 'bg-pink-500' },
  violet: { label: 'Paars', dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30', bar: 'bg-violet-500' },
  red: { label: 'Rood', dot: 'bg-red-500', soft: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/30', bar: 'bg-red-500' },
  yellow: { label: 'Geel', dot: 'bg-yellow-400', soft: 'bg-yellow-50 text-yellow-900 ring-yellow-300 dark:bg-yellow-400/15 dark:text-yellow-200 dark:ring-yellow-400/30', bar: 'bg-yellow-400' },
  orange: { label: 'Oranje', dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/30', bar: 'bg-orange-500' },
  green: { label: 'Groen', dot: 'bg-green-600', soft: 'bg-green-50 text-green-800 ring-green-200 dark:bg-green-500/15 dark:text-green-200 dark:ring-green-500/30', bar: 'bg-green-600' },
  teal: { label: 'Turquoise', dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-500/30', bar: 'bg-teal-500' },
  cyan: { label: 'Cyaan', dot: 'bg-cyan-500', soft: 'bg-cyan-50 text-cyan-800 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-500/30', bar: 'bg-cyan-500' },
  brown: { label: 'Bruin', dot: 'bg-amber-800', soft: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-700/20 dark:text-amber-200 dark:ring-amber-700/40', bar: 'bg-amber-800' },
  slate: { label: 'Grijs', dot: 'bg-slate-500', soft: 'bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/30', bar: 'bg-slate-500' },
};

const SUGGESTED_SUBJECT_COLORS: Record<string, SubjectColorKey> = {
  wiskunde: 'blue',
  frans: 'pink',
  latijn: 'violet',
  nederlands: 'red',
  engels: 'yellow',
  geschiedenis: 'orange',
  natuurwetenschappen: 'green',
};

export const SUGGESTED_SUBJECT_NAMES = [
  'Wiskunde',
  'Frans',
  'Latijn',
  'Nederlands',
  'Engels',
  'Geschiedenis',
  'Natuurwetenschappen',
];

export function pickSubjectColor(name: string, usedColors: string[]): SubjectColorKey {
  const suggested = SUGGESTED_SUBJECT_COLORS[name.trim().toLowerCase()];
  if (suggested && !usedColors.includes(suggested)) return suggested;
  return SUBJECT_COLOR_KEYS.find((key) => !usedColors.includes(key)) ?? SUBJECT_COLOR_KEYS[0];
}

export const WEEKDAYS = [
  { value: 0, label: 'Maandag', short: 'Ma' },
  { value: 1, label: 'Dinsdag', short: 'Di' },
  { value: 2, label: 'Woensdag', short: 'Wo' },
  { value: 3, label: 'Donderdag', short: 'Do' },
  { value: 4, label: 'Vrijdag', short: 'Vr' },
  { value: 5, label: 'Zaterdag', short: 'Za' },
  { value: 6, label: 'Zondag', short: 'Zo' },
] as const;

export const SCHOOL_LEVELS = ['Eerste graad', 'Tweede graad', 'Derde graad'] as const;

export const DEFAULT_EXAM_PERIOD_NAMES = ['Kerstexamens', 'Paasexamens', 'Juniexamens'];

export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Heel laag',
  2: 'Laag',
  3: 'Gemiddeld',
  4: 'Hoog',
  5: 'Heel hoog',
};
