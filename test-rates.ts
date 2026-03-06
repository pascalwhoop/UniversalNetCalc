import { CalculationEngine, ConfigLoader } from "./packages/engine/src/index.js"
import { join } from "path"

const configLoader = new ConfigLoader(join(process.cwd(), "configs"))

async function main() {
  const config = await configLoader.loadConfig("de", "2025", "")
  const engine = new CalculationEngine(config)
  
  const req = { country: "de", year: "2025", gross_annual: 100000 }
  
  const result = engine.calculate(req)
  const marginal = engine.calculateMarginalRate(req)
  
  console.log(`Gross: 100000`);
  console.log(`Effective Rate: ${result.effective_rate}`);
  console.log(`Marginal Rate:`, marginal);
  
  // Let's test UK
  const configGb = await configLoader.loadConfig("gb", "2025", "")
  const engineGb = new CalculationEngine(configGb)
  
  const reqGb = { country: "gb", year: "2025", gross_annual: 100000 }
  const resultGb = engineGb.calculate(reqGb)
  const marginalGb = engineGb.calculateMarginalRate(reqGb)
  console.log(`UK Gross 100k, Eff: ${resultGb.effective_rate}, Marg: ${marginalGb}`);
}
main().catch(console.error)
