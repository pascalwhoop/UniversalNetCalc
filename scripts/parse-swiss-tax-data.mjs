#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Canton name mappings from German to slug
const CANTON_NAMES = {
  'Zürich': 'zurich',
  'Bern': 'bern',
  'Luzern': 'lucerne',
  'Uri': 'uri',
  'Schwyz': 'schwyz',
  'Obwalden': 'obwalden',
  'Nidwalden': 'nidwalden',
  'Glarus': 'glarus',
  'Zug': 'zug',
  'Freiburg': 'fribourg',
  'Fribourg': 'fribourg',
  'Solothurn': 'solothurn',
  'Basel-Stadt': 'basel_stadt',
  'Basel-Landschaft': 'basel_land',
  'Schaffhausen': 'schaffhausen',
  'Appenzell A.Rh.': 'appenzell_ausserrhoden',
  'Appenzell I.Rh.': 'appenzell_innerrhoden',
  'St. Gallen': 'st_gallen',
  'Graubünden': 'graubunden',
  'Aargau': 'aargau',
  'Thurgau': 'thurgau',
  'Ticino': 'ticino',
  'Tessin': 'ticino',
  'Vaud': 'vaud',
  'Waadt': 'vaud',
  'Valais': 'valais',
  'Wallis': 'valais',
  'Neuchâtel': 'neuchatel',
  'Neuenburg': 'neuchatel',
  'Genève': 'geneva',
  'Genf': 'geneva',
  'Jura': 'jura'
}

async function parseSwissTaxData() {
  console.log('📊 Parsing Swiss tax data from Excel file...\n')

  // Read the Excel file
  const excelPath = join(rootDir, 'data', 'steuerfuesse-np-1995-2025-de.xlsx')
  const fileBuffer = await readFile(excelPath)
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

  // Parse 2025 sheet
  const sheet2025 = workbook.Sheets['NP 2025']
  const data = XLSX.utils.sheet_to_json(sheet2025, { header: 1, defval: '' })

  console.log('🔍 Parsing NP 2025 sheet...\n')

  // Fixed structure based on file analysis:
  // Row 11: Headers with "Kantonssteuer 1)", "Gemeindesteuer 1)"
  // Row 14+: Data rows
  // Column 0: Canton capital city name
  // Column 1: Canton tax multiplier
  // Column 2: Municipal tax multiplier
  const headerRowIdx = 11
  const dataStartIdx = 14
  const cantonColIdx = 0
  const cantonTaxColIdx = 1
  const municipalTaxColIdx = 2

  console.log(`Using fixed column indices:`)
  console.log(`  Canton names: column ${cantonColIdx}`)
  console.log(`  Canton tax: column ${cantonTaxColIdx}`)
  console.log(`  Municipal tax: column ${municipalTaxColIdx}`)
  console.log(`  Data starts at row: ${dataStartIdx}`)
  console.log()

  // Extract data rows starting from dataStartIdx
  const cantonData = []
  let skipNextRows = 0

  for (let i = dataStartIdx; i < data.length; i++) {
    if (skipNextRows > 0) {
      skipNextRows--
      continue
    }

    const row = data[i]
    const cityName = String(row[cantonColIdx] || '').trim()

    // Skip empty rows, footnotes, or sub-rows (indented with spaces)
    if (!cityName || cityName.match(/^\d+\)/) || cityName.length < 3 || cityName.startsWith('    ')) {
      continue
    }

    let cantonTax = row[cantonTaxColIdx]
    let municipalTax = row[municipalTaxColIdx]

    // Handle special formatting
    // Geneva uses percentage format: "147.5%9)" -> convert to 1.475
    if (typeof cantonTax === 'string' && cantonTax.includes('%')) {
      const match = cantonTax.match(/(\d+\.?\d*)\s*%/)
      if (match) {
        cantonTax = parseFloat(match[1]) / 100
      }
    }
    if (typeof municipalTax === 'string' && municipalTax.includes('%')) {
      const match = municipalTax.match(/(\d+\.?\d*)\s*%/)
      if (match) {
        municipalTax = parseFloat(match[1]) / 100
      }
    }

    // Skip rows with footnote markers or invalid data
    const cantonTaxValid = typeof cantonTax === 'number'
    const municipalTaxValid = typeof municipalTax === 'number'

    // Special handling for cantons with sub-rows (Fribourg, Basel-Land)
    if (cityName === 'Fribourg' || cityName.includes('Liestal')) {
      // Use next row's data (Revenu/Einkommen)
      const nextRow = data[i + 1]
      if (nextRow) {
        cantonTax = nextRow[cantonTaxColIdx]
        municipalTax = nextRow[municipalTaxColIdx]
        skipNextRows = 1 // Skip the "Fortune/Vermögen" row too
      }
    }

    // Skip if we don't have at least one valid tax value
    if (!cantonTaxValid && !municipalTaxValid) {
      continue
    }

    // Try to match city to canton
    let cantonName = cityName
    let slug = null

    // Handle special cases where city != canton name
    if (cityName.includes('Altdorf')) {
      cantonName = 'Uri'
      slug = 'uri'
    } else if (cityName.includes('Sarnen')) {
      cantonName = 'Obwalden'
      slug = 'obwalden'
    } else if (cityName.includes('Stans')) {
      cantonName = 'Nidwalden'
      slug = 'nidwalden'
    } else if (cityName.includes('Herisau')) {
      cantonName = 'Appenzell Ausserrhoden'
      slug = 'appenzell_ausserrhoden'
    } else if (cityName.includes('Appenzell')) {
      cantonName = 'Appenzell Innerrhoden'
      slug = 'appenzell_innerrhoden'
    } else if (cityName.includes('Basel') && cityName.includes('BS')) {
      cantonName = 'Basel-Stadt'
      slug = 'basel_stadt'
    } else if (cityName.includes('Liestal')) {
      cantonName = 'Basel-Landschaft'
      slug = 'basel_land'
    } else if (cityName.includes('Chur')) {
      cantonName = 'Graubünden'
      slug = 'graubunden'
    } else if (cityName.includes('Aarau')) {
      cantonName = 'Aargau'
      slug = 'aargau'
    } else if (cityName.includes('Frauenfeld')) {
      cantonName = 'Thurgau'
      slug = 'thurgau'
    } else if (cityName.includes('Bellinzona')) {
      cantonName = 'Ticino'
      slug = 'ticino'
    } else if (cityName.includes('Lausanne')) {
      cantonName = 'Vaud'
      slug = 'vaud'
    } else if (cityName.includes('Sion') || cityName.includes('Sitten')) {
      cantonName = 'Valais'
      slug = 'valais'
    } else if (cityName.includes('Delémont')) {
      cantonName = 'Jura'
      slug = 'jura'
    } else if (cityName.includes('Glarus')) {
      cantonName = 'Glarus'
      slug = 'glarus'
    } else if (cityName === 'Fribourg') {
      cantonName = 'Fribourg'
      slug = 'fribourg'
    } else {
      // For other cities (Zürich, Bern, etc.), the city name is the canton name
      slug = CANTON_NAMES[cityName]
    }

    if (!slug) {
      slug = cantonName.toLowerCase().replace(/[^a-z]+/g, '_')
    }

    cantonData.push({
      canton: cantonName,
      slug: slug,
      capitalCity: cityName,
      cantonMultiplier: typeof cantonTax === 'number' ? cantonTax : null,
      municipalMultiplier: typeof municipalTax === 'number' ? municipalTax : null
    })
  }

  console.log(`✅ Extracted ${cantonData.length} cantons:\n`)

  cantonData.forEach(canton => {
    const cantonStr = canton.cantonMultiplier !== null ? canton.cantonMultiplier.toFixed(2) : 'N/A'
    const municipalStr = canton.municipalMultiplier !== null ? canton.municipalMultiplier.toFixed(2) : 'N/A'
    console.log(`  ${canton.canton.padEnd(25)} (${canton.slug.padEnd(25)}) - Canton: ${cantonStr.padStart(6)}, Municipal: ${municipalStr.padStart(6)} (${canton.capitalCity})`)
  })

  // Save to JSON
  const outputPath = join(rootDir, 'data', 'swiss-tax-multipliers-2025.json')
  await writeFile(outputPath, JSON.stringify(cantonData, null, 2), 'utf-8')

  console.log(`\n💾 Saved to ${outputPath}`)
  console.log('\n✅ Parse complete!')
}

parseSwissTaxData().catch((error) => {
  console.error('❌ Parse failed:', error)
  process.exit(1)
})
