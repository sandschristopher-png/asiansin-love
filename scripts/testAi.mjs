import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in environment or .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Respond with: "Gemini Vision connection verified for asiansin.love"',
    });
    console.log("✅ Success:", response.text);
  } catch (err) {
    console.error("❌ API Error:", err.message);
  }
}

run();
