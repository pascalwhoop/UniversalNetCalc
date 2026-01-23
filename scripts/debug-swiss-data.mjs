#!/usr/bin/env node
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

async function debugSwissData() {
  const excelPath = join(rootDir, 'data', 'steuerfuesse-np-1995-2025-de.xlsx')
  const fileBuffer = await readFile(excelPath)
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

  const sheet2025 = workbook.Sheets['NP 2025']
  const data = XLSX.utils.sheet_to_json(sheet2025, { header: 1, defval: '' })

  console.log(`📊 All ${data.length} rows of NP 2025 sheet:\n`)

  for (let i = 0; i < data.length; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]))
  }
}

debugSwissData().catch(console.error)
