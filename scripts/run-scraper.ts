import { config } from 'dotenv'
config({ path: '.env.local' })
import { createScriptClient } from '../lib/supabase/script-client'
import { discoverServices, saveDiscoveredServices, getServicesNeedingResearch } from '../lib/scrapers'
import { batchResearchServices } from '../lib/ai/discount-researcher'

// ─── CLI flag parsing ────────────────────────────────────────────────
const args = process.argv.slice(2)
const discoverOnly = args.includes('--discover-only')
const researchOnly = args.includes('--research-only')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : 30

// ─── Helpers ─────────────────────────────────────────────────────────
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

function divider() {
  console.log(dim('─'.repeat(60)))
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(bold('🔍 Discount Deal Finder — Local Scraper'))
  divider()

  const supabase = createScriptClient()
  const startTime = Date.now()

  // ── Phase 1: Discover ──────────────────────────────────────
  if (!researchOnly) {
    console.log()
    console.log(bold(cyan('Phase 1: Service Discovery')))
    console.log(dim(`  Scraping Product Hunt, G2, AlternativeTo (limit: ${limit}/source)...`))
    console.log()

    const { services, errors, stats } = await discoverServices(limit)

    console.log(`  ${green('Product Hunt')}: ${stats.productHunt} services`)
    console.log(`  ${green('G2')}:           ${stats.g2} services`)
    console.log(`  ${green('AlternativeTo')}: ${stats.alternativeTo} services`)
    console.log(`  ${dim('Duplicates removed')}: ${stats.duplicatesRemoved}`)
    console.log(`  ${bold('Total unique')}: ${services.length}`)

    if (errors.length > 0) {
      console.log()
      console.log(yellow(`  ⚠ ${errors.length} error(s):`))
      errors.forEach((e) => console.log(red(`    • ${e}`)))
    }

    // Save to database
    console.log()
    console.log(dim('  Saving to database...'))
    const saveResult = await saveDiscoveredServices(supabase, services)
    console.log(`  ${green('Inserted')}: ${saveResult.inserted}`)
    console.log(`  ${green('Updated')}: ${saveResult.updated}`)
    if (saveResult.errors.length > 0) {
      console.log(yellow(`  ⚠ ${saveResult.errors.length} save error(s):`))
      saveResult.errors.forEach((e) => console.log(red(`    • ${e}`)))
    }

    divider()
  }

  // ── Phase 2: Research ──────────────────────────────────────
  if (!discoverOnly) {
    console.log()
    console.log(bold(cyan('Phase 2: Discount Research (Gemini AI)')))

    const researchLimit = limitIndex !== -1 ? Math.min(limit, 10) : 10
    const services = await getServicesNeedingResearch(supabase, researchLimit)

    if (services.length === 0) {
      console.log(dim('  No services need research at this time.'))
    } else {
      console.log(dim(`  Researching ${services.length} service(s)...`))
      console.log()

      const result = await batchResearchServices(
        supabase,
        services,
        (current, total, name) => {
          console.log(dim(`  [${current}/${total}]`) + ` ${name}`)
        }
      )

      console.log()
      console.log(`  ${green('Services processed')}: ${result.totalServices}`)
      console.log(`  ${green('Discounts found')}: ${result.totalDiscounts}`)
      if (result.errors.length > 0) {
        console.log(yellow(`  ⚠ ${result.errors.length} error(s):`))
        result.errors.forEach((e) => console.log(red(`    • ${e}`)))
      }
    }

    divider()
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log()
  console.log(bold(green(`✅ Done in ${elapsed}s`)))
  console.log()
}

main().catch((err) => {
  console.error(red(`\n❌ Fatal error: ${err.message}`))
  process.exit(1)
})
