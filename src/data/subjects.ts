export interface SubjectItem {
  name: string;
  teacher: string;
  category: "kejuruan" | "umum" | "bahasa" | "lainnya";
  color: string;
}

export const CLASS_SUBJECTS: SubjectItem[] = [
  {
    name: "Dasar Dasar Keahlian RPL",
    teacher: "Syaiful Bachri, S.T.",
    category: "kejuruan",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  },
  {
    name: "Informatika",
    teacher: "Syaiful Bachri, S.T.",
    category: "kejuruan",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
  },
  {
    name: "KKA (Keterampilan Komputer & Aplikasi)",
    teacher: "Syaiful Bachri, S.T.",
    category: "kejuruan",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50",
  },
  {
    name: "Matematika",
    teacher: "Nurkholis Aiman, S.Pd.",
    category: "umum",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
  },
  {
    name: "Bahasa Indonesia",
    teacher: "Abimanyu Hadi Sukoro, M.Pd.",
    category: "bahasa",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  },
  {
    name: "Bahasa Inggris",
    teacher: "Ernin Fitria, S.Pd.",
    category: "bahasa",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50",
  },
  {
    name: "Bahasa Jepang (日本語)",
    teacher: "Maria Ulfah, S.S.",
    category: "bahasa",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
  },
  {
    name: "Projek IPAS (Ilmu Pengetahuan Alam & Sosial)",
    teacher: "Dini Purnama Sari, S.Pd.",
    category: "umum",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  {
    name: "Pendidikan Agama & Budi Pekerti",
    teacher: "Siti Aisyah, S.Ag.",
    category: "umum",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  },
  {
    name: "Pendidikan Pancasila & Kewarganegaraan (PKN)",
    teacher: "Maya Yuliani, M.Pd.",
    category: "umum",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  },
  {
    name: "Sejarah Indonesia",
    teacher: "Jumiati, S.Pd.",
    category: "umum",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  },
  {
    name: "Seni Budaya",
    teacher: "Nur Ita Putri, S.Pd.",
    category: "umum",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
  },
  {
    name: "PJOK (Pendidikan Jasmani, Olahraga & Kesehatan)",
    teacher: "Fikri Fadhil Fauzan, S.Pd.",
    category: "umum",
    color: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-200 dark:border-lime-900/50",
  },
  {
    name: "Bimbingan Konseling (BK)",
    teacher: "Ritawati, S.Pd.",
    category: "umum",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50",
  },
  {
    name: "Lainnya / Tugas Khusus",
    teacher: "Wali Kelas / Guru Pembimbing",
    category: "lainnya",
    color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800",
  },
];

export const TASK_TYPES = [
  { value: "tugas", label: "Tugas Harian", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200" },
  { value: "pr", label: "Pekerjaan Rumah (PR)", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200" },
  { value: "projek", label: "Projek / Kelompok", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200" },
  { value: "ulangan", label: "Ulangan / Ujian", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200" },
  { value: "praktikum", label: "Praktikum Coding", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200" },
];
