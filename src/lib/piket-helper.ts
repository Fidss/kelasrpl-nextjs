// Comprehensive student name mapping between piketData schedule aliases and DB users
export const PIKET_NAME_ALIASES: Record<string, string> = {
  // SENIN
  "Aditya Laksamana P.": "ADITYA LAKSANA PRATAMA",
  "M. Hafidz Malik": "MUHAMMAD HAFIDZ MALIK",
  "Ricky Rahan": "RICKY RAHAN",
  "Arjun Wijaya": "ARJUN WIJAYA",
  "Virzi Aziqri B.": "VIRZI AZIQRI BUDIYANTO",
  "Cinta R. Arrasya": "CINTA RAMADANI ARRASYA",
  "Kirana Surya D.": "KIRANA SURYA DEWI",

  // SELASA
  "Risqi Noer Sanubari": "RIZKY NOER SANOEBARIE",
  "Ahmad Aqila Arham": "AHMAD AQILA ARHAM",
  "Muhamad Fadhlan Saugie": "MUHAMMAD FADLAN SAUGIE",
  "Rafael Sugiharto": "RAFAEL SUGIHARTO",
  "Zidane Zulfikar": "ZIDANE ZULFIKAR",
  "Annas Tassyah A.": "ANNAS TASSYAH ADELI",
  "Asyifa Nazzila F.": "ASYIFA NAZZILA FADLA",

  // RABU
  "Dika Dwi Putra": "DIKA DWI PUTRA",
  "Fadhyl Alhafizd": "FADHYL ALHAFIZD",
  "Imam Firmansyah": "IMAM FIRMANSYAH",
  "Maulana Saputra": "MAULANA SAPUTRA",
  "Zahran Ibnu Ardiansyah": "ZAHRAN IBNU ARDIANSYAH",
  "Muhammad Rafid Wiscaya": "MUHAMAD RAFID WICASA",
  "Azza Syahfina": "AZZA SYAHFYNA",

  // KAMIS
  "Aqila Raesha A.": "AQILA RAESHA ASSYAHRAN",
  "Bintang Very Purwanto": "BINTANG VERY PURWANTO",
  "Muhammad Husain Haekal": "MUHAMMAD HUSEIN HAEKAL",
  "Rakha Saputra": "RAKHA SAPUTRA",
  "Ahmad Fachrial Kibar": "AHMAD FACHRIYAL KIBAR",
  "Rama Alfarizi A.": "RAMA ALFARIZI ASSIDIQ",
  "Maysharah Zulfhah": "MAYSHARAH ZULFHA",

  // JUMAT
  "Al Qoirul Lathif Nazzril Putra": "AL QOIRUL LATHIF NAZZRIL PUTRA",
  "Ricky Dwi Aditiya": "RIZKY DWI ADITYA",
  "Azzila Putra Afrian": "AZZILA PUTRA AFRIAN",
  "Muhammad Hafiz Fahrezi": "MOHAMMAD HAFIZ FAHREZI",
  "Muhammad Rizki Alfatah": "MUHAMAD RIZKI ALFATAH",
  "Rasya Aditya": "RASYA ADITIYA",
  "Dhiya Ulhaq R.J.": "DHIYA ULHAQ RAMDHAN JONILMIANSYAH",
};

export interface MatchedStudent {
  id: number;
  name: string;
  nis: string;
  gender: string;
  role: string;
}

export function matchStudent(
  piketName: string,
  dbStudent: MatchedStudent
): boolean {
  const p = piketName.trim();
  const s = dbStudent.name.trim();

  // 1. Check known alias dictionary
  const mappedDbName = PIKET_NAME_ALIASES[p];
  if (mappedDbName && s.toUpperCase() === mappedDbName) {
    return true;
  }

  // 2. Exact match (case insensitive, ignore dots and spaces)
  const normP = p.toLowerCase().replace(/[.\s]/g, "");
  const normS = s.toLowerCase().replace(/[.\s]/g, "");
  if (normP === normS) return true;

  // 3. Match normalized words
  const piketWords = p
    .toLowerCase()
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const studWords = s
    .toLowerCase()
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (piketWords.length >= 1 && studWords.length >= 1) {
    // First name match
    if (piketWords[0] === studWords[0] || studWords[0].startsWith(piketWords[0]) || piketWords[0].startsWith(studWords[0])) {
      const piketWordSet = new Set(piketWords);
      const studWordSet = new Set(studWords);
      let commonCount = 0;
      for (const w of piketWordSet) {
        if (studWordSet.has(w)) commonCount++;
      }
      if (commonCount >= 2) return true;
    }
  }

  // 4. Significant words match (at least 2 words with length >= 3)
  const sigPiket = piketWords.filter((w) => w.length >= 3);
  const sigStud = new Set(studWords.filter((w) => w.length >= 3));
  if (sigPiket.length >= 2) {
    const matchedCount = sigPiket.filter((w) => sigStud.has(w)).length;
    if (matchedCount >= 2 || matchedCount === sigPiket.length) return true;
  }

  return false;
}

export function buildPiketRosterWithStudents(
  piketNames: string[],
  students: MatchedStudent[]
) {
  return piketNames.map((piketName, idx) => {
    const matched = students.find((s) => matchStudent(piketName, s));
    return {
      order: idx + 1,
      piket_name: piketName,
      matched_student_id: matched ? matched.id : null,
      matched_student_name: matched ? matched.name : null,
      matched_nis: matched ? matched.nis : null,
    };
  });
}
