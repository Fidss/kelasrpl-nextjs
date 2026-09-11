export interface ScheduleItem {
  start: string;
  end: string;
  timeDisplay: string;
  subject: string;
  teacher: string | null;
  period: string | null;
  category: 'general' | 'vocational' | 'character' | 'break';
  interrupted?: string;
}

export const lessonsData: Record<number, ScheduleItem[]> = {
  1: [ // SENIN
    {
      start: '07:30', end: '09:00', timeDisplay: '07.30 - 09.00',
      subject: 'Pendidikan Agama & Budi Pekerti', teacher: 'Siti Aisyah, S.Ag.', period: 'Jam ke 1-2',
      category: 'general'
    },
    {
      start: '09:00', end: '10:55', timeDisplay: '09.00 - 10.55',
      subject: 'Sejarah Indonesia', teacher: 'Jumiati, S.Pd.', period: 'Jam ke 3-4',
      interrupted: 'Diselingi Istirahat (09.45 - 10.15)',
      category: 'general'
    },
    {
      start: '10:55', end: '12:15', timeDisplay: '10.55 - 12.15',
      subject: 'Pendidikan Pancasila & Kewarganegaraan (PKN)', teacher: 'Maya Yuliani, M.Pd.', period: 'Jam ke 5-6',
      category: 'general'
    },
    {
      start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00',
      subject: 'Informatika', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 7-9',
      category: 'vocational'
    }
  ],
  2: [ // SELASA
    {
      start: '06:45', end: '08:15', timeDisplay: '06.45 - 08.15',
      subject: 'Seni Budaya', teacher: 'Nur Ita Putri, S.Pd.', period: 'Jam ke 1-2',
      category: 'general'
    },
    {
      start: '08:15', end: '10:55', timeDisplay: '08.15 - 10.55',
      subject: 'PJOK (Pendidikan Jasmani, Olahraga & Kesehatan)', teacher: 'Fikri Fadhil Fauzan, S.Pd.', period: 'Jam ke 3-5',
      interrupted: 'Diselingi Istirahat (09.45 - 10.15)',
      category: 'general'
    },
    {
      start: '10:55', end: '11:35', timeDisplay: '10.55 - 11.35',
      subject: 'Bimbingan Konseling (BK)', teacher: 'Ritawati, S.Pd.', period: 'Jam ke 6',
      category: 'general'
    },
    {
      start: '11:35', end: '13:30', timeDisplay: '11.35 - 13.30',
      subject: 'Bahasa Inggris', teacher: 'Ernin Fitria, S.Pd.', period: 'Jam ke 7-8',
      interrupted: 'Diselingi ISHOMA (12.15 - 12.45)',
      category: 'general'
    },
    {
      start: '13:30', end: '15:00', timeDisplay: '13.30 - 15.00',
      subject: 'KKA (Keterampilan Komputer & Aplikasi)', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 9-10',
      category: 'vocational'
    }
  ],
  3: [ // RABU
    {
      start: '06:45', end: '08:15', timeDisplay: '06.45 - 08.15',
      subject: 'Bahasa Jepang (日本語)', teacher: 'Maria Ulfah, S.S.', period: 'Jam ke 1-2',
      category: 'general'
    },
    {
      start: '08:15', end: '09:45', timeDisplay: '08.15 - 09.45',
      subject: 'Bahasa Inggris', teacher: 'Ernin Fitria, S.Pd.', period: 'Jam ke 3-4',
      category: 'general'
    },
    {
      start: '10:15', end: '12:15', timeDisplay: '10.15 - 12.15',
      subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 5-7',
      category: 'vocational'
    },
    {
      start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00',
      subject: 'Bahasa Indonesia', teacher: 'Abimanyu Hadi Sukoro, M.Pd.', period: 'Jam ke 8-10',
      category: 'general'
    }
  ],
  4: [ // KAMIS
    {
      start: '06:45', end: '10:55', timeDisplay: '06.45 - 10.55',
      subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 1-5',
      interrupted: 'Diselingi Istirahat (09.45 - 10.15)',
      category: 'vocational'
    },
    {
      start: '10:55', end: '15:00', timeDisplay: '10.55 - 15.00',
      subject: 'Projek IPAS (Ilmu Pengetahuan Alam & Sosial)', teacher: 'Dini Purnama Sari, S.Pd.', period: 'Jam ke 6-10',
      interrupted: 'Diselingi ISHOMA (12.15 - 12.45)',
      category: 'general'
    }
  ],
  5: [ // JUMAT
    {
      start: '08:10', end: '11:15', timeDisplay: '08.10 - 11.15',
      subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 2-5',
      interrupted: 'Diselingi Istirahat (09.30 - 10.00)',
      category: 'vocational'
    },
    {
      start: '11:15', end: '15:00', timeDisplay: '11.15 - 15.00',
      subject: 'Matematika', teacher: 'Nurkholis Aiman, S.Pd.', period: 'Jam ke 6-9',
      interrupted: 'Diselingi ISHOMA & Sholat Jumat (11.50 - 12.45)',
      category: 'general'
    }
  ]
};

export const allActivitiesData: Record<number, ScheduleItem[]> = {
  1: [ // SENIN
    { start: '06:30', end: '07:30', timeDisplay: '06.30 - 07.30', subject: 'UPACARA BENDERA', teacher: null, period: null, category: 'character' },
    { start: '07:30', end: '09:00', timeDisplay: '07.30 - 09.00', subject: 'Pendidikan Agama & Budi Pekerti', teacher: 'Siti Aisyah, S.Ag.', period: 'Jam ke 1-2', category: 'general' },
    { start: '09:00', end: '09:45', timeDisplay: '09.00 - 09.45', subject: 'Sejarah Indonesia', teacher: 'Jumiati, S.Pd.', period: 'Jam ke 3', category: 'general' },
    { start: '09:45', end: '10:15', timeDisplay: '09.45 - 10.15', subject: 'ISTIRAHAT 1', teacher: null, period: null, category: 'break' },
    { start: '10:15', end: '10:55', timeDisplay: '10.15 - 10.55', subject: 'Sejarah Indonesia (Lanjutan)', teacher: 'Jumiati, S.Pd.', period: 'Jam ke 4', category: 'general' },
    { start: '10:55', end: '12:15', timeDisplay: '10.55 - 12.15', subject: 'Pendidikan Pancasila & Kewarganegaraan (PKN)', teacher: 'Maya Yuliani, M.Pd.', period: 'Jam ke 5-6', category: 'general' },
    { start: '12:15', end: '12:45', timeDisplay: '12.15 - 12.45', subject: 'ISHOMA (Istirahat, Sholat, Makan)', teacher: null, period: null, category: 'break' },
    { start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00', subject: 'Informatika', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 7-9', category: 'vocational' }
  ],
  2: [ // SELASA
    { start: '06:30', end: '06:45', timeDisplay: '06.30 - 06.45', subject: "Tadarus Al-Qur'an / Pendalaman Iman", teacher: null, period: null, category: 'character' },
    { start: '06:45', end: '08:15', timeDisplay: '06.45 - 08.15', subject: 'Seni Budaya', teacher: 'Nur Ita Putri, S.Pd.', period: 'Jam ke 1-2', category: 'general' },
    { start: '08:15', end: '09:45', timeDisplay: '08.15 - 09.45', subject: 'PJOK (Olahraga)', teacher: 'Fikri Fadhil Fauzan, S.Pd.', period: 'Jam ke 3-4', category: 'general' },
    { start: '09:45', end: '10:15', timeDisplay: '09.45 - 10.15', subject: 'ISTIRAHAT 1', teacher: null, period: null, category: 'break' },
    { start: '10:15', end: '10:55', timeDisplay: '10.15 - 10.55', subject: 'PJOK (Teori & Kesehatan)', teacher: 'Fikri Fadhil Fauzan, S.Pd.', period: 'Jam ke 5', category: 'general' },
    { start: '10:55', end: '11:35', timeDisplay: '10.55 - 11.35', subject: 'Bimbingan Konseling (BK)', teacher: 'Ritawati, S.Pd.', period: 'Jam ke 6', category: 'general' },
    { start: '11:35', end: '12:15', timeDisplay: '11.35 - 12.15', subject: 'Bahasa Inggris', teacher: 'Ernin Fitria, S.Pd.', period: 'Jam ke 7', category: 'general' },
    { start: '12:15', end: '12:45', timeDisplay: '12.15 - 12.45', subject: 'ISHOMA', teacher: null, period: null, category: 'break' },
    { start: '12:45', end: '13:30', timeDisplay: '12.45 - 13.30', subject: 'Bahasa Inggris (Lanjutan)', teacher: 'Ernin Fitria, S.Pd.', period: 'Jam ke 8', category: 'general' },
    { start: '13:30', end: '15:00', timeDisplay: '13.30 - 15.00', subject: 'KKA (Keterampilan Komputer & Aplikasi)', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 9-10', category: 'vocational' }
  ],
  3: [ // RABU
    { start: '06:30', end: '06:45', timeDisplay: '06.30 - 06.45', subject: "Tadarus Al-Qur'an / Pendalaman Iman", teacher: null, period: null, category: 'character' },
    { start: '06:45', end: '08:15', timeDisplay: '06.45 - 08.15', subject: 'Bahasa Jepang (日本語)', teacher: 'Maria Ulfah, S.S.', period: 'Jam ke 1-2', category: 'general' },
    { start: '08:15', end: '09:45', timeDisplay: '08.15 - 09.45', subject: 'Bahasa Inggris', teacher: 'Ernin Fitria, S.Pd.', period: 'Jam ke 3-4', category: 'general' },
    { start: '09:45', end: '10:15', timeDisplay: '09.45 - 10.15', subject: 'ISTIRAHAT 1', teacher: null, period: null, category: 'break' },
    { start: '10:15', end: '12:15', timeDisplay: '10.15 - 12.15', subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 5-7', category: 'vocational' },
    { start: '12:15', end: '12:45', timeDisplay: '12.15 - 12.45', subject: 'ISHOMA', teacher: null, period: null, category: 'break' },
    { start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00', subject: 'Bahasa Indonesia', teacher: 'Abimanyu Hadi Sukoro, M.Pd.', period: 'Jam ke 8-10', category: 'general' }
  ],
  4: [ // KAMIS
    { start: '06:30', end: '06:45', timeDisplay: '06.30 - 06.45', subject: "Tadarus Al-Qur'an / Pendalaman Iman", teacher: null, period: null, category: 'character' },
    { start: '06:45', end: '09:45', timeDisplay: '06.45 - 09.45', subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 1-4', category: 'vocational' },
    { start: '09:45', end: '10:15', timeDisplay: '09.45 - 10.15', subject: 'ISTIRAHAT 1', teacher: null, period: null, category: 'break' },
    { start: '10:15', end: '10:55', timeDisplay: '10.15 - 10.55', subject: 'Dasar Dasar Keahlian RPL (Lanjutan)', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 5', category: 'vocational' },
    { start: '10:55', end: '12:15', timeDisplay: '10.55 - 12.15', subject: 'Projek IPAS', teacher: 'Dini Purnama Sari, S.Pd.', period: 'Jam ke 6-7', category: 'general' },
    { start: '12:15', end: '12:45', timeDisplay: '12.15 - 12.45', subject: 'ISHOMA', teacher: null, period: null, category: 'break' },
    { start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00', subject: 'Projek IPAS (Lanjutan)', teacher: 'Dini Purnama Sari, S.Pd.', period: 'Jam ke 8-10', category: 'general' }
  ],
  5: [ // JUMAT
    { start: '06:30', end: '07:30', timeDisplay: '06.30 - 07.30', subject: 'Senam Pagi / Jalan Sehat', teacher: null, period: null, category: 'character' },
    { start: '07:30', end: '08:10', timeDisplay: '07.30 - 08.10', subject: 'Kokurikuler (Pembinaan Karakter)', teacher: 'Wali Kelas', period: 'Jam ke 1', category: 'character' },
    { start: '08:10', end: '09:30', timeDisplay: '08.10 - 09.30', subject: 'Dasar Dasar Keahlian RPL', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 2-3', category: 'vocational' },
    { start: '09:30', end: '10:00', timeDisplay: '09.30 - 10.00', subject: 'ISTIRAHAT', teacher: null, period: null, category: 'break' },
    { start: '10:00', end: '11:15', timeDisplay: '10.00 - 11.15', subject: 'Dasar Dasar Keahlian RPL (Lanjutan)', teacher: 'Syaiful Bachri, S.T.', period: 'Jam ke 4-5', category: 'vocational' },
    { start: '11:15', end: '11:50', timeDisplay: '11.15 - 11.50', subject: 'Matematika', teacher: 'Nurkholis Aiman, S.Pd.', period: 'Jam ke 6', category: 'general' },
    { start: '11:50', end: '12:45', timeDisplay: '11.50 - 12.45', subject: 'ISHOMA & Sholat Jumat', teacher: null, period: null, category: 'break' },
    { start: '12:45', end: '15:00', timeDisplay: '12.45 - 15.00', subject: 'Matematika (Lanjutan)', teacher: 'Nurkholis Aiman, S.Pd.', period: 'Jam ke 7-9', category: 'general' }
  ]
};

export interface PiketItem {
  name: string;
}

export const piketData: Record<number, string[]> = {
  1: [ // SENIN
    "Aditya Laksamana P.",
    "M. Hafidz Malik",
    "Ricky Rahan",
    "Arjun Wijaya",
    "Virzi Aziqri B.",
    "Cinta R. Arrasya",
    "Kirana Surya D."
  ],
  2: [ // SELASA
    "Risqi Noer Sanubari",
    "Ahmad Aqila Arham",
    "Muhamad Fadhlan Saugie",
    "Rafael Sugiharto",
    "Zidane Zulfikar",
    "Annas Tassyah A.",
    "Asyifa Nazzila F."
  ],
  3: [ // RABU
    "Dika Dwi Putra",
    "Fadhyl Alhafizd",
    "Imam Firmansyah",
    "Maulana Saputra",
    "Zahran Ibnu Ardiansyah",
    "Muhammad Rafid Wiscaya",
    "Azza Syahfina"
  ],
  4: [ // KAMIS
    "Aqila Raesha A.",
    "Bintang Very Purwanto",
    "Muhammad Husain Haekal",
    "Rakha Saputra",
    "Ahmad Fachrial Kibar",
    "Rama Alfarizi A.",
    "Maysharah Zulfhah"
  ],
  5: [ // JUMAT
    "Al Qoirul Lathif Nazzril Putra",
    "Ricky Dwi Aditiya",
    "Azzila Putra Afrian",
    "Muhammad Hafiz Fahrezi",
    "Muhammad Rizki Alfatah",
    "Rasya Aditya",
    "Dhiya Ulhaq R.J."
  ]
};

