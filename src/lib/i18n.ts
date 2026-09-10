// Multilingual (i18n) Engine for KelasRPL: ID (Indonesian), EN (English), JP (Japanese)

export type SupportedLang = "id" | "en" | "jp";

export const translations: Record<SupportedLang, Record<string, string>> = {
  id: {
    // Navbar
    "nav.about": "Tentang",
    "nav.students": "Siswa",
    "nav.vision": "Visi",
    "nav.schedule": "Jadwal Pelajaran",
    "nav.dashboard": "Dashboard",
    "nav.chatbot": "Chatbot AI",
    "nav.learning": "Materi",
    "nav.music": "Musik",
    "nav.studio": "Studio",
    "nav.menfess": "Menfess",
    "nav.memories": "Memori",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.menu": "Menu",
    "nav.theme_toggle": "Ganti Mode Gelap / Terang",

    // Home
    "home.badge": "Tahun Ajaran 2026/2027",
    "home.hero_title": "Kami adalah",
    "home.hero_subtitle":
      "Lebih dari sekadar kelas. Tempat kami belajar algoritma, membangun perangkat lunak, dan tumbuh bersama sebagai developer masa depan.",
    "home.btn_members": "Lihat Anggota",
    "home.btn_about": "Kenal Kelas Kami",
    "home.about_title": "Membangun Masa Depan, Satu Baris Kode.",
    "home.about_desc":
      "Kelas 10 RPL adalah tempat kami belajar logika, algoritma, dan kerja sama tim. Kami tidak hanya menggunakan teknologi, tetapi kami dilatih untuk menciptakannya. Mempersiapkan diri menjadi generasi developer dan software engineer yang inovatif.",
    "home.stat_population": "Populasi Kelas",
    "home.stat_students_unit": "Siswa",
    "home.stat_class": "Kelas",
    "home.stat_year": "Tahun",
    "home.stat_major": "Jurusan",
    "home.family_title": "Keluarga Kelas",
    "home.family_desc":
      "Dibimbing oleh wali kelas hebat, bersama 35 individu di 10 Rekayasa Perangkat Lunak.",
    "home.homeroom_teacher": "Wali Kelas",
    "home.teacher_desc":
      "Membimbing dan mengarahkan keluarga besar 10 RPL untuk terus berinovasi, berkolaborasi, dan mempersiapkan diri menjadi engineer perangkat lunak masa depan.",
    "home.memories_badge": "MEMORI KELAS",
    "home.memories_title": "Momen & Cerita Kebersamaan.",
    "home.memories_desc":
      "Kumpulan rekaman kebersamaan, tawa di kelas, dan cerita hangat keluarga besar 10 Rekayasa Perangkat Lunak.",
    "home.memories_hint": "Geser card ke kiri / kanan",
    "home.memories_zoom": "Perbesar Foto",
    "home.values_title": "Nilai yang Kami Pegang.",
    "home.values_desc":
      "Bukan hanya tentang menulis kode, tapi tentang bagaimana kami berpikir, bekerja, dan berkembang bersama.",
    "home.collab_title": "Collaboration",
    "home.collab_desc":
      "Berbagi ide, memecahkan bug bersama, dan saling membantu dalam setiap proyek.",
    "home.creat_title": "Creativity",
    "home.creat_desc":
      "Berani bereksperimen dengan desain dan kode untuk menciptakan solusi unik.",
    "home.tech_title": "Technology",
    "home.tech_desc":
      "Terus belajar dan beradaptasi dengan stack teknologi modern.",
    "home.growth_title": "Growth",
    "home.growth_desc":
      "Berproses dari baris pertama 'Hello World' hingga siap menjadi profesional.",
    "home.footer_desc":
      "Website resmi perkenalan kelas 10 Rekayasa Perangkat Lunak SMK Negeri 17 Jakarta.",
    "home.gender_l": "Laki-laki",
    "home.gender_p": "Perempuan",

    // Dashboard
    "dash.badge": "REALTIME JAKARTA (WIB)",
    "dash.welcome": "Selamat Datang",
    "dash.current_time": "Waktu Saat Ini",
    "dash.chatbot_title": "Chatbot AI",
    "dash.chatbot_desc": "Asisten belajar & coding",
    "dash.learning_title": "Materi Programming",
    "dash.learning_desc": "Modul & video latihan",
    "dash.music_title": "Music Player",
    "dash.music_desc": "Streaming & lirik lagu",
    "dash.today_status": "Status Kehadiran Hari Ini",
    "dash.already_present": "Anda Sudah Hadir",
    "dash.present_note": "Terima kasih sudah absen via mesin IoT hari ini.",
    "dash.recorded_at": "Tercatat",
    "dash.not_attended": "Belum Absen",
    "dash.tap_card": "Tempelkan kartu Anda ke mesin IoT di kelas.",
    "dash.or_submit": "Atau ajukan izin / sakit:",
    "dash.status": "Status",
    "dash.status_hadir": "Hadir",
    "dash.status_izin": "Izin",
    "dash.status_sakit": "Sakit",
    "dash.status_alpa": "Belum Absen",
    "dash.notes": "Keterangan (Wajib)",
    "dash.notes_placeholder": "Contoh: Sakit demam...",
    "dash.submit_btn": "Kirim Pengajuan",
    "dash.history_title": "Riwayat Bulan Ini",
    "dash.history_sub": "30 Catatan Terakhir",
    "dash.history_empty": "Belum ada riwayat absensi.",
    "dash.col_date": "Tanggal",
    "dash.col_name": "Nama Siswa",
    "dash.col_nis": "NIS",
    "dash.col_status": "Status",
    "dash.col_time": "Waktu Absen",
    "dash.col_notes": "Keterangan",
    "dash.recap_title": "Rekapitulasi Kehadiran Kelas (Hari Ini)",
    "dash.recap_sub": "Pemantauan kehadiran siswa secara langsung",
    "dash.stat_total": "Total Siswa",
    "dash.stat_hadir": "Hadir (IoT)",
    "dash.stat_izin_sakit": "Izin / Sakit",
    "dash.stat_alpa": "Belum Absen (Alpa)",

    // Schedule
    "sched.title": "Jadwal Pelajaran Kelas 10 RPL",
    "sched.subtitle": "Jadwal Kegiatan Belajar Mengajar & Guru Pengampu",
    "sched.badge": "KBM AKTIF",
    "sched.mode_lessons": "Jadwal Pelajaran",
    "sched.mode_activities": "Daftar Kegiatan",
    "sched.today_badge": "Hari Ini",
    "sched.day_mon": "Senin",
    "sched.day_tue": "Selasa",
    "sched.day_wed": "Rabu",
    "sched.day_thu": "Kamis",
    "sched.day_fri": "Jumat",
    "sched.status_active": "Sedang Berlangsung",
    "sched.status_upcoming": "Akan Datang",
    "sched.status_done": "Selesai",
    "sched.cat_vocational": "Kejuruan RPL",
    "sched.cat_general": "Mapel Umum",
    "sched.cat_break": "Istirahat / ISHOMA",
    "sched.cat_character": "Pembinaan Karakter",
    "sched.teacher": "Guru Pengampu",
    "sched.period": "Jam ke",
    "sched.weekend_notice":
      "Hari ini akhir pekan (tidak ada KBM). Menampilkan jadwal hari Senin.",
    "sched.all_finished":
      "Seluruh kegiatan belajar mengajar hari ini telah selesai.",

    // Chatbot
    "chat.new_chat": "New Chat",
    "chat.history": "Riwayat Chat",
    "chat.back_dashboard": "Kembali ke Dashboard",
    "chat.placeholder": "Ketik pesan Anda di sini...",
    "chat.welcome_title": "Halo! Ada yang bisa saya bantu hari ini?",
    "chat.welcome_sub":
      "Tanyakan materi RPL, algoritma, debugging coding, atau tugas sekolahmu.",

    // Music Player
    "music.studio_badge": "STUDIO MUSIK RPL",
    "music.stream_badge": "Hi-Fi Audio Stream",
    "music.title": "RPL Music Player",
    "music.desc":
      "Temani sesi coding dan belajarmu dengan lagu favorit berkualitas jernih tanpa jeda.",
    "music.search_placeholder":
      "Cari judul lagu, artis, band, atau soundtrack...",
    "music.search_btn": "Cari Lagu",
    "music.now_playing": "Sedang Diputar",
    "music.paused": "Dijeda",
    "music.queue": "Antrean Lagu",
    "music.related": "Rekomendasi Terkait",
    "music.lyrics": "Lirik Lagu",
    "music.lyrics_empty": "Lirik untuk lagu ini belum tersedia.",
    "music.lyrics_sync": "Sedang menyinkronkan lirik dengan audio...",
    "music.clear_search": "Hapus pencarian",

    // Learning Materials
    "learn.title": "Materi Programming",
    "learn.desc":
      "Pelajari materi programming terbaru untuk meningkatkan skill Anda.",
    "learn.empty_title": "Belum Ada Materi",
    "learn.empty_desc":
      "Materi programming akan segera diunggah oleh guru/admin.",
    "learn.open_btn": "Buka Materi",

    // Auth Login
    "auth.title": "Masuk ke Akun Anda",
    "auth.subtitle": "Gunakan NIS atau Nama Lengkap Anda.",
    "auth.identifier_label": "NIS atau Nama Lengkap",
    "auth.identifier_placeholder":
      "Contoh: 11687 atau ADITYA LAKSANA PRATAMA",
    "auth.password": "Password",
    "auth.remember": "Ingat saya",
    "auth.btn": "Masuk ke Dashboard",
    "auth.back_home": "Kembali ke",
    "auth.home_link": "halaman utama",
    "auth.forgot_tip_title": "Lupa Password?",
    "auth.forgot_tip_desc":
      "Hubungi Admin kelas untuk mereset password akun Anda kembali ke default (12345678).",

    // Password & Reset
    "nav.change_password": "Ganti Password",
    "pwd.modal_title": "Ganti Password",
    "pwd.modal_sub": "Perbarui kata sandi akun Anda",
    "pwd.current_label": "Password Saat Ini",
    "pwd.new_label": "Password Baru (Minimal 8 Karakter)",
    "pwd.confirm_label": "Ulangi Password Baru",
    "pwd.submit_btn": "Simpan Password",
    "common.cancel": "Batal",
    "dash.reset_default_btn": "Reset Default",
  },
  en: {
    // Navbar
    "nav.about": "About",
    "nav.students": "Students",
    "nav.vision": "Vision",
    "nav.schedule": "Schedule",
    "nav.dashboard": "Dashboard",
    "nav.chatbot": "AI Chatbot",
    "nav.learning": "Learning",
    "nav.music": "Music",
    "nav.studio": "Studio",
    "nav.menfess": "Menfess",
    "nav.memories": "Memories",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.menu": "Menu",
    "nav.theme_toggle": "Toggle Dark / Light Mode",

    // Home
    "home.badge": "Academic Year 2026/2027",
    "home.hero_title": "We are",
    "home.hero_subtitle":
      "More than just a class. Where we master algorithms, build software, and grow together as future developers.",
    "home.btn_members": "View Members",
    "home.btn_about": "About Our Class",
    "home.about_title": "Building the Future, One Line of Code.",
    "home.about_desc":
      "Class 10 RPL is where we master logic, algorithms, and teamwork. We don't just consume technology; we are trained to create it—preparing to become the next generation of innovative software engineers.",
    "home.stat_population": "Class Population",
    "home.stat_students_unit": "Students",
    "home.stat_class": "Class",
    "home.stat_year": "Year",
    "home.stat_major": "Major",
    "home.family_title": "Class Family",
    "home.family_desc":
      "Guided by our dedicated homeroom teacher, alongside 35 individuals in 10 Software Engineering.",
    "home.homeroom_teacher": "Homeroom Teacher",
    "home.teacher_desc":
      "Guiding and mentoring 10 RPL to innovate, collaborate, and excel as future software engineers.",
    "home.memories_badge": "CLASS MEMORIES",
    "home.memories_title": "Moments & Togetherness.",
    "home.memories_desc":
      "A collection of unforgettable moments, classroom laughter, and warm memories of Class 10 Software Engineering.",
    "home.memories_hint": "Swipe card left / right",
    "home.memories_zoom": "Enlarge Photo",
    "home.values_title": "Our Core Values.",
    "home.values_desc":
      "Not just about writing code, but how we think, collaborate, and evolve together.",
    "home.collab_title": "Collaboration",
    "home.collab_desc":
      "Sharing ideas, debugging together, and supporting each other in every project.",
    "home.creat_title": "Creativity",
    "home.creat_desc":
      "Daring to experiment with design and code to craft unique solutions.",
    "home.tech_title": "Technology",
    "home.tech_desc":
      "Continuously learning and adapting to modern technology stacks.",
    "home.growth_title": "Growth",
    "home.growth_desc":
      "Growing from our very first 'Hello World' to industry-ready professionals.",
    "home.footer_desc":
      "Official introduction website of Class 10 Software Engineering, SMK Negeri 17 Jakarta.",
    "home.gender_l": "Male",
    "home.gender_p": "Female",

    // Dashboard
    "dash.badge": "REALTIME JAKARTA (WIB)",
    "dash.welcome": "Welcome",
    "dash.current_time": "Current Time",
    "dash.chatbot_title": "AI Chatbot",
    "dash.chatbot_desc": "Study & coding assistant",
    "dash.learning_title": "Learning Materials",
    "dash.learning_desc": "Modules & practice videos",
    "dash.music_title": "Music Player",
    "dash.music_desc": "Streaming & song lyrics",
    "dash.today_status": "Today's Attendance Status",
    "dash.already_present": "You are Present",
    "dash.present_note":
      "Thank you for checking in via the IoT attendance terminal today.",
    "dash.recorded_at": "Recorded at",
    "dash.not_attended": "Not Checked In",
    "dash.tap_card": "Tap your card on the IoT attendance machine in class.",
    "dash.or_submit": "Or request leave / sick note:",
    "dash.status": "Status",
    "dash.status_hadir": "Present",
    "dash.status_izin": "Leave",
    "dash.status_sakit": "Sick Leave",
    "dash.status_alpa": "Absent",
    "dash.notes": "Notes (Required)",
    "dash.notes_placeholder": "Example: High fever...",
    "dash.submit_btn": "Submit Request",
    "dash.history_title": "This Month's History",
    "dash.history_sub": "Last 30 Records",
    "dash.history_empty": "No attendance records yet.",
    "dash.col_date": "Date",
    "dash.col_name": "Student Name",
    "dash.col_nis": "Student ID",
    "dash.col_status": "Status",
    "dash.col_time": "Time",
    "dash.col_notes": "Notes",
    "dash.recap_title": "Class Attendance Summary (Today)",
    "dash.recap_sub": "Live student attendance monitoring",
    "dash.stat_total": "Total Students",
    "dash.stat_hadir": "Present (IoT)",
    "dash.stat_izin_sakit": "Permit / Sick",
    "dash.stat_alpa": "Absent",

    // Schedule
    "sched.title": "Class 10 RPL Timetable",
    "sched.subtitle": "Teaching & Learning Schedule & Teachers",
    "sched.badge": "ACTIVE TIMETABLE",
    "sched.mode_lessons": "Class Timetable",
    "sched.mode_activities": "All Activities",
    "sched.today_badge": "Today",
    "sched.day_mon": "Monday",
    "sched.day_tue": "Tuesday",
    "sched.day_wed": "Wednesday",
    "sched.day_thu": "Thursday",
    "sched.day_fri": "Friday",
    "sched.status_active": "In Progress",
    "sched.status_upcoming": "Upcoming",
    "sched.status_done": "Finished",
    "sched.cat_vocational": "Vocational RPL",
    "sched.cat_general": "General Subject",
    "sched.cat_break": "Break / Lunch",
    "sched.cat_character": "Character & Faith",
    "sched.teacher": "Teacher",
    "sched.period": "Period",
    "sched.weekend_notice":
      "Weekend today (no school). Displaying Monday schedule.",
    "sched.all_finished": "All school sessions for today have concluded.",

    // Chatbot
    "chat.new_chat": "New Chat",
    "chat.history": "Chat History",
    "chat.back_dashboard": "Back to Dashboard",
    "chat.placeholder": "Type your message here...",
    "chat.welcome_title": "Hello! How can I help you today?",
    "chat.welcome_sub":
      "Ask about Software Engineering, algorithms, code debugging, or school assignments.",

    // Music Player
    "music.studio_badge": "RPL MUSIC STUDIO",
    "music.stream_badge": "Hi-Fi Audio Stream",
    "music.title": "RPL Music Player",
    "music.desc":
      "Accompany your coding and study sessions with seamless, high-quality audio.",
    "music.search_placeholder":
      "Search song title, artist, band, or soundtrack...",
    "music.search_btn": "Search",
    "music.now_playing": "Now Playing",
    "music.paused": "Paused",
    "music.queue": "Song Queue",
    "music.related": "Related Recommendations",
    "music.lyrics": "Lyrics",
    "music.lyrics_empty": "Lyrics for this song are not available yet.",
    "music.lyrics_sync": "Syncing lyrics with audio stream...",
    "music.clear_search": "Clear search",

    // Learning Materials
    "learn.title": "Learning Materials",
    "learn.desc":
      "Explore modern programming materials to sharpen your skills.",
    "learn.empty_title": "No Materials Yet",
    "learn.empty_desc":
      "Learning materials will be uploaded soon by teachers/admin.",
    "learn.open_btn": "Open Material",

    // Auth Login
    "auth.title": "Sign In to Your Account",
    "auth.subtitle": "Use your Student ID (NIS) or Full Name.",
    "auth.identifier_label": "Student ID or Full Name",
    "auth.identifier_placeholder":
      "Example: 11687 or ADITYA LAKSANA PRATAMA",
    "auth.password": "Password",
    "auth.remember": "Remember me",
    "auth.btn": "Sign In to Dashboard",
    "auth.back_home": "Back to",
    "auth.home_link": "home page",
    "auth.forgot_tip_title": "Forgot Password?",
    "auth.forgot_tip_desc":
      "Contact class Admin to reset your password back to default (12345678).",

    // Password & Reset
    "nav.change_password": "Change Password",
    "pwd.modal_title": "Change Password",
    "pwd.modal_sub": "Update your account password",
    "pwd.current_label": "Current Password",
    "pwd.new_label": "New Password (Min 8 Characters)",
    "pwd.confirm_label": "Confirm New Password",
    "pwd.submit_btn": "Save Password",
    "common.cancel": "Cancel",
    "dash.reset_default_btn": "Reset Default",
  },
  jp: {
    // Navbar
    "nav.about": "概要",
    "nav.students": "生徒一覧",
    "nav.vision": "ビジョン",
    "nav.schedule": "時間割",
    "nav.dashboard": "ダッシュボード",
    "nav.chatbot": "AIチャット",
    "nav.learning": "教材",
    "nav.music": "音楽",
    "nav.studio": "スタジオ",
    "nav.menfess": "Menfess",
    "nav.memories": "思い出",
    "nav.login": "ログイン",
    "nav.logout": "ログアウト",
    "nav.menu": "メニュー",
    "nav.theme_toggle": "ダーク/ライトモード切替",

    // Home
    "home.badge": "2026/2027年度",
    "home.hero_title": "私たちは",
    "home.hero_subtitle":
      "単なるクラスではありません。アルゴリズムを学び、ソフトウェアを開発し、未来のエンジニアとして共に成長する場所です。",
    "home.btn_members": "メンバーを見る",
    "home.btn_about": "クラスについて",
    "home.about_title": "コードの一行から、未来を創る。",
    "home.about_desc":
      "10 RPLは、論理的思考、アルゴリズム、チームワークを学ぶ場所です。技術を利用するだけでなく、自ら創造する力を身につけ、革新的なソフトウェアエンジニアを目指します。",
    "home.stat_population": "クラス人数",
    "home.stat_students_unit": "名",
    "home.stat_class": "学級",
    "home.stat_year": "年度",
    "home.stat_major": "専攻",
    "home.family_title": "クラスの仲間たち",
    "home.family_desc":
      "熱心な担任の先生と、10 ソフトウェア工学科の35名の仲間たち。",
    "home.homeroom_teacher": "担任教師",
    "home.teacher_desc":
      "10 RPLの生徒たちを導き、将来のソフトウェアエンジニアとして成長できるよう指導・支援しています。",
    "home.memories_badge": "クラスの思い出",
    "home.memories_title": "仲間たちとの瞬間とストーリー。",
    "home.memories_desc":
      "10 ソフトウェア工学科の仲間たちとの忘れられない瞬間、笑顔、そして温かい思い出の数々。",
    "home.memories_hint": "カードを左右にスワイプ",
    "home.memories_zoom": "写真を拡大",
    "home.values_title": "私たちの価値観",
    "home.values_desc":
      "単にコードを書くだけでなく、どう考え、協力し、共に成長するかを大切にしています。",
    "home.collab_title": "協調 (Collaboration)",
    "home.collab_desc":
      "アイデアを共有し、共にバグを解決し、支え合います。",
    "home.creat_title": "創造性 (Creativity)",
    "home.creat_desc":
      "デザインとコードで果敢に挑戦し、独自の解決策を生み出します。",
    "home.tech_title": "技術 (Technology)",
    "home.tech_desc":
      "最新の技術スタックを常に学び、適応し続けます。",
    "home.growth_title": "成長 (Growth)",
    "home.growth_desc":
      "「Hello World」の最初の一行から、プロフェッショナルへの歩み。",
    "home.footer_desc":
      "SMK Negeri 17 Jakarta 10 ソフトウェア工学科 公式ウェブサイト。",
    "home.gender_l": "男子",
    "home.gender_p": "女子",

    // Dashboard
    "dash.badge": "ジャカルタ現地時間 (WIB)",
    "dash.welcome": "ようこそ",
    "dash.current_time": "現在時刻",
    "dash.chatbot_title": "AIチャット",
    "dash.chatbot_desc": "学習・開発アシスタント",
    "dash.learning_title": "プログラミング教材",
    "dash.learning_desc": "学習モジュールと動画",
    "dash.music_title": "音楽プレーヤー",
    "dash.music_desc": "ストリーミングと歌詞表示",
    "dash.today_status": "本日の出席状況",
    "dash.already_present": "出席確認済み",
    "dash.present_note":
      "IoT端末による本日の出席打刻が完了しました。",
    "dash.recorded_at": "打刻時間",
    "dash.not_attended": "未出席",
    "dash.tap_card": "教室のIoT端末にカードをタッチしてください。",
    "dash.or_submit": "または公欠・病欠の届出:",
    "dash.status": "状態",
    "dash.status_hadir": "出席",
    "dash.status_izin": "公欠",
    "dash.status_sakit": "病欠",
    "dash.status_alpa": "未登録/欠席",
    "dash.notes": "事由 (必須)",
    "dash.notes_placeholder": "例: 高熱のため...",
    "dash.submit_btn": "申請を送信",
    "dash.history_title": "今月の出席履歴",
    "dash.history_sub": "直近30件の記録",
    "dash.history_empty": "出席履歴はまだありません。",
    "dash.col_date": "日付",
    "dash.col_name": "生徒氏名",
    "dash.col_nis": "学籍番号",
    "dash.col_status": "状況",
    "dash.col_time": "時間",
    "dash.col_notes": "事由",
    "dash.recap_title": "本日のクラス出席集計",
    "dash.recap_sub": "リアルタイム生徒出席モニタリング",
    "dash.stat_total": "生徒総数",
    "dash.stat_hadir": "出席 (IoT)",
    "dash.stat_izin_sakit": "公欠・病欠",
    "dash.stat_alpa": "未登録/欠席",

    // Schedule
    "sched.title": "10 RPL 授業時間割",
    "sched.subtitle": "学習活動スケジュール＆担当教員",
    "sched.badge": "授業日程",
    "sched.mode_lessons": "授業時間割",
    "sched.mode_activities": "全活動日程",
    "sched.today_badge": "今日",
    "sched.day_mon": "月曜日",
    "sched.day_tue": "火曜日",
    "sched.day_wed": "水曜日",
    "sched.day_thu": "木曜日",
    "sched.day_fri": "金曜日",
    "sched.status_active": "授業中",
    "sched.status_upcoming": "次の授業",
    "sched.status_done": "終了",
    "sched.cat_vocational": "専門教科(RPL)",
    "sched.cat_general": "一般教科",
    "sched.cat_break": "休憩 / 昼食",
    "sched.cat_character": "礼拝・道徳",
    "sched.teacher": "担当教員",
    "sched.period": "時限",
    "sched.weekend_notice":
      "本日は休校日（週末）です。月曜日の時間割を表示しています。",
    "sched.all_finished": "本日のすべての授業が終了しました。",

    // Chatbot
    "chat.new_chat": "新規チャット",
    "chat.history": "チャット履歴",
    "chat.back_dashboard": "ダッシュボードへ戻る",
    "chat.placeholder": "メッセージを入力してください...",
    "chat.welcome_title": "こんにちは！何かお手伝いできますか？",
    "chat.welcome_sub":
      "ソフトウェア工学、アルゴリズム、デバッグ、課題について何でも質問してください。",

    // Music Player
    "music.studio_badge": "RPL 音楽スタジオ",
    "music.stream_badge": "Hi-Fi オーディオ配信",
    "music.title": "RPL 音楽プレーヤー",
    "music.desc":
      "クリアな音質で、コーディングや勉強の時間を快適に彩ります。",
    "music.search_placeholder":
      "曲名、アーティスト名、サウンドトラックを検索...",
    "music.search_btn": "曲を検索",
    "music.now_playing": "再生中",
    "music.paused": "一時停止中",
    "music.queue": "再生リスト",
    "music.related": "おすすめの曲",
    "music.lyrics": "歌詞",
    "music.lyrics_empty": "この曲の歌詞はまだ登録されていません。",
    "music.lyrics_sync": "歌詞を音楽と同期中...",
    "music.clear_search": "検索をクリア",

    // Learning Materials
    "learn.title": "プログラミング教材",
    "learn.desc":
      "スキルアップのための最新プログラミング教材を学びましょう。",
    "learn.empty_title": "教材がまだありません",
    "learn.empty_desc":
      "教師または管理者により教材がまもなく公開されます。",
    "learn.open_btn": "教材を開く",

    // Auth Login
    "auth.title": "アカウントにログイン",
    "auth.subtitle": "学籍番号 (NIS) または氏名を入力してください。",
    "auth.identifier_label": "学籍番号 または 氏名",
    "auth.identifier_placeholder":
      "例: 11687 または ADITYA LAKSANA PRATAMA",
    "auth.password": "パスワード",
    "auth.remember": "ログイン状態を保持",
    "auth.btn": "ダッシュボードに入る",
    "auth.back_home": "戻る:",
    "auth.home_link": "トップページ",
    "auth.forgot_tip_title": "パスワードをお忘れですか？",
    "auth.forgot_tip_desc":
      "管理者に連絡して初期パスワード（12345678）にリセットしてもらってください。",

    // Password & Reset
    "nav.change_password": "パスワード変更",
    "pwd.modal_title": "パスワード変更",
    "pwd.modal_sub": "アカウントのパスワードを更新",
    "pwd.current_label": "現在のパスワード",
    "pwd.new_label": "新しいパスワード（8文字以上）",
    "pwd.confirm_label": "新しいパスワードの再入力",
    "pwd.submit_btn": "パスワードを保存",
    "common.cancel": "キャンセル",
    "dash.reset_default_btn": "初期化",
  },
};

export function getLanguage(): SupportedLang {
  if (typeof window === "undefined") return "id";
  const saved = localStorage.getItem("app_lang") as SupportedLang | null;
  if (saved && ["id", "en", "jp"].includes(saved)) {
    return saved;
  }
  // Try cookie
  const match = document.cookie.match(/app_lang=([a-z]+)/);
  if (match && ["id", "en", "jp"].includes(match[1])) {
    return match[1] as SupportedLang;
  }
  return "id";
}

export function t(key: string, lang?: SupportedLang): string {
  const activeLang = lang || getLanguage();
  const dict = translations[activeLang] || translations.id;
  return dict[key] || translations.id?.[key] || key;
}

export function setLanguage(lang: SupportedLang) {
  if (typeof window === "undefined") return;
  const supported: SupportedLang[] = ["id", "en", "jp"];
  if (!supported.includes(lang)) {
    lang = "id";
  }

  localStorage.setItem("app_lang", lang);
  document.cookie = `app_lang=${lang};path=/;max-age=31536000`;
  document.documentElement.setAttribute("lang", lang);

  window.dispatchEvent(
    new CustomEvent("language-changed", { detail: { lang } })
  );
}

// Bind globally on window for client interactivity
if (typeof window !== "undefined") {
  (window as unknown as { setLanguage: typeof setLanguage }).setLanguage =
    setLanguage;
  (window as unknown as { getLanguage: typeof getLanguage }).getLanguage =
    getLanguage;
  (window as unknown as { t: typeof t }).t = t;
}
