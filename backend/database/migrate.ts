import { readdirSync } from 'fs'
import { basename } from 'path'
import { join } from 'path'
import { getPool, closeDatabase } from './client'

async function getAppliedMigrations(): Promise<string[]> {
  // Check if migrations table exists
  const result = await getPool().query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_name = '_prisma_migrations'
  `)
  
  if (result.rows.length === 0) {
    return []
  }
  
  const migrations = await getPool().query(`SELECT migration_name FROM "_prisma_migrations"`)
  return migrations.rows.map((row: any) => row.migration_name)
}

async function applyMigration(name: string, up: () => Promise<void>): Promise<void> {
  const startedAt = new Date()
  
  console.log(`Applying migration: ${name}`)
  
  try {
    await up()
    
    // Record successful migration
    await getPool().query(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        crypto.randomUUID(),
        '',
        new Date(),
        name,
        null,
        null,
        startedAt,
        1
      ]
    )
    
    console.log(`Migration ${name} applied successfully`)
  } catch (error) {
    console.error(`Migration ${name} failed:`, error)
    throw error
  }
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = join(__dirname, 'migrations')
  
  const appliedMigrations = await getAppliedMigrations()
  console.log(`Found ${appliedMigrations.length} applied migrations`)
  
  // Load migration files
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts'))
    .sort()
  
  for (const file of files) {
    const name = basename(file, '.ts')
    if (!appliedMigrations.includes(name)) {
      const migration = await import(join(migrationsDir, file)) as { up: () => Promise<void> }
      await applyMigration(name, migration.up)
    } else {
      console.log(`Skipping already applied migration: ${name}`)
    }
  }
  
  await closeDatabase()
  console.log('All migrations completed')
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}