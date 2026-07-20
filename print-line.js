const fs = require('fs');
const readline = require('readline');

async function printLines() {
  const fileStream = fs.createReadStream('C:\\Users\\bhave\\.gemini\\antigravity\\brain\\2a64a675-c447-4204-9162-31903ec42260\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (index >= 1160 && index <= 1180) {
      console.log(`LINE ${index}:`, line);
    }
  }
}

printLines();
