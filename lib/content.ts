/**
 * Editorial content for the Melodi Alam site.
 *
 * Article bodies are arrays of plain strings rather than raw HTML, so nothing
 * from the content layer can inject markup. They render through
 * <ArticleBody />, which turns each entry into a paragraph.
 *
 * The editorial desks and the demo-queue enums live in `lib/taxonomy.ts`,
 * because the Sanity schema needs them too and this file is far too heavy to
 * pull into that bundle. They are re-exported here so existing imports of
 * `@/lib/content` keep working unchanged.
 */

import type { ArticleCategory, DemoStatus, DemoSubmission } from "./taxonomy";

export type { ArticleCategory, DemoStatus, DemoSubmission };
export {
  ARTICLE_CATEGORIES,
  CATEGORY_LABELS,
  DEMO_APPROVED_STATUSES,
  DEMO_AUDIO_EXTENSIONS,
  DEMO_AUDIO_MAX_BYTES,
  DEMO_AUDIO_TYPES,
  DEMO_GENRES,
  DEMO_INITIAL_STATUS,
  DEMO_PROGRAMS,
  DEMO_STATUSES,
} from "./taxonomy";

export interface Article {
  slug: string;
  title: string;
  category: ArticleCategory;
  date: string;
  dateISO: string;
  excerpt: string;
  image: string;
  body: string[];
}

/** Words per minute the read-time rule assumes. */
const WORDS_PER_MINUTE = 200;

/**
 * `BR-004` — read time is deterministic, not estimated by hand:
 * `max(1, ceil(words / 200))`. Counting the title, excerpt and body together is
 * what a reader actually reads before the article ends.
 */
export function readingTimeMinutes(...parts: (string | string[])[]): number {
  const words = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function articleReadingTime(article: Article): number {
  return readingTimeMinutes(article.title, article.excerpt, article.body);
}

/**
 * Placeholder photography. Every frame in this set was shot at Samsara Bogor,
 * so the images read as one venue rather than as individual news art — swap a
 * slot for real artwork as it lands. Files live in public/photos and are copied
 * from the "FOTO PLACEHOLDER MELODI ALAM" folder by `npm run photos`.
 */
const PHOTO = {
  liveStage: "/photos/dsc09408.webp",
  neonSign: "/photos/dsc08913.webp",
  archHall: "/photos/dsc09072.webp",
  recordGrid: "/photos/dsc09052.webp",
  vinylShelf: "/photos/dsc08926.webp",
  woodSlat: "/photos/dsc08482.webp",
  stainedGlass: "/photos/dsc09006.webp",
  loungeGreen: "/photos/dsc08568.webp",
  communalTable: "/photos/dsc08409.webp",
  recordCrate: "/photos/dsc08930.webp",
  libraryWall: "/photos/dsc08220.webp",
  readingRoom: "/photos/dsc08575.webp",
  loungeTerracotta: "/photos/dsc08558.webp",
  coffeeBar: "/photos/dsc08401.webp",
  arch: "/photos/dsc09058.webp",
  mosaicFloor: "/photos/dsc08397.webp",
  redWindow: "/photos/dsc08253.webp",
  espresso: "/photos/dsc08494.webp",
  turntable: "/photos/dsc08237.webp",
  facade: "/photos/dsc08635.webp",
  counter: "/photos/dsc08420.webp",
  tableDetail: "/photos/dsc09421.webp",
  brickArch: "/photos/dsc09056.webp",
} as const;

export const ARTICLES: Article[] = [
  {
    slug: "dua-dekade-endah-n-rhesa",
    title:
      'Dua Dekade Endah N Rhesa: Merawat Konsistensi, Diplomasi Lagu, dan Kehangatan "Liburan Indie"',
    category: "Bicara Melodi",
    date: "10 Oktober 2026",
    dateISO: "2026-10-10",
    excerpt:
      "Satu album mungkin baru langkah awal, tapi melahirkan album-album selanjutnya adalah ujian stamina dan mental yang sesungguhnya di tengah patokan angka views.",
    image: PHOTO.liveStage,
    body: [
      "Bagi Endah N Rhesa, tantangan musisi era sekarang bukan cuma soal seberapa gampang mengunggah lagu ke platform digital, tetapi bagaimana mematangkan aransemen dan menjaga kesehatan mental dari patokan angka views.",
      "Di panggung Melodi Samsara Bogor, pasangan musisi kebanggaan Pamulang ini membawakan Baby It's You, When You Love Someone, serta Liburan Indie dengan momen bermain satu gitar berdua yang hangat.",
      "Dalam obrolan panjang Bicara Melodi Season 3, mereka membedah dinamika industri musik secara terbuka: mekanisme streaming, tekanan tur lintas kota, dan harga staying Relevant yang harus dibayar setiap tahun.",
      "Salah satu sudut pandang yang paling banyak dibicarakan penonton: konsistensi bukan soal sering mengunggah, tapi soal tahu kapan berhenti dan kapan menambah panjang.",
    ],
  },
  {
    slug: "melankolia-di-priok-baladagehel-dongker",
    title: "Melankolia di Priok: Gemuruh Musik Baladagehel dan Dongker Sebagai Alat Struggle",
    category: "Fakta Musik",
    date: "12 Oktober 2026",
    dateISO: "2026-10-12",
    excerpt:
      "Lewat pengumpulan lumbung pangan dan refleksi sejarah, gemuruh musik bertransformasi menjadi solidaritas warga.",
    image: PHOTO.neonSign,
    body: [
      "Melankolia di Priok menjadi saksi bagaimana gemuruh musik bertransformasi menjadi wadah perlawanan terhadap ketidakadilan.",
      "Lewat pengumpulan lumbung pangan dan refleksi sejarah kelam, Baladagehel memosisikan diri jauh dari sekadar komunitas musik yang regularly tampil di panggung besar.",
      "Ketika sebuah lagu menjadi seruan yang dipanggil bersama, ia sudah berfungsi sebagai aset politik, bukan sekadar entretenimento.",
      "Ketika seorang seniman membuat karya yang membawa resonansi politik secara langsung, ia mengirim sinyal ke yang lain bahwa jalur alternatif di luar kanal formal itu ada.",
    ],
  },
  {
    slug: "starrducc-okinawa-2027",
    title: "Dari Kota Hujan Bogor Menghentak Jepang: Langkah Internasional Starrducc di Okinawa 2027",
    category: "Fakta Musik",
    date: "10 Oktober 2026",
    dateISO: "2026-10-10",
    excerpt:
      "Unit indie-pop kota hujan resmi menembus Music Lane Festival Okinawa 2027 dan tur panggung Tokyo.",
    image: PHOTO.archHall,
    body: [
      "Langkah unit indie-pop Starrducc untuk menembus pasar internasional resmi terwujud lewat penampilan mereka di Music Lane Festival Okinawa 2027 mendatang.",
      "Awal kiprah di Tokyo bermula dari sebuah record shop kecil di Records and Books. Dari sana, impresi personal mulai menjangkau Asia Tenggara.",
      "Sekarang, hanya dalam dua tahun, mereka sudah terhubung ke jaringan musik Asia tanpa punya manajer, hanya tim yang bekerja keras dengan positioning yang disengaja.",
      "Starrducc membangun identitas lokal tanpa harus bersuara seperti band Chinatown: gitar yang berbau Bogor, drum era 90-an, dan lirik tentang tumbuh di kota yang tidak pernah tidur dengan tenang.",
    ],
  },
  {
    slug: "float-constant-changes-ep",
    title: 'Energi Ketangguhan di Masa Transisi: Bedah EP Terbaru Float "Constant Changes"',
    category: "Rekomendasi Melodi",
    date: "08 Oktober 2026",
    dateISO: "2026-10-08",
    excerpt:
      'Energi ketangguhan yang diterjemahkan secara apik melalui eksplorasi aransemen baru di EP "Constant Changes".',
    image: PHOTO.recordGrid,
    body: [
      "Memiliki ikatan sejarah yang erat sejak Festival Melodi Alam 2017 di Gunung Pancar, Float kembali hadir lewat EP Constant Changes.",
      "Di EP ini, Float membiarkan dirinya kehilangan gitar akustik yang menjadi tanda tangan mereka, dan memindahkan seluruh energi ke synth serta drum machine.",
      "Aransemen trek kedua paling menarik: gitar yang biasanya bicara di ruang kering sekarang duduk di belakang palet lush reverb, memberi ilusi ruang yang jauh lebih luas.",
      "Transisi ternyata bukan hilangnya akar, melainkan cara baru memamerkannya.",
    ],
  },
  {
    slug: "spill-pilihan-lagu-arctic-monkeys",
    title: "Spill Pilihan Lagu Arctic Monkeys: Dari yang Paling Underrated Sampai Mainstream",
    category: "Rekomendasi Melodi",
    date: "14 Oktober 2026",
    dateISO: "2026-10-14",
    excerpt:
      "Tim Melodi Alam membedah katalog Alex Turner dkk. Lagu mana yang menurut Sobat Melolam paling underrated dan overrated?",
    image: PHOTO.vinylShelf,
    body: [
      "Katalog diskografi Arctic Monkeys selalu memancing perdebatan seru. Mulai dari era garasi cepat, riff ikonik di AM, hingga eksplorasi lounge yang lebih intik di album terakhir.",
      "Tim Melodi Alam berkumpul untuk memilih trek mana yang paling layak menyandang predikat hidden gem, dan mana yang sudah terlalu sering diputar.",
      "Pertanyaan paling sering muncul: apakah album terakhir masih setara dengan karya post-disco yang biasanya dianggap legenda, atau ini Another album bagus yang terasa seperti chip tuning.",
      "Jawabannya berubah tergantung siapa yang bertanya, dan itulah bagian paling menariknya.",
    ],
  },
  {
    slug: "ami-awards-2026-pendatang-baru",
    title: "Dari Skena Hipdut Sampai Rock dan Ska: Dominasi Pendatang Baru di AMI Awards 2026",
    category: "Fakta Musik",
    date: "11 Oktober 2026",
    dateISO: "2026-10-11",
    excerpt:
      "Deretan nama seperti Sukses Lancar Rejeki hingga Nona membuktikan kualitas karya musisi muda Indonesia makin tak terbendung.",
    image: PHOTO.woodSlat,
    body: [
      "Dari skena hipdut, grup vokal, sampai eksplorasi rock dan ska, deretan nama pendatang baru tahun ini membuktikan bahwa kualitas karya musisi muda Indonesia tidak perlu diragukan.",
      "Keberagaman warna sonik ini menunjukkan ekosistem musik independen dan arus utama di Indonesia semakin cair dan saling menginspirasi.",
      "Yang menarik adalah absennya dominasi satu genre tunggal. Artis yang biasanya saling bersaing, kali ini justru berbagi panggung.",
      "Memadukan genre sejak dulu terlihat berisiko dari sudut pandang komersial. Tapi kalau label indie cukup berani dan label besar cukup hadir, perpaduan baru akan benar-benar terjadi.",
    ],
  },
  {
    slug: "wsatcc-kisah-dari-selatan-jakarta",
    title: 'Murni, Estetik, dan Penuh Rasa: Kekuatan Vokal Sari WSATCC di "Kisah Dari Selatan Jakarta"',
    category: "Rekomendasi Melodi",
    date: "07 Oktober 2026",
    dateISO: "2026-10-07",
    excerpt:
      "White Shoes and The Couples Company tak pernah gagal menghipnotis pendengar lewat warna vokal yang jernih dan retro.",
    image: PHOTO.stainedGlass,
    body: [
      "Karakter vokal Sari yang jernih, bernuansa retro, dan bercerita dengan jujur menjadikan lagu seperti Kisah Dari Selatan Jakarta abadi melintasi generasi.",
      "Ada sesuatu yang familier tapi hampir tak pernah terdengar dua kali dengan aransemen yang sama.",
      "Rekaman WSATCC mana pun tidak pernah terasa seperti konser: hangat, lounge, dan sedikit berantakan. Persis seperti feel makan siang di rumah teman yang punya koleksi vinyl besar.",
    ],
  },
  {
    slug: "hanin-dhiya-cinta-ini-membunuhku",
    title: 'Sentuhan Baru Hanin Dhiya untuk "Cinta Ini Membunuhku": Merawat Kenangan Patah Hati',
    category: "Bicara Melodi",
    date: "05 Oktober 2026",
    dateISO: "2026-10-05",
    excerpt:
      "Membuka kembali cerita lama lewat warna vokal yang lebih lembut dan sendu di panggung Melodi Samsara.",
    image: PHOTO.loungeGreen,
    body: [
      "Lewat sesi live di Melodi Samsara dan obrolan hangat di Bicara Melodi, Hanin Dhiya membagikan perjalanannya dari menyikapi patah hati, mengambil closure, sampai mensyukuri lagu-lagu cover yang membesarkan namanya.",
      "Menyanyikan ulang Cinta Ini Membunuhku menjadi perpindahan tersendiri: dari menyanyikan dengan melawan, menjadi menyanyikan karena sudah berdamai.",
      "Di Bicara Melodi dia mengobrol soal conscious parasocial di era 2000an, kenapa memilih karier solo di luar band, dan bagaimana melatih dirinya untuk tidak menangis saat soundcheck.",
    ],
  },
  {
    slug: "sheila-on-7-single-baru",
    title: "Bukan Cuma Nostalgia: Momen Ribuan Penonton Bersorak Saat Single Baru Sheila On 7 Berkumandang",
    category: "Liputan Panggung",
    date: "02 Oktober 2026",
    dateISO: "2026-10-02",
    excerpt:
      "Bukti bahwa band asal Yogyakarta ini masih relevan dan mampu menciptakan anthem baru yang langsung bikin candu.",
    image: PHOTO.communalTable,
    body: [
      "Sheila On 7 kembali membuktikan statusnya sebagai band lintas generasi di hadapan ribuan penonton festival.",
      "Mereka tidak hanya mengandalkan repertoar klasik, melainkan memukau audiens lewat materi segar untuk set festival 40 menit yang bergantian antara bernyanyi dan berdecak.",
      "Setelah part terakhir dan confetti yang membutakan panggung, satu hal menjadi jelas: nostalgia yang dibangun dengan lagu baru adalah yang paling bertahan.",
    ],
  },
  {
    slug: "morfem-rayakan-pemenang-ost-timnas",
    title: 'Penantian Panjang Berbuah Manis: "Rayakan Pemenang" Morfem Jadi OST Dokumenter Timnas',
    category: "Fakta Musik",
    date: "29 September 2026",
    dateISO: "2026-09-29",
    excerpt:
      "Energi distorsif Jimi Multhazam dkk resmi mengiringi selebrasi kebanggaan sepak bola Indonesia.",
    image: PHOTO.recordCrate,
    body: [
      "Lagu Rayakan Pemenang milik Morfem telah lama menjadi anthem tak resmi di berbagai perayaan anak muda.",
      "Kini nomor penuh energi tersebut resmi menjadi soundtrack dokumenter perjalanan Timnas Indonesia.",
      "Bagi Morfem, lagu ini bukan tentang satu paragraf tunggal, melainkan tentang merayakan apa yang tidak pasti datang. Ahmed dan J Forman menyebut itu resep yang memang dibutuhkan sejak awal.",
    ],
  },
  {
    slug: "metafora-nama-hewan-dalam-lagu",
    title:
      "Dari Tulus, Iwan Fals, hingga DeadSquad: Mengapa Elemen Nama Hewan Bikin Lagu Makin Berkarakter?",
    category: "Fakta Musik",
    date: "25 September 2026",
    dateISO: "2026-09-25",
    excerpt:
      "Mulai dari kritik sosial, sindiran politik, sampai pesan moral mendalam yang dibungkus lewat metafora fauna.",
    image: PHOTO.libraryWall,
    body: [
      "Metafora nama hewan dalam penulisan lirik lagu di Indonesia memiliki tradisi panjang.",
      "Dari Gajah milik Tulus yang reflektif hingga kritik tajam ala Iwan Fals, penggunaan simbol fauna memberikan daya ingat visual yang kuat.",
      "Nama hewan adalah alat yang berguna untuk penulis yang ingin berkata sesuatu tentang dunia tanpa harus berubah menjadi ceramah panjang.",
    ],
  },
  {
    slug: "a7x-dear-god-jakarta",
    title: 'Mesin Waktu Anak Warnet 2000-an: Ketika "Dear God" Avenged Sevenfold Menggema di Jakarta',
    category: "Liputan Panggung",
    date: "20 September 2026",
    dateISO: "2026-09-20",
    excerpt:
      "Refleks teringat zaman paket malam dan billing lumba-lumba saat M. Shadows dkk menyapa ribuan admirer.",
    image: PHOTO.readingRoom,
    body: [
      "Bagi generasi yang tumbuh bersama warnet era 2000-an di Indonesia, Dear God dari Avenged Sevenfold bukan sekadar lagu rock balada.",
      "Intro gitar yang terasa sangat sendiri bergema dengan ketukan jari di keyboard billing lumba-lumba yang meletop di kamar kos Cikini.",
      "Yang terlihat di panggung festival terakhir bukan generasi baru yang mencari kedalaman, tapi generasi yang mengingat masa remajanya di warnet.",
    ],
  },
];

/* -------------------------------------------------------------------------
   Bicara Melodi / live-session index — the three typographic rows that
   anchored the original section, lifted to their own route.
------------------------------------------------------------------------- */

export interface InterviewRow {
  slug: string;
  artist: string;
  headline: string;
  videoId: string;
  caption: string;
}

/**
 * The Bicara Melodi short list — established artists only, which is an editorial
 * judgement the catalogue cannot supply: of its 118 interview videos, only six
 * carry a `featuring` credit, so nothing can be filtered automatically.
 *
 * The card artwork is the episode's YouTube thumbnail, derived from `videoId`,
 * which is why there is no image field here.
 */
export const INTERVIEW_ROWS: InterviewRow[] = [
  {
    slug: "endah-n-rhesa",
    artist: "Endah N Rhesa",
    headline: "DARI BAND ROCK SAMPAI JADI ICON PAMULANG",
    videoId: "WN-Go-1hA68",
    caption: "bicara melodi ep.30",
  },
  {
    slug: "bilal-indrajaya",
    artist: "Bilal Indrajaya",
    headline: "MENJIWAI PUISI, BRITPOP DAN MENYELAMI THE BEATLES",
    videoId: "_uqU8Q4Vwl8",
    caption: "profile and talk",
  },
  {
    slug: "sore-ze-band",
    artist: "Sore Ze Band",
    headline: "MENJAGA LEGACY ADE PALOH, FORMASI BARU DAN PALOH POP",
    videoId: "j5DjXbSSLoU",
    caption: "legacy notes",
  },
  {
    slug: "armada",
    artist: "Armada",
    headline: "ISU PLAGIAT, TULANG PUNGGUNG KELUARGA & MENGAGUMI HINDIA",
    videoId: "VOg_B_0yigw",
    caption: "bicara melodi",
  },
  {
    slug: "dmasiv",
    artist: "D'Masiv",
    headline: "PERJALANAN DARI CILEDUG KE EROPA & AGREGATOR BARU",
    videoId: "OYeOf-jqLC0",
    caption: "bicara melodi",
  },
  {
    slug: "dul-jaelani",
    artist: "Dul Jaelani",
    headline: "PENGARUH KURT COBAIN, AHMAD DHANI & DEWA 19",
    videoId: "U0RUMakt_GM",
    caption: "bicara melodi",
  },
  {
    slug: "teddy-adhitya",
    artist: "Teddy Adhitya",
    headline: "TRAUMA MASA KECIL & LAGU UNTUK GLENN FREDLY",
    videoId: "Tj90MOZ4QWA",
    caption: "bicara melodi",
  },
  {
    slug: "the-lantis",
    artist: "The Lantis",
    headline: "DARI LAMPU MERAH KE BUNGA MAAF",
    videoId: "j7jx5cqgULw",
    caption: "bicara melodi",
  },
  {
    slug: "nadhif-basalamah",
    artist: "Nadhif Basalamah",
    headline: "AKAN NGELAKUIN APAPUN UNTUK MUSIK",
    videoId: "iqfqKFS2sQc",
    caption: "bicara melodi ep.15",
  },
];

/* -------------------------------------------------------------------------
   Pahlawan Musik Kota — genre directory rows.

   The live copy of this directory lives in Sanity (`pahlawanRow`, read through
   `lib/pahlawan.ts`); these three rows are the offline fallback, under the same
   rule as the articles above — the CMS wins when it is reachable, this file
   fills in when it is not.

   The rows used to carry a `videoId` or `articleSlug` for the READ/WATCH
   action group; that group was removed on request, so the target fields went
   with it.
------------------------------------------------------------------------- */

export interface GenreRow {
  slug: string;
  title: string;
  artists: string;
  description: string;
  image: string;
  tags: string[];
}

export const GENRE_ROWS: GenreRow[] = [
  {
    slug: "bogor-pamulang-indie-folk",
    title: "Bogor dan Pamulang — Indie Folk / Chamber Pop",
    artists: "Endah N Rhesa • Starrducc • Topi Jerami • Aku Jeje",
    description:
      "Dari kehangatan akustik dua dekade di Pamulang hingga band dream-pop kota hujan Bogor yang siap menembus panggung Music Lane Festival Okinawa.",
    image: PHOTO.mosaicFloor,
    tags: ["indie pop", "folk", "dream pop"],
  },
  {
    slug: "bandung-jakarta-melankolia-radikal",
    title: "Bandung dan Jakarta — Surf Rock / Melankolia Radikal",
    artists: "The Joos • Dongker • Morfem • The Jansen",
    description:
      "Racikan surf rock penuh adrenalin untuk ritual crowd surf hingga punk alternatif yang mengubah gemuruh panggung menjadi solidaritas lumbung pangan.",
    image: PHOTO.redWindow,
    tags: ["surf rock", "punk", "alternative"],
  },
  {
    slug: "lintas-skena-ska-britpop",
    title: "Lintas Skena — Ska, Britpop dan Pendatang Baru AMI",
    artists: "Skastra • Portura • Lafa Pratomo • Biru Baru • Rrag",
    description:
      "Deretan nama yang meramu musik untuk menemani rasa ingin kabur, merenung, hingga menerabas rintangan hidup sehari-hari.",
    image: PHOTO.espresso,
    tags: ["ska", "britpop", "r&b"],
  },
];

/* -------------------------------------------------------------------------
   Spaces and Instruments — the showcase section and its /spaces route are
   gone; this data is the only copy left, kept deliberately until the removal
   is confirmed permanent.
------------------------------------------------------------------------- */

export interface SpaceItem {
  slug: string;
  label: string;
  title: string;
  price: string | null;
  href: string | null;
  image: string;
  /** Card tone — tall bordered-paper vs square dark, matching the source grid. */
  ratio: "tall" | "square";
  dark: boolean;
}

export const SPACE_ITEMS: SpaceItem[] = [
  {
    slug: "svvara-v100-turntable",
    label: "Instruments • Hardware",
    title: "SVVARA V100 Turntable — Dual Speaker Vinyl System",
    price: "IDR 2.499.000",
    href: null,
    image:
      PHOTO.turntable,
    ratio: "tall",
    dark: false,
  },
  {
    slug: "samsara-bogor",
    label: "Listening Space • Bogor",
    title: "Samsara Bogor: Simfoni Rasa Kolonial dan Pustaka Vinyl",
    price: null,
    href: "https://www.instagram.com/samsara.bogor/",
    image:
      PHOTO.facade,
    ratio: "square",
    dark: true,
  },
  {
    slug: "ecosystem-of-melody-tee",
    label: "Merchandise",
    title: 'Melodi Alam "Ecosystem of Melody" Heavyweight Tee',
    price: "IDR 225.000",
    href: null,
    image:
      PHOTO.counter,
    ratio: "square",
    dark: false,
  },
  {
    slug: "svarga-acasa-samsara",
    label: "Hospitality • West Java",
    title: "Svarga and Acasa Samsara: Sanctuary in the Hills",
    price: null,
    href: "https://www.instagram.com/samsara.bogor/",
    image:
      PHOTO.tableDetail,
    ratio: "square",
    dark: true,
  },
  {
    slug: "samsara-record-crate",
    label: "Curated Vinyl",
    title: "Samsara Record Crate — Indonesian Indie and City Pop",
    price: "IDR 450.000",
    href: null,
    image:
      PHOTO.brickArch,
    ratio: "tall",
    dark: false,
  },
];

/* -------------------------------------------------------------------------
   Live ticker items.
------------------------------------------------------------------------- */

export const TICKER_ITEMS: { label: string; href: string | null }[] = [
  {
    label: "SESI PANGGUNG BARU TIAP PEKAN — MELODI SAMSARA, BOGOR",
    href: "/videos",
  },
  {
    label: "BICARA MELODI: OBROLAN PANJANG BERSAMA MUSISI INDONESIA",
    href: "/bicara-melodi",
  },
  {
    label: "STORIES — ESAI, LIPUTAN, DAN CATATAN SKENA",
    href: "/journal",
  },
  {
    label: "OPEN SUBMISSION: KIRIM KARYA BAND KAMU UNTUK DIKURASI",
    href: "/submit",
  },
];

/* -------------------------------------------------------------------------
   Demo submission queue.
------------------------------------------------------------------------- */

/* Demo-queue enums and the `DemoSubmission` shape now live in `lib/taxonomy.ts`
   and are re-exported at the top of this file. `SEED_DEMOS` below is the
   in-memory fallback used when no CMS is configured. */

export const SEED_DEMOS: DemoSubmission[] = [
  {
    id: "seed-shroomeater",
    artist: "Shroomeater",
    city: "Bogor",
    title: "Echoes in the Pine Forest",
    genre: "Alternative Rock / Shoegaze",
    program: "Live at Melodi Samsara",
    link: "https://www.instagram.com/melodi.alam/",
    story:
      "Direkam secara live di studio kecil kawasan Baranangsiang, terinspirasi kabut sore Kota Bogor.",
    status: "SHORTLISTED (SAMSARA)",
    submittedAt: "2026-10-12",
  },
  {
    id: "seed-skyline",
    artist: "Skyline",
    city: "Bandung",
    title: "Senja di Jalan Braga (Acoustic Demo)",
    genre: "Indie Pop / Folk",
    program: "Review Artikel dan Rekomendasi IG",
    link: "https://www.instagram.com/melodi.alam/",
    story:
      "Single kedua dari EP mendatang kami yang menceritakan pertemuan singkat di sudut kota.",
    status: "APPROVED (ARTICLE)",
    submittedAt: "2026-10-10",
  },
  {
    id: "seed-pelabuhan-senja",
    artist: "Pelabuhan Senja",
    city: "Yogyakarta",
    title: "Bersepeda Menuju Selatan",
    genre: "Indie Pop / Folk",
    program: "Tamu Podcast Bicara Melodi",
    link: "https://www.instagram.com/melodi.alam/",
    story:
      "Perpaduan gitar akustik hangat dan terompet kamar tidur untuk menemani perjalanan pulang.",
    status: "IN REVIEW",
    submittedAt: "2026-10-08",
  },
];