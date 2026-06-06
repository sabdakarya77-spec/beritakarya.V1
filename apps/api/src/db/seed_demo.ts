import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Investigative Demo seed...')

  // 1. Setup Sites
  const siteConfigs = [
    { id: 'pusat', name: 'BeritaKarya Pusat', domain: 'beritakarya.co' },
    { id: 'bandung', name: 'BeritaKarya Bandung', domain: 'bandung.beritakarya.co' },
    { id: 'surabaya', name: 'BeritaKarya Surabaya', domain: 'surabaya.beritakarya.co' }
  ]

  const siteIdMap: Record<string, string> = { pusat: 'pusat', bandung: 'bandung', surabaya: 'surabaya' }

  for (const conf of siteConfigs) {
    const existing = await prisma.site.findUnique({ where: { domain: conf.domain } })
    if (existing) {
      siteIdMap[conf.id] = existing.id
      await prisma.site.update({ where: { id: existing.id }, data: { name: conf.name } })
    } else {
      const created = await prisma.site.create({ data: conf })
      siteIdMap[conf.id] = created.id
    }
  }

  const PUSAT_ID = siteIdMap['pusat']
  const hash = await bcrypt.hash('Admin123!', 10)
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@beritakarya.co' },
    update: {},
    create: { email: 'superadmin@beritakarya.co', name: 'Redaksi', role: 'superadmin', siteId: null, passwordHash: hash }
  })

  // 2. Categories (Parents & Children)
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

  const catMap: Record<string, string> = {}

  for (const parent of parentsData) {
    const created = await prisma.category.upsert({
      where: { slug_siteId: { slug: parent.slug, siteId: PUSAT_ID } },
      update: {
        name: parent.name,
        description: parent.description,
        order: parent.order,
        color: parent.color,
        parentId: null
      },
      create: { 
        name: parent.name, 
        slug: parent.slug, 
        siteId: PUSAT_ID,
        description: parent.description,
        order: parent.order,
        color: parent.color
      }
    })
    catMap[parent.slug] = created.id
  }

  // Seed Sub-categories
  const subCategoriesData = [
    // Nasional
    { name: 'Politik', slug: 'politik', parentSlug: 'nasional', order: 1, color: 'violet', description: 'Dinamika politik tanah air, legislatif, dan eksekutif.' },
    { name: 'Hukum & Keadilan', slug: 'hukum', parentSlug: 'nasional', order: 2, color: 'slate', description: 'Kasus peradilan, investigasi kriminal, dan penegakan hukum.' },
    { name: 'Pendidikan', slug: 'pendidikan', parentSlug: 'nasional', order: 3, color: 'emerald', description: 'Kabar pendidikan, riset, dan akademisi.' },
    { name: 'Peristiwa', slug: 'peristiwa', parentSlug: 'nasional', order: 4, color: 'rose', description: 'Kejadian penting dan berita hangat hari ini.' },
    // Daerah
    { name: 'DKI Jakarta & Banten', slug: 'jakarta', parentSlug: 'daerah', order: 1, color: 'blue', description: 'Kabar ibu kota dan wilayah Banten.' },
    { name: 'Jawa Barat & Tengah', slug: 'jawa', parentSlug: 'daerah', order: 2, color: 'teal', description: 'Informasi seputar Jawa Barat dan Jawa Tengah.' },
    { name: 'Jawa Timur & Bali', slug: 'bali', parentSlug: 'daerah', order: 3, color: 'amber', description: 'Berita Jawa Timur dan Pulau Dewata.' },
    { name: 'Sumatera & Kalimantan', slug: 'sumatera', parentSlug: 'daerah', order: 4, color: 'orange', description: 'Berita dari wilayah Sumatera dan Kalimantan.' },
    { name: 'Sulawesi & Papua', slug: 'sulawesi', parentSlug: 'daerah', order: 5, color: 'indigo', description: 'Informasi dari Sulawesi, Maluku, dan Papua.' },
    { name: 'Kabar Desa', slug: 'desa', parentSlug: 'daerah', order: 6, color: 'emerald', description: 'Rangkuman aktivitas dan dinamika pedesaan.' },
    // Ekonomi
    { name: 'Makro & Keuangan', slug: 'keuangan', parentSlug: 'ekonomi', order: 1, color: 'emerald', description: 'Ekonomi makro, perbankan, dan kebijakan keuangan.' },
    { name: 'Bisnis & Saham', slug: 'bisnis', parentSlug: 'ekonomi', order: 2, color: 'violet', description: 'Dinamika pasar saham, investasi, dan korporasi.' },
    { name: 'UMKM', slug: 'umkm', parentSlug: 'ekonomi', order: 3, color: 'amber', description: 'Perkembangan usaha mikro, kecil, dan menengah.' },
    { name: 'Industrial', slug: 'industrial', parentSlug: 'ekonomi', order: 4, color: 'blue', description: 'Sektor manufaktur, komoditas, dan industri.' },
    // Olahraga
    { name: 'Piala Dunia', slug: 'piala-dunia', parentSlug: 'olahraga', order: 1, color: 'amber', description: 'Liputan khusus turnamen akbar sepak bola sejagat.' },
    { name: 'Timnas Garuda', slug: 'timnas', parentSlug: 'olahraga', order: 2, color: 'red', description: 'Perjuangan punggawa Tim Nasional Indonesia.' },
    { name: 'Sepak Bola', slug: 'sepak-bola', parentSlug: 'olahraga', order: 3, color: 'blue', description: 'Kompetisi liga domestik dan internasional.' },
    { name: 'Ragam Olahraga', slug: 'ragam-olahraga', parentSlug: 'olahraga', order: 4, color: 'slate', description: 'Berita bulutangkis, otomotif, basket, dan lainnya.' },
    // Teknologi
    { name: 'Gadget & Review', slug: 'gadget', parentSlug: 'teknologi', order: 1, color: 'blue', description: 'Ulasan gawai, smartphone, dan perangkat cerdas terbaru.' },
    { name: 'AI & Inovasi', slug: 'ai', parentSlug: 'teknologi', order: 2, color: 'purple', description: 'Kecerdasan buatan, riset ilmiah, dan robotika.' },
    { name: 'Startups & Digital', slug: 'startups', parentSlug: 'teknologi', order: 3, color: 'teal', description: 'Ekosistem startup dan bisnis digital tanah air.' },
    { name: 'Game & Esports', slug: 'game', parentSlug: 'teknologi', order: 4, color: 'violet', description: 'Dunia gaming, turnamen esports, dan konsol game.' },
    // Opini
    { name: 'Kolom & Esai', slug: 'kolom', parentSlug: 'opini', order: 1, color: 'indigo', description: 'Sumbangan tulisan dari para pemikir dan akademisi.' },
    { name: 'Tajuk Rencana', slug: 'tajuk', parentSlug: 'opini', order: 2, color: 'slate', description: 'Sikap redaksi terhadap isu-isu krusial nasional.' },
    { name: 'Wawancara', slug: 'wawancara', parentSlug: 'opini', order: 3, color: 'rose', description: 'Tanya jawab mendalam dengan tokoh inspiratif.' },
    // Investigasi
    { name: 'Laporan Investigasi', slug: 'laporan-investigasi', parentSlug: 'investigasi', order: 1, color: 'red', description: 'Laporan eksklusif hasil investigasi tim redaksi.' },
    { name: 'Sorotan Khusus', slug: 'sorotan', parentSlug: 'investigasi', order: 2, color: 'amber', description: 'Liputan mendalam mengenai isu sosial kemasyarakatan.' },
    // Gaya Hidup (lifestyle)
    { name: 'Wisata & Kuliner', slug: 'wisata', parentSlug: 'lifestyle', order: 1, color: 'teal', description: 'Rekomendasi destinasi wisata dan petualangan rasa kuliner.' },
    { name: 'Kesehatan & Wellness', slug: 'kesehatan', parentSlug: 'lifestyle', order: 2, color: 'green', description: 'Tips hidup sehat, nutrisi, dan kebugaran mental.' },
    { name: 'Seni, Film & Fesyen', slug: 'seni', parentSlug: 'lifestyle', order: 3, color: 'rose', description: 'Resensi seni pertunjukan, perfilman, dan gaya busana.' },
    { name: 'Otomotif', slug: 'otomotif', parentSlug: 'lifestyle', order: 4, color: 'slate', description: 'Modifikasi, review kendaraan baru, dan tren transportasi.' },
    // Advertorial
    { name: 'Info Bisnis', slug: 'info-bisnis', parentSlug: 'advertorial', order: 1, color: 'yellow', description: 'Ulasan produk and strategi perkembangan bisnis.' },
    { name: 'Rilis Pers', slug: 'rilis-pers', parentSlug: 'advertorial', order: 2, color: 'orange', description: 'Pernyataan resmi perusahaan dan lembaga.' },
    // Video
    { name: 'Dokumenter & Reportase', slug: 'dokumenter', parentSlug: 'video', order: 1, color: 'sky', description: 'Liputan audio-visual eksklusif di lapangan.' },
    { name: 'Foto Jurnalistik', slug: 'foto-jurnalistik', parentSlug: 'video', order: 2, color: 'pink', description: 'Karya jurnalistik dalam lensa fotografi.' },
    { name: 'Podcast & Audio', slug: 'podcast', parentSlug: 'video', order: 3, color: 'indigo', description: 'Obrolan santai dan informatif seputar isu terhangat.' }
  ]

  for (const sub of subCategoriesData) {
    const parentId = catMap[sub.parentSlug]
    if (!parentId) continue

    const created = await prisma.category.upsert({
      where: { slug_siteId: { slug: sub.slug, siteId: PUSAT_ID } },
      update: {
        name: sub.name,
        description: sub.description,
        parentId: parentId,
        order: sub.order,
        color: sub.color
      },
      create: { 
        name: sub.name, 
        slug: sub.slug, 
        siteId: PUSAT_ID,
        description: sub.description,
        parentId: parentId,
        order: sub.order,
        color: sub.color
      }
    })
    catMap[sub.slug] = created.id
  }

  // 3. Investigative Articles (from User Screenshot)
  const investigativeArticles = [
    {
      title: 'Tanah Galian C dan Bayang-Bayang Ekologi Nusantara: Investigasi Praktik di Kawasan Industri',
      slug: 'investigasi-galian-c-nusantara',
      cat: 'daerah',
      img: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f5?q=80&w=1200&auto=format&fit=crop',
      summary: 'Dugaan aktivitas tanpa izin di PT Bahagia Steel menyoroti celah pengawasan yang membahayakan kelestarian alam dan kewajiban hukum yang sering kali terabaikan dalam geliat industri.'
    },
    {
      title: 'Kartini Modern dalam Pusaran Hukum: Noveriana dan Tantangan Keadilan Gender',
      slug: 'kartini-modern-pusaran-hukum',
      cat: 'hukum',
      img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
      summary: 'Bagaimana perempuan mengawal hukum di tengah struktur patriarki yang masih mengakar kuat di institusi peradilan kita.'
    },
    {
      title: 'Paradoks Energi: Bahlil dan Ultimatum Penimbunan BBM Subsidi',
      slug: 'paradoks-energi-bahlil-bbm',
      cat: 'ekonomi',
      img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
      summary: 'Pemerintah memperketat pengawasan distribusi energi untuk memastikan rakyat kecil mendapatkan haknya.'
    },
    {
      title: 'Lonjakan Perceraian dan Rapuhnya Ketahanan Keluarga di Tulungagung',
      slug: 'lonjakan-perceraian-tulungagung',
      cat: 'nasional',
      img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
      summary: 'Fenomena sosial yang mengkhawatirkan menuntut peran lebih dari sekadar seremonial organisasi kemasyarakatan.'
    },
    {
      title: 'Polsek Menganti: Humanisme di Tengah Ketegangan Massa',
      slug: 'polsek-menganti-humanisme',
      cat: 'politik',
      img: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1200&auto=format&fit=crop',
      summary: 'Pendekatan preventif yang dilakukan kepolisian berhasil meredam potensi konflik antar wilayah.'
    },
    {
      title: 'Masa Depan AI dalam Jurnalisme Lokal Indonesia',
      slug: 'masa-depan-ai-jurnalisme-lokal',
      cat: 'teknologi',
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
      summary: 'Bagaimana teknologi terbaru membantu portal berita independen bersaing dengan raksasa media global.'
    }
  ]

  for (const art of investigativeArticles) {
    await prisma.article.upsert({
      where: { siteId_slug: { siteId: PUSAT_ID, slug: art.slug } },
      update: {},
      create: {
        title: art.title,
        slug: art.slug,
        siteId: PUSAT_ID,
        categoryId: catMap[art.cat],
        authorId: user.id,
        status: 'published',
        publishedAt: new Date(),
        blocks: [
          { type: 'image', url: art.img, caption: art.title },
          { type: 'paragraph', content: art.summary },
          { type: 'paragraph', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
        ]
      }
    })
  }

  console.log('Investigative Demo seed completed successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
