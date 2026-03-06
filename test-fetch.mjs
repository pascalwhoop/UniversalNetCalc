const response = await fetch("http://localhost:3000/api/calc/progression", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    requests: [{
      id: "test",
      country: "de",
      year: "2025",
      gross_annual: 100000
    }],
    min_gross: 50000,
    max_gross: 50000,
    step_size: 10000
  })
});
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
