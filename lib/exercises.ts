export type ExerciseDef = { name: string; group: string; kind: "strength" | "cardio"; met?: number };

const S = (group: string, names: string[]): ExerciseDef[] => names.map((name) => ({ name, group, kind: "strength" }));

export const EXERCISES: ExerciseDef[] = [
  ...S("Göğüs", ["Bench press", "Eğimli dumbbell press", "Dumbbell fly", "Şınav", "Cable crossover", "Dips"]),
  ...S("Sırt", ["Barfiks", "Lat pulldown", "Barbell row", "Dumbbell row", "Seated cable row", "Deadlift"]),
  ...S("Bacak", ["Squat", "Leg press", "Romanian deadlift", "Lunge", "Leg extension", "Leg curl", "Calf raise", "Hip thrust"]),
  ...S("Omuz", ["Overhead press", "Dumbbell shoulder press", "Lateral raise", "Face pull", "Rear delt fly"]),
  ...S("Kol", ["Barbell curl", "Dumbbell curl", "Hammer curl", "Triceps pushdown", "Skull crusher", "Overhead triceps extension"]),
  ...S("Karın", ["Plank (sn)", "Crunch", "Leg raise", "Russian twist", "Ab wheel"]),
  { name: "Yürüyüş", group: "Kardiyo", kind: "cardio", met: 3.5 },
  { name: "Tempolu yürüyüş", group: "Kardiyo", kind: "cardio", met: 5 },
  { name: "Koşu", group: "Kardiyo", kind: "cardio", met: 9.8 },
  { name: "Bisiklet", group: "Kardiyo", kind: "cardio", met: 7.5 },
  { name: "Eliptik", group: "Kardiyo", kind: "cardio", met: 5 },
  { name: "Kürek makinesi", group: "Kardiyo", kind: "cardio", met: 7 },
  { name: "Yüzme", group: "Kardiyo", kind: "cardio", met: 7 },
  { name: "İp atlama", group: "Kardiyo", kind: "cardio", met: 11 },
  { name: "HIIT", group: "Kardiyo", kind: "cardio", met: 8 },
  { name: "Yoga", group: "Kardiyo", kind: "cardio", met: 2.5 },
];

export const GROUPS = ["Göğüs", "Sırt", "Bacak", "Omuz", "Kol", "Karın", "Kardiyo"];

/** MET × kg × saat */
export const metKcal = (met: number, kg: number, minutes: number) => Math.round(met * kg * (minutes / 60));

/** Kuvvet antrenmanı için ortalama MET ≈ 5 */
export const STRENGTH_MET = 5;

/** Epley formülü ile tahmini 1 tekrar maksimum */
export const oneRM = (kg: number, reps: number) => (reps <= 0 || kg <= 0 ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));

export const volume = (sets: { reps: number; kg: number }[]) => sets.reduce((s, x) => s + (x.reps || 0) * (x.kg || 0), 0);
