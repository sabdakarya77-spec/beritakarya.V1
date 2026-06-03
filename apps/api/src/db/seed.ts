import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Seed Site 'pusat'
  const site = await prisma.site.upsert({
    where: { id: 'pusat' },
    update: {
      trendingTopics: ['Nasional', 'Politik', 'Ekonomi', 'Teknologi', 'Daerah', 'Hukum']
    },
    create: {
      id: 'pusat',
      name: 'BeritaKarya Pusat',
      domain: 'beritakarya.co',
      description: 'Portal berita independen menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.',
      footerText: '© 2026 BERITA KARYA. ALL RIGHTS RESERVED.',
      trendingTopics: ['Nasional', 'Politik', 'Ekonomi', 'Teknologi', 'Daerah', 'Hukum']
    }
  })

  console.log('Site pusat upserted.')

  // 2. Seed Superadmin User
  const hash = await bcrypt.hash('6669PusatKarya', 10)
  const superadmin = await prisma.user.upsert({
    where: { email: 'sabdakarya77@gmail.com' },
    update: {
      passwordHash: hash
    },
    create: {
      email: 'sabdakarya77@gmail.com',
      name: 'Superadmin Sabdakarya',
      role: 'superadmin',
      siteId: null,
      passwordHash: hash,
      isVerified: true
    }
  })

  console.log('Superadmin user upserted:', superadmin.name)

  // 3. Seed Categories (Parents & Children)
  const parentsData = [
    { name: 'Nasional', slug: 'nasional', order: 1, color: 'rose', description: 'Kabar terkini dan kebijakan penting di tingkat nasional.' },
    { name: 'Daerah', slug: 'daerah', order: 2, color: 'amber', description: 'Informasi lokal dari pelosok nusantara.' },
    { name: 'Ekonomi', slug: 'ekonomi', order: 3, color: 'emerald', description: 'Analisis pasar, kebijakan finansial, dan bisnis makro.' },
    { name: 'Olahraga', slug: 'olahraga', order: 4, color: 'orange', description: 'Berita seputar kompetisi olahraga nasional dan internasional, Piala Dunia, serta Timnas Garuda.' },
    { name: 'Teknologi', slug: 'teknologi', order: 5, color: 'blue', description: 'Perkembangan AI, gadget terbaru, dan riset ilmiah.' },
    { name: 'Opini', slug: 'opini', order: 6, color: 'indigo', description: 'Kolom analisis, tajuk rencana, dan opini mendalam.' },
    { name: 'Investigasi', slug: 'investigasi', order: 7, color: 'red', description: 'Laporan investigasi eksklusif dan mendalam.' },
    { name: 'Gaya Hidup', slug: 'lifestyle', order: 8, color: 'teal', description: 'Ragam informasi wisata, kesehatan, seni budaya, dan otomotif.' },
    { name: 'Advertorial', slug: 'advertorial', order: 9, color: 'yellow', description: 'Rilis pers resmi dan info bisnis kemitraan.' },
    { name: 'Video', slug: 'video', order: 10, color: 'sky', description: 'Dokumenter eksklusif, galeri foto jurnalistik, dan rekaman podcast.' }
  ]

  const categoriesMap: Record<string, string> = {}

  for (const parent of parentsData) {
    const createdCat = await prisma.category.upsert({
      where: { id: parent.slug },
      update: {
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        order: parent.order,
        color: parent.color,
        parentId: null
      },
      create: {
        id: parent.slug,
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        order: parent.order,
        color: parent.color,
        isGlobal: true
      }
    })
    categoriesMap[parent.slug] = createdCat.id
  }

  // Seed Sub-categories
  const subCategoriesData = [
    // Nasional
    { name: 'Politik', slug: 'politik', parentSlug: 'nasional', order: 1, color: 'violet', description: 'Dinamika politik tanah air, legislatif, dan eksekutif.' },
    { name: 'Hukum & Keadilan', slug: 'hukum-keadilan', parentSlug: 'nasional', order: 2, color: 'slate', description: 'Kasus peradilan, investigasi kriminal, dan penegakan hukum.' },
    { name: 'Pendidikan', slug: 'pendidikan', parentSlug: 'nasional', order: 3, color: 'emerald', description: 'Kabar pendidikan, riset, dan akademisi.' },
    { name: 'Peristiwa', slug: 'peristiwa', parentSlug: 'nasional', order: 4, color: 'rose', description: 'Kejadian penting dan berita hangat hari ini.' },
    // Daerah
    { name: 'DKI Jakarta & Banten', slug: 'dki-jakarta-banten', parentSlug: 'daerah', order: 1, color: 'blue', description: 'Kabar ibu kota dan wilayah Banten.' },
    { name: 'Jawa Barat & Tengah', slug: 'jawa-barat-tengah', parentSlug: 'daerah', order: 2, color: 'teal', description: 'Informasi seputar Jawa Barat dan Jawa Tengah.' },
    { name: 'Jawa Timur & Bali', slug: 'jawa-timur-bali', parentSlug: 'daerah', order: 3, color: 'amber', description: 'Berita Jawa Timur dan Pulau Dewata.' },
    { name: 'Sumatera & Kalimantan', slug: 'sumatera-kalimantan', parentSlug: 'daerah', order: 4, color: 'orange', description: 'Berita dari wilayah Sumatera dan Kalimantan.' },
    { name: 'Sulawesi & Papua', slug: 'sulawesi-papua', parentSlug: 'daerah', order: 5, color: 'indigo', description: 'Informasi dari Sulawesi, Maluku, dan Papua.' },
    { name: 'Kabar Desa', slug: 'kabar-desa', parentSlug: 'daerah', order: 6, color: 'emerald', description: 'Rangkuman aktivitas dan dinamika pedesaan.' },
    // Ekonomi
    { name: 'Makro & Keuangan', slug: 'makro-keuangan', parentSlug: 'ekonomi', order: 1, color: 'emerald', description: 'Ekonomi makro, perbankan, dan kebijakan keuangan.' },
    { name: 'Bisnis & Saham', slug: 'bisnis-saham', parentSlug: 'ekonomi', order: 2, color: 'violet', description: 'Dinamika pasar saham, investasi, dan korporasi.' },
    { name: 'UMKM', slug: 'umkm', parentSlug: 'ekonomi', order: 3, color: 'amber', description: 'Perkembangan usaha mikro, kecil, dan menengah.' },
    { name: 'Industrial', slug: 'industrial', parentSlug: 'ekonomi', order: 4, color: 'blue', description: 'Sektor manufaktur, komoditas, dan industri.' },
    // Olahraga
    { name: 'Piala Dunia', slug: 'piala-dunia', parentSlug: 'olahraga', order: 1, color: 'amber', description: 'Liputan khusus turnamen akbar sepak bola sejagat.' },
    { name: 'Timnas Garuda', slug: 'timnas-garuda', parentSlug: 'olahraga', order: 2, color: 'red', description: 'Perjuangan punggawa Tim Nasional Indonesia.' },
    { name: 'Sepak Bola', slug: 'sepak-bola', parentSlug: 'olahraga', order: 3, color: 'blue', description: 'Kompetisi liga domestik dan internasional.' },
    { name: 'Ragam Olahraga', slug: 'ragam-olahraga', parentSlug: 'olahraga', order: 4, color: 'slate', description: 'Berita bulutangkis, otomotif, basket, dan lainnya.' },
    // Teknologi
    { name: 'Gadget & Review', slug: 'gadget-review', parentSlug: 'teknologi', order: 1, color: 'blue', description: 'Ulasan gawai, smartphone, dan perangkat cerdas terbaru.' },
    { name: 'AI & Inovasi', slug: 'ai-inovasi', parentSlug: 'teknologi', order: 2, color: 'purple', description: 'Kecerdasan buatan, riset ilmiah, dan robotika.' },
    { name: 'Startups & Digital', slug: 'startups-digital', parentSlug: 'teknologi', order: 3, color: 'teal', description: 'Ekosistem startup dan bisnis digital tanah air.' },
    { name: 'Game & Esports', slug: 'game-esports', parentSlug: 'teknologi', order: 4, color: 'violet', description: 'Dunia gaming, turnamen esports, dan konsol game.' },
    // Opini
    { name: 'Kolom & Esai', slug: 'kolom-esai', parentSlug: 'opini', order: 1, color: 'indigo', description: 'Sumbangan tulisan dari para pemikir dan akademisi.' },
    { name: 'Tajuk Rencana', slug: 'tajuk-rencana', parentSlug: 'opini', order: 2, color: 'slate', description: 'Sikap redaksi terhadap isu-isu krusial nasional.' },
    { name: 'Wawancara', slug: 'wawancara', parentSlug: 'opini', order: 3, color: 'rose', description: 'Tanya jawab mendalam dengan tokoh inspiratif.' },
    // Investigasi
    { name: 'Laporan Investigasi', slug: 'laporan-investigasi', parentSlug: 'investigasi', order: 1, color: 'red', description: 'Laporan eksklusif hasil investigasi tim redaksi.' },
    { name: 'Sorotan Khusus', slug: 'sorotan-khusus', parentSlug: 'investigasi', order: 2, color: 'amber', description: 'Liputan mendalam mengenai isu sosial kemasyarakatan.' },
    // Gaya Hidup (lifestyle)
    { name: 'Wisata & Kuliner', slug: 'wisata-kuliner', parentSlug: 'lifestyle', order: 1, color: 'teal', description: 'Rekomendasi destinasi wisata dan petualangan rasa kuliner.' },
    { name: 'Kesehatan & Wellness', slug: 'kesehatan-wellness', parentSlug: 'lifestyle', order: 2, color: 'green', description: 'Tips hidup sehat, nutrisi, dan kebugaran mental.' },
    { name: 'Seni, Film & Fesyen', slug: 'seni-film-fesyen', parentSlug: 'lifestyle', order: 3, color: 'rose', description: 'Resensi seni pertunjukan, perfilman, dan gaya busana.' },
    { name: 'Otomotif', slug: 'otomotif', parentSlug: 'lifestyle', order: 4, color: 'slate', description: 'Modifikasi, review kendaraan baru, dan tren transportasi.' },
    // Advertorial
    { name: 'Info Bisnis', slug: 'info-bisnis', parentSlug: 'advertorial', order: 1, color: 'yellow', description: 'Ulasan produk and strategi perkembangan bisnis.' },
    { name: 'Rilis Pers', slug: 'rilis-pers', parentSlug: 'advertorial', order: 2, color: 'orange', description: 'Pernyataan resmi perusahaan dan lembaga.' },
    // Video
    { name: 'Dokumenter & Reportase', slug: 'dokumenter-reportase', parentSlug: 'video', order: 1, color: 'sky', description: 'Liputan audio-visual eksklusif di lapangan.' },
    { name: 'Galeri Foto', slug: 'galeri-foto', parentSlug: 'video', order: 2, color: 'pink', description: 'Karya jurnalistik dalam lensa fotografi.' },
    { name: 'Podcast & Audio', slug: 'podcast-audio', parentSlug: 'video', order: 3, color: 'indigo', description: 'Obrolan santai dan informatif seputar isu terhangat.' }
  ]

  for (const sub of subCategoriesData) {
    const parentId = categoriesMap[sub.parentSlug]
    if (!parentId) continue

    const createdSubCat = await prisma.category.upsert({
      where: { id: sub.slug },
      update: {
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        parentId: parentId,
        order: sub.order,
        color: sub.color
      },
      create: {
        id: sub.slug,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        parentId: parentId,
        order: sub.order,
        color: sub.color,
        isGlobal: true
      }
    })
    categoriesMap[sub.slug] = createdSubCat.id
  }

  console.log('Categories seeded:', Object.keys(categoriesMap))

  // 4. Clean existing mock articles (to avoid duplication on repeated seed runs)
  await prisma.article.deleteMany({
    where: {
      siteId: 'pusat'
    }
  })

  // 5. Seed Mock Articles
  const mockArticles = [
    {
      title: 'Sri Mulyani Umumkan Arah Kebijakan Fiskal 2027: Fokus Pertumbuhan Berkelanjutan',
      slug: 'sri-mulyani-kebijakan-fiskal-2027',
      categoryId: categoriesMap['ekonomi'],
      featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0a101f',
      excerpt: 'Menteri Keuangan memaparkan strategi fiskal jangka panjang guna menekan defisit anggaran di bawah 2% serta mendorong efisiensi belanja daerah.',
      isBreaking: true,
      isFeatured: true,
      tags: ['Sri Mulyani', 'Fiskal 2027', 'Ekonomi', 'Kemenkeu']
    },
    {
      title: 'DPR Sahkan RUU Perlindungan Data Pribadi Hasil Amandemen Terbaru Era Digital',
      slug: 'dpr-sahkan-ruu-perlindungan-data-pribadi',
      categoryId: categoriesMap['politik'],
      featuredImage: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#170c2a',
      excerpt: 'Sidang Paripurna DPR resmi mengetok palu pengesahan regulasi ketat terkait kewajiban korporasi menjaga kedaulatan data pengguna digital.',
      isBreaking: false,
      isExclusive: true,
      tags: ['DPR RI', 'Data Pribadi', 'Digital', 'Undang-Undang']
    },
    {
      title: 'Teknologi AI Generatif Mulai Diterapkan Secara Luas di Sektor Pendidikan Publik',
      slug: 'teknologi-ai-generatif-pendidikan-publik',
      categoryId: categoriesMap['teknologi'],
      featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#051b2c',
      excerpt: 'Kementerian Pendidikan bekerja sama dengan konsorsium teknologi nasional meluncurkan asisten guru pintar berbasis AI di 1.000 sekolah percontohan.',
      isBreaking: false,
      isFeatured: true,
      tags: ['Kecerdasan Buatan', 'Sekolah Pintar', 'Pendidikan', 'EdTech']
    },
    {
      title: 'Festival Budaya Nusantara 2026 Menarik Ratusan Ribu Wisatawan Asing di Bali',
      slug: 'festival-budaya-nusantara-2026-bali',
      categoryId: categoriesMap['daerah'],
      featuredImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#2b1a03',
      excerpt: 'Pagelaran tari kolosal dan pameran ekonomi kreatif dari 38 provinsi sukses menghidupkan kembali denyut pariwisata premium lokal.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Karnaval Budaya', 'Pariwisata', 'Pesona Indonesia', 'Bali']
    },
    {
      title: 'KPK Usut Dugaan Korupsi Pengadaan Infrastruktur Jalan Lintas Sumatera Timur',
      slug: 'kpk-usut-dugaan-korupsi-jalan-sumatera',
      categoryId: categoriesMap['hukum-keadilan'],
      featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#1a1d20',
      excerpt: 'Penyidik mulai menggeledah sejumlah kantor dinas pekerjaan umum menyusul laporan kerugian negara yang ditaksir mencapai ratusan miliar rupiah.',
      isBreaking: true,
      isExclusive: true,
      tags: ['Korupsi', 'KPK RI', 'Infrastruktur', 'Sumatera']
    },
    {
      title: 'Pemerintah Targetkan Swasembada Pangan Melalui Food Estate Modern Kalimantan',
      slug: 'pemerintah-targetkan-swasembada-pangan-kalimantan',
      categoryId: categoriesMap['nasional'],
      featuredImage: 'https://images.unsplash.com/photo-1501973900372-7c8948227383?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0a2212',
      excerpt: 'Langkah taktis penanaman komoditas padi hibrida berskala besar di lahan gambut terkelola mendapat respons positif dari kalangan petani daerah.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Pangan', 'Food Estate', 'Swasembada', 'Kalimantan']
    },
    {
      title: 'Laju Inflasi Triwulan Pertama Terkendali Berkat Stabilisasi Pasokan Pangan Pokok',
      slug: 'laju-inflasi-triwulan-pertama-terkendali',
      categoryId: categoriesMap['ekonomi'],
      featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0b161e',
      excerpt: 'Bank Indonesia mencatat inflasi bulanan stabil pada level 2.1%, jauh di bawah batas kekhawatiran pasar global saat ini.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Inflasi', 'Bank Indonesia', 'Pangan Pokok', 'Fiskal']
    },
    {
      title: 'Start-Up Otomotif Lokal Perkenalkan Purwarupa Mobil Listrik Keluarga Murah',
      slug: 'startup-mobil-listrik-lokal-keluarga',
      categoryId: categoriesMap['teknologi'],
      featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#081a24',
      excerpt: 'Kendaraan berdaya tampung 7 penumpang ini mampu menempuh jarak hingga 400 kilometer dalam satu pengisian penuh baterai litium terintegrasi.',
      isBreaking: false,
      isExclusive: false,
      tags: ['Mobil Listrik', 'Startup', 'Otomotif', 'Teknologi Hijau']
    }
  ]

  for (const article of mockArticles) {
    const blocksJson = [
      { type: 'paragraph', content: article.excerpt },
      { type: 'paragraph', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec ex at ex tempor tincidunt. Sed elementum nulla purus, quis commodo velit interdum sed. Proin sollicitudin tellus a arcu semper, nec rutrum dui porta. Proin ac convallis leo, ac pulvinar ligula. Quisque vel egestas libero. Duis volutpat, magna at sodales efficitur, justo magna consequat felis, ac facilisis dolor velit at velit. Pellentesque a sem vel mi consequat fermentum eu et nibh.' },
      { type: 'image', url: article.featuredImage }
    ]

    await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        siteId: 'pusat',
        categoryId: article.categoryId,
        authorId: superadmin.id,
        blocks: blocksJson,
        tags: article.tags,
        status: 'published',
        featuredImage: article.featuredImage,
        featuredImageColor: article.featuredImageColor,
        isBreaking: article.isBreaking,
        isExclusive: article.isExclusive,
        isFeatured: article.isFeatured,
        publishedAt: new Date(),
        wordCount: 250,
        readingTimeMin: 3
      }
    })
  }

  console.log('Successfully seeded 8 highly realistic mock articles!')
  console.log('Seed selesai. Gunakan akun superadmin untuk membuat user lainnya.')
}

main().catch(console.error).finally(() => prisma.$disconnect())