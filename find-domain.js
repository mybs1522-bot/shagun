const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\bhave\\.gemini\\antigravity\\brain\\2a64a675-c447-4204-9162-31903ec42260\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    const lower = line.toLowerCase();
    if (lower.includes('http') || lower.includes('.app') || lower.includes('.com') || lower.includes('.in') || lower.includes('.co')) {
      // Find URLs in line
      const urls = line.match(/https?:\/\/[^\s"']+/g);
      if (urls) {
        console.log(`Line ${index}:`, urls);
      }
    }
  }
}

search();
