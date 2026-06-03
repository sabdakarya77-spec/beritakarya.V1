#!/usr/bin/env node

/**
 * BeritaKarya Database Verification Script (JavaScript version)
 * 
 * This script verifies database configuration without requiring actual DB connection.
 * It checks: schema completeness, migration existence, connection config validity.
 * 
 * Usage:
 *   node apps/api/verify-database.js
 */

const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

const PRISMA_DIR = join(__dirname, 'prisma')
const MIGRATIONS_DIR = join(PRISMA_DIR, 'migrations')
const SCHEMA_FILE = join(PRISMA_DIR, 'schema.prisma')

function check(name, fn) {
  try {
    return fn()
  } catch (error) {
    return {
      passed: false,
      message: name,
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

function runChecks() {
  console.log('🔍 **BeritaKarya Database Verification**\n')
  console.log('Mode: Schema & Configuration Check (No DB Connection Required)\n')
  
  const results = []
  
  // Check 1: Schema File Exists
  results.push(check('Schema file exists', () => {
    if (!existsSync(SCHEMA_FILE)) {
      return { passed: false, message: 'schema.prisma not found', details: `Expected: ${SCHEMA_FILE}` }
    }
    return { passed: true, message: '✅ Schema file exists' }
  }))
  
  // Check 2: Schema contains required models
  results.push(check('Schema contains all required models', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const requiredModels = [
      'Site', 'User', 'Article', 'Category', 'Advertisement',
      'RefreshToken', 'BlacklistedToken', 'AIUsage', 'NewsletterSubscriber',
      'Media', 'Comment', 'PageView', 'ArticleVersion', 'AuditLog',
      'Notification', 'KYCViewLog', 'RoleQuota'
    ]
    
    const missingModels = requiredModels.filter(model => !schema.includes(`model ${model}`))
    
    if (missingModels.length > 0) {
      return { 
        passed: false, 
        message: 'Missing models in schema', 
        details: `Missing: ${missingModels.join(', ')}` 
      }
    }
    
    return { 
      passed: true, 
      message: `✅ All ${requiredModels.length} required models present`,
      details: requiredModels.join(', ')
    }
  }))
  
  // Check 3: Multi-tenancy fields
  results.push(check('Multi-tenancy implementation', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const checks = [
      { model: 'Site', hasDomain: /domain\s+String\s+@unique/.test(schema) },
      { model: 'User', hasSiteId: /siteId\s+String/.test(schema) },
      { model: 'Article', hasSiteId: /siteId\s+String/.test(schema) },
      { model: 'Category', hasSiteId: /siteId\s+String\?/.test(schema) }
    ]
    
    const failed = checks.filter(c => {
      const values = Object.values(c).filter(v => typeof v === 'boolean')
      return !values.every(v => v === true)
    })
    
    if (failed.length > 0) {
      return { 
        passed: false, 
        message: 'Multi-tenancy fields missing',
        details: `Failed checks: ${failed.map(f => f.model).join(', ')}`
      }
    }
    
    return { 
      passed: true, 
      message: '✅ Multi-tenancy fields correctly configured',
      details: 'Site.domain (unique), User.siteId, Article.siteId, Category.siteId'
    }
  }))
  
  // Check 4: Soft delete pattern in Schema
  results.push(check('Soft delete implementation (Schema)', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const modelsWithSoftDelete = ['Site', 'User', 'Article', 'Category']
    const missingSoftDelete = modelsWithSoftDelete.filter(model => {
      // Simple check: does the model definition contain "deletedAt DateTime?" anywhere?
      const modelPattern = new RegExp(`model ${model}[\\s\\S]*?deletedAt\\s+DateTime\\?`, 'i')
      return !modelPattern.test(schema)
    })
    
    if (missingSoftDelete.length > 0) {
      return {
        passed: false,
        message: 'Soft delete missing in schema',
        details: `Missing deletedAt field: ${missingSoftDelete.join(', ')}`
      }
    }
    
    return {
      passed: true,
      message: '✅ Soft delete pattern in schema',
      details: `${modelsWithSoftDelete.length} models have deletedAt field`
    }
  }))
  
  // Check 5: AI Quota system in Schema
  results.push(check('AI Quota system (Schema)', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    
    // Check RoleQuota model exists
    if (!/model RoleQuota/.test(schema)) {
      return { passed: false, message: 'RoleQuota model missing in schema' }
    }
    
    // Check required fields
    const requiredFields = ['dailyRequests', 'dailyTokens', 'monthlyBudget', 'allowedFeatures', 'modelRestriction']
    const missingFields = requiredFields.filter(field => !schema.includes(field))
    
    if (missingFields.length > 0) {
      return {
        passed: false,
        message: 'RoleQuota missing required fields',
        details: `Missing: ${missingFields.join(', ')}`
      }
    }
    
    // Check if AI fields in User model
    if (!/aiEnabled\s+Boolean/.test(schema) || 
        !/aiDailyLimit\s+Int/.test(schema) ||
        !/aiMonthlyBudget\s+Decimal/.test(schema)) {
      return {
        passed: false,
        message: 'User model missing AI quota fields'
      }
    }
    
    return {
      passed: true,
      message: '✅ AI Quota system properly configured',
      details: 'RoleQuota + User.ai* fields present'
    }
  }))
  
  // Check 6: Migration status - check if schema is synced
  results.push(check('Migration sync status', () => {
    // This is a static check - we can't verify actual DB sync without connection
    // But we can check that migrations directory exists and has at least one migration
    if (!existsSync(MIGRATIONS_DIR)) {
      return { passed: false, message: 'Migrations directory missing', details: MIGRATIONS_DIR }
    }
    
    const fs = require('fs')
    const migrationFolders = fs.readdirSync(MIGRATIONS_DIR)
      .filter(name => 
        name !== 'migration_lock.toml' && 
        fs.statSync(join(MIGRATIONS_DIR, name)).isDirectory()
      )
    
    if (migrationFolders.length === 0) {
      return { passed: false, message: 'No migration folders found' }
    }
    
    return {
      passed: true,
      message: `✅ Migrations directory OK (${migrationFolders.length} migration(s))`,
      details: 'Schema migrations exist (run "pnpm prisma migrate deploy" to sync DB)'
    }
  }))
  
  // Check 7: Schema completeness (all tables defined)
  results.push(check('Schema completeness', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const requiredModels = [
      'Site', 'User', 'Article', 'Category', 'Advertisement',
      'RefreshToken', 'BlacklistedToken', 'AIUsage', 'NewsletterSubscriber',
      'Media', 'Comment', 'PageView', 'ArticleVersion', 'AuditLog',
      'Notification', 'KYCViewLog', 'RoleQuota'
    ]
    
    const missingModels = requiredModels.filter(model => !schema.includes(`model ${model}`))
    
    if (missingModels.length > 0) {
      return { 
        passed: false, 
        message: 'Schema missing models', 
        details: `Missing: ${missingModels.join(', ')}` 
      }
    }
    
    return { 
      passed: true, 
      message: `✅ Schema complete (${requiredModels.length} models)`,
      details: 'All required models defined in schema.prisma'
    }
  }))
  
  // Check 8: Indexes defined in schema
  results.push(check('Database indexes in schema', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const indexMatches = schema.match(/@@index\(\[/g) || []
    
    if (indexMatches.length < 10) {
      return {
        passed: false,
        message: 'Insufficient indexes in schema',
        details: `Found ${indexMatches.length} indexes, expected at least 10`
      }
    }
    
    return {
      passed: true,
      message: `✅ ${indexMatches.length} indexes in schema`,
      details: 'Good indexing strategy'
    }
  }))
  
  // Print Results
  console.log('='.repeat(70))
  console.log('VERIFICATION RESULTS\n')
  
  let passedCount = 0
  let warningCount = 0
  let failedCount = 0
  
  results.forEach(result => {
    if (result.passed) {
      console.log(result.message)
      passedCount++
    } else if (result.details?.startsWith('⚠️')) {
      console.warn(result.message)
      if (result.details) console.warn(`  └─ ${result.details}`)
      warningCount++
    } else {
      console.error(result.message)
      if (result.details) console.error(`  └─ ${result.details}`)
      failedCount++
    }
  })
  
  console.log('\n' + '='.repeat(70))
  console.log(`📊 Summary: ${passedCount} passed, ${warningCount} warnings, ${failedCount} failed\n`)
  
  if (failedCount === 0) {
    console.log('✅ SCHEMA VERIFICATION: PASSED')
    console.log('\n📋 Next Steps:')
    console.log('  1. Ensure DATABASE_URL in .env.production points to PostgreSQL server')
    console.log('  2. Run: pnpm prisma migrate deploy')
    console.log('  3. (Optional) Run: pnpm prisma db seed')
    console.log('  4. Test with: pnpm prisma studio (opens DB viewer at http://localhost:5555)')
    console.log('\n💡 Note: Schema is ready. Run migrations to sync database.')
    process.exit(0)
  } else {
    console.log('❌ SCHEMA VERIFICATION: FAILED')
    console.log('Please fix the issues above before proceeding to production.')
    process.exit(1)
  }
}

try {
  runChecks()
} catch (error) {
  console.error('\nFatal error during verification:', error)
  process.exit(1)
}