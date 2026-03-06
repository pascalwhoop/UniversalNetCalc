import { CalculationEngine, ConfigLoader } from "./packages/engine/src/index.js"
import { join } from "path"

const configLoader = new ConfigLoader(join(process.cwd(), "configs"))

async function main() {
  const config = await configLoader.loadConfig("de", "2025", "")
  const engine = new CalculationEngine(config)
  
  const currentGross = 100000;
  for (let i = 0; i <= 10; i++) {
    const gross = currentGross * (0.7 + (i / 10) * 1.3);
    const result = engine.calculate({
      country: "de", year: "2025", gross_annual: gross
    });
    console.log(`Gross: ${gross}, Net: ${result.net}, Ratio: ${(result.net/gross).toFixed(4)}, Marginal: ${result.marginal_rate}`);
  }
}
main().catch(console.error)
