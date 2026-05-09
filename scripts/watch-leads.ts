import { getDb } from '../src/lib/db'

async function main() {
  const sql = getDb()
  console.log('Watching for new leads... (checking every 5s)\n')

  const baseline = await sql`SELECT MAX(id) as max_id FROM leads`
  const baseId = baseline[0]?.max_id ?? 0
  console.log(`Baseline lead ID: ${baseId} — watching for anything newer\n`)

  let checks = 0
  const interval = setInterval(async () => {
    checks++
    try {
      const rows = await sql`
        SELECT id, session_token, submission_type, status, created_at,
               payload->>'Name (First)' as first_name,
               payload->>'Phone' as phone,
               payload->>'Property Address' as address,
               payload->>'Form Name' as form_name,
               payload->>'Submission Type' as sub_type
        FROM leads
        WHERE id > ${baseId}
        ORDER BY created_at DESC
        LIMIT 5
      `
      if (rows.length > 0) {
        console.log(`\n✅ NEW LEAD(S) at check #${checks}:`)
        for (const r of rows) {
          console.log(`  ID ${r.id} | ${r.submission_type} | ${r.status}`)
          console.log(`  Name: ${r.first_name} | Phone: ${r.phone}`)
          console.log(`  Address: ${r.address}`)
          console.log(`  Form: ${r.form_name}`)
          console.log(`  Sub Type: ${r.sub_type}`)
          console.log(`  Created: ${r.created_at}\n`)
        }
      } else {
        process.stdout.write(`  check #${checks} — no new leads yet\r`)
      }
    } catch (e) {
      console.error('DB error:', e)
    }
    if (checks >= 36) {
      console.log('\nStopping after 3 minutes.')
      clearInterval(interval)
      process.exit(0)
    }
  }, 5000)
}

main().catch((e) => { console.error(e); process.exit(1) })
