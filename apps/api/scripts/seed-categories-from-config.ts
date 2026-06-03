import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SubCategory {
  name: string
  slug: string
}

interface CategoryData {
  name: string
  slug?: string
  subCategories?: SubCategory[]
}

const CATEGORIES_TO_SEED: CategoryData[] = [
  {
    name: 'Nasional',
    subCategories: [
      { name: 'Politik', slug: 'Politik' },
      { name: 'Hukum & Keadilan', slug: 'Hukum' },
      { name: 'Pendidikan', slug: 'Pendidikan' },
      { name: 'Peristiwa', slug: 'Peristiwa' }
    ]
  },
  {
    name: 'Daerah',
    subCategories: [
      { name: 'DKI Jakarta & Banten', slug: 'Jakarta' },
      { name: 'Jawa Barat & Tengah', slug: 'Jawa' },
      { name: 'Jawa Timur & Bali', slug: 'Bali' },
      { name: 'Sumatera & Kalimantan', slug: 'Sumatera' },
      { name: 'Sulawesi & Papua', slug: 'Sulawesi' },
      { name: 'Kabar Desa', slug: 'Desa' }
    ]
  },
  {
    name: 'Ekonomi',
    subCategories: [
      { name: 'Makro & Keuangan', slug: 'Keuangan' },
      { name: 'Bisnis & Saham', slug: 'Bisnis' },
      { name: 'UMKM', slug: 'UMKM' },
      { name: 'Industrial', slug: 'Industrial' }
    ]
  },
  {
    name: 'Olahraga',
    subCategories: [
      { name: 'Piala Dunia', slug: 'Piala Dunia' },
      { name: 'Timnas Garuda', slug: 'Timnas' },
      { name: 'Sepak Bola', slug: 'Sepak Bola' },
      { name: 'Ragam Olahraga', slug: 'Ragam Olahraga' }
    ]
  },
  {
    name: 'Teknologi',
    subCategories: [
      { name: 'Gadget & Review', slug: 'Gadget' },
      { name: 'AI & Inovasi', slug: 'AI' },
      { name: 'Startups & Digital', slug: 'Startups' },
      { name: 'Game & Esports', slug: 'Game' }
    ]
  },
  {
    name: 'Opini',
    subCategories: [
      { name: 'Kolom & Esai', slug: 'Kolom' },
      { name: 'Tajuk Rencana', slug: 'Tajuk' },
      { name: 'Wawancara', slug: 'Wawancara' }
    ]
  },
  {
    name: 'Investigasi',
    subCategories: [
      { name: 'Laporan Investigasi', slug: 'Laporan Investigasi' },
      { name: 'Sorotan Khusus', slug: 'Sorotan' }
    ]
  },
  {
    name: 'Gaya Hidup',
    slug: 'Lifestyle',
    subCategories: [
      { name: 'Wisata & Kuliner', slug: 'Wisata' },
      { name: 'Kesehatan & Wellness', slug: 'Kesehatan' },
      { name: 'Seni, Film & Fesyen', slug: 'Seni' },
      { name: 'Otomotif', slug: 'Otomotif' }
    ]
  },
  {
    name: 'Advertorial',
    subCategories: [
      { name: 'Info Bisnis', slug: 'Info Bisnis' },
      { name: 'Rilis Pers', slug: 'Rilis Pers' }
    ]
  },
  {
    name: 'Video',
    subCategories: [
      { name: 'Dokumenter & Reportase', slug: 'Dokumenter' },
      { name: 'Galeri Foto', slug: 'Galeri Foto' },
      { name: 'Podcast & Audio', slug: 'Podcast' }
    ]
  }
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seedCategories() {
  console.log('🚀 Starting category seeding...\n')

  const siteId = 'pusat'
  let order = 1

  for (const category of CATEGORIES_TO_SEED) {
    const categorySlug = slugify(category.name)

    console.log(`📁 Creating category: ${category.name} (slug: ${categorySlug})`)

    const parentCategory = await prisma.category.upsert({
      where: {
        slug_siteId: {
          slug: categorySlug,
          siteId: siteId
        }
      },
      update: {
        name: category.name,
        order: order,
        deletedAt: null
      },
      create: {
        name: category.name,
        slug: categorySlug,
        siteId: siteId,
        isGlobal: false,
        order: order
      }
    })

    console.log(`   ✓ Parent category created/updated: ${parentCategory.id}`)

    if (category.subCategories && category.subCategories.length > 0) {
      let subOrder = 1
      for (const subCat of category.subCategories) {
        const subSlug = slugify(subCat.name)

        console.log(`   📂 Creating sub-category: ${subCat.name} (slug: ${subSlug})`)

        await prisma.category.upsert({
          where: {
            slug_siteId: {
              slug: subSlug,
              siteId: siteId
            }
          },
          update: {
            name: subCat.name,
            parentId: parentCategory.id,
            order: subOrder,
            deletedAt: null
          },
          create: {
            name: subCat.name,
            slug: subSlug,
            siteId: siteId,
            isGlobal: false,
            parentId: parentCategory.id,
            order: subOrder
          }
        })

        console.log(`      ✓ Sub-category created/updated`)
        subOrder++
      }
    }

    order++
    console.log('')
  }

  console.log('✅ Category seeding completed!')
  console.log(`📊 Total parent categories: ${CATEGORIES_TO_SEED.length}`)
  console.log(`📊 Total sub-categories: ${CATEGORIES_TO_SEED.reduce((acc, cat) => acc + (cat.subCategories?.length || 0), 0)}`)
}

async function main() {
  try {
    await seedCategories()
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
