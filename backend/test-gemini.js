import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/home/sheikh-ishan/projects/ReWiseAI/backend/.env' });

async function test() {
  console.log("Config:", {
    key: process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING",
    model: process.env.GEMINI_MODEL
  });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    
    console.log("Sending request...");
    const result = await model.generateContent("Say 'hello world'");
    const text = result.response.text();
    console.log("Success! Response text:", text);
  } catch (error) {
    console.error("FULL ERROR OBJECT:", error);
    console.error("ERROR MESSAGE:", error.message);
  }
}

test();
