const fs = require('fs');

const raw = fs.readFileSync('scratch/excel_tables.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

console.log('Tables:', Object.keys(data));
for (const k of Object.keys(data)) {
  console.log(`\nTable ${k} (${data[k].length} items):`);
  console.log('Sample row:', JSON.stringify(data[k][0], null, 2));
}
