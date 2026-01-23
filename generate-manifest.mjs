import { readdir } from 'fs/promises'
import { join } from 'path'
import { writeFile } from 'fs/promises'

async function generateManifest() {
  const configsPath = 'configs'
  const manifest = {
    countries: {}
  }

  const countries = await readdir(configsPath, { withFileTypes: true })

  for (const countryEntry of countries) {
    if (!countryEntry.isDirectory()) continue

    const country = countryEntry.name
    const countryPath = join(configsPath, country)
    const years = await readdir(countryPath, { withFileTypes: true })

    manifest.countries[country] = {
      years: {}
    }

    for (const yearEntry of years) {
      if (!yearEntry.isDirectory()) continue

      const year = yearEntry.name
      const yearPath = join(countryPath, year)

      manifest.countries[country].years[year] = {
        variants: []
      }

      // Check for variants
      const variantsPath = join(yearPath, 'variants')
      try {
        const variantFiles = await readdir(variantsPath)
        manifest.countries[country].years[year].variants = variantFiles
          .filter(f => f.endsWith('.yaml'))
          .map(f => f.replace('.yaml', ''))
      } catch {
        // No variants directory
      }
    }
  }

  await writeFile('configs-manifest.json', JSON.stringify(manifest, null, 2))
  console.log('Manifest generated successfully!')
}

generateManifest().catch(console.error)
