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
    if (line.toLowerCase().includes('google_calendar_private_key') || line.toLowerCase().includes('calendar-bot')) {
      // Print first 300 chars of the match
      console.log(`Line ${index}: ${line.substring(0, 300)}...`);
    }
  }
}

search();
