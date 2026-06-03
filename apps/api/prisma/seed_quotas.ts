import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function seedQuotas() {
  console.log('🌱 Seeding RoleQuota data...')

  const quotas = [
    {
      role: Role.superadmin,
      dailyRequests: 999999,
      dailyTokens: 999999,
      monthlyBudget: 99999.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo', 
        'grammar', 'readability', 'fact-check', 'layout', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: Role.wapimred,
      dailyRequests: 500,
      dailyTokens: 100000,
      monthlyBudget: 500.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo',
        'grammar', 'readability', 'fact-check', 'layout', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: Role.reporter,
      dailyRequests: 100,
      dailyTokens: 50000,
      monthlyBudget: 50.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'headline', 'seo', 'grammar', 'readability', 'fact-check', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: Role.kontributor,
      dailyRequests: 30,
      dailyTokens: 15000,
      monthlyBudget: 15.00,
      allowedFeatures: JSON.stringify([
        'rewrite', 'expand', 'grammar', 'readability', 'caption'
      ]),
      modelRestriction: null
    },
    {
      role: Role.reader,
      dailyRequests: 5,
      dailyTokens: 1000,
      monthlyBudget: 0.00,
      allowedFeatures: JSON.stringify([]),
      modelRestriction: null
    },
    {
      role: Role.advertiser,
      dailyRequests: 10,
      dailyTokens: 5000,
      monthlyBudget: 2.00,
      allowedFeatures: JSON.stringify([]),
      modelRestriction: null
    }
  ]

  for (const quota of quotas) {
    await prisma.roleQuota.upsert({
      where: { role: quota.role },
      update: {
        dailyRequests: quota.dailyRequests,
        dailyTokens: quota.dailyTokens,
        monthlyBudget: quota.monthlyBudget,
        allowedFeatures: quota.allowedFeatures,
        modelRestriction: quota.modelRestriction
      },
      create: quota
    })
    console.log(`  ✅ Seeded quota for role: ${quota.role}`)
  }

  console.log('✅ RoleQuota seeding complete!')
}

async function updateExistingUsers() {
  console.log('\n🔄 Updating existing users with default quota fields...')
  
  const defaultQuota = {
    aiEnabled: true,
    aiDailyLimit: 100,
    aiMonthlyBudget: 50.00,
    aiFeaturesAllowed: JSON.stringify([
      'rewrite', 'expand', 'headline', 'seo', 'grammar', 'readability', 'fact-check', 'caption'
    ]),
    aiQuotaResetDate: null,
    aiModelRestriction: null
  }

  const users = await prisma.user.findMany({
    select: { id: true, role: true }
  })

  let updated = 0
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: defaultQuota
    })
    updated++
  }

  console.log(`  ✅ Updated ${updated} users with default quota fields`)
  console.log('✅ User quota initialization complete!')
}

seedQuotas()
  .then(() => updateExistingUsers())
  .catch((e) => {
    console.error('❌ Error seeding quotas:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })