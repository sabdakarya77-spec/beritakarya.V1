/** Master category template (aligned with apps/web/lib/constants.ts CATEGORIES_CONFIG). */
export const GLOBAL_CATEGORIES_SEED = [
  {
    name: 'Nasional',
    slug: 'nasional',
    subCategories: [
      { name: 'Politik', slug: 'politik' },
      { name: 'Hukum & Keadilan', slug: 'hukum-keadilan' },
      { name: 'Pendidikan', slug: 'pendidikan' },
      { name: 'Peristiwa', slug: 'peristiwa' }
    ]
  },
  {
    name: 'Daerah',
    slug: 'daerah',
    subCategories: [
      { name: 'DKI Jakarta & Banten', slug: 'dki-jakarta-banten' },
      { name: 'Jawa Barat & Tengah', slug: 'jawa-barat-tengah' },
      { name: 'Jawa Timur & Bali', slug: 'jawa-timur-bali' },
      { name: 'Sumatera & Kalimantan', slug: 'sumatera-kalimantan' },
      { name: 'Sulawesi & Papua', slug: 'sulawesi-papua' },
      { name: 'Kabar Desa', slug: 'kabar-desa' }
    ]
  },
  {
    name: 'Ekonomi',
    slug: 'ekonomi',
    subCategories: [
      { name: 'Makro & Keuangan', slug: 'makro-keuangan' },
      { name: 'Bisnis & Saham', slug: 'bisnis-saham' },
      { name: 'UMKM', slug: 'umkm' },
      { name: 'Industrial', slug: 'industrial' }
    ]
  },
  {
    name: 'Olahraga',
    slug: 'olahraga',
    subCategories: [
      { name: 'Piala Dunia', slug: 'piala-dunia' },
      { name: 'Timnas Garuda', slug: 'timnas-garuda' },
      { name: 'Sepak Bola', slug: 'sepak-bola' },
      { name: 'Ragam Olahraga', slug: 'ragam-olahraga' }
    ]
  },
  {
    name: 'Teknologi',
    slug: 'teknologi',
    subCategories: [
      { name: 'Gadget & Review', slug: 'gadget-review' },
      { name: 'AI & Inovasi', slug: 'ai-inovasi' },
      { name: 'Startups & Digital', slug: 'startups-digital' },
      { name: 'Game & Esports', slug: 'game-esports' }
    ]
  },
  {
    name: 'Opini',
    slug: 'opini',
    subCategories: [
      { name: 'Kolom & Esai', slug: 'kolom-esai' },
      { name: 'Tajuk Rencana', slug: 'tajuk-rencana' },
      { name: 'Wawancara', slug: 'wawancara' }
    ]
  },
  {
    name: 'Investigasi',
    slug: 'investigasi',
    subCategories: [
      { name: 'Laporan Investigasi', slug: 'laporan-investigasi' },
      { name: 'Sorotan Khusus', slug: 'sorotan-khusus' }
    ]
  },
  {
    name: 'Gaya Hidup',
    slug: 'gaya-hidup',
    subCategories: [
      { name: 'Wisata & Kuliner', slug: 'wisata-kuliner' },
      { name: 'Kesehatan & Wellness', slug: 'kesehatan-wellness' },
      { name: 'Seni, Film & Fesyen', slug: 'seni-film-fesyen' },
      { name: 'Otomotif', slug: 'otomotif' }
    ]
  },
  {
    name: 'Advertorial',
    slug: 'advertorial',
    subCategories: [
      { name: 'Info Bisnis', slug: 'info-bisnis' },
      { name: 'Rilis Pers', slug: 'rilis-pers' }
    ]
  },
  {
    name: 'Video',
    slug: 'video',
    subCategories: [
      { name: 'Dokumenter & Reportase', slug: 'dokumenter-reportase' },
      { name: 'Foto Jurnalistik', slug: 'foto-jurnalistik' },
      { name: 'Podcast & Audio', slug: 'podcast-audio' }
    ]
  }
] as const
