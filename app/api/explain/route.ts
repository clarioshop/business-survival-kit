import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper: Get Groq API key
const getGroqApiKey = () => process.env.GROQ_API_KEY;

// All providers with their specific models
const providers = [
  // ========== GROQ MODELS (Different rate limits) ==========
  {
    name: 'groq-llama-8b',
    apiKey: process.env.GROQ_API_KEY,
    call: async (prompt: string) => {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content;
    }
  },
  {
    name: 'groq-llama-70b',
    apiKey: process.env.GROQ_API_KEY,
    call: async (prompt: string) => {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content;
    }
  },
  {
    name: 'groq-llama-scout',
    apiKey: process.env.GROQ_API_KEY,
    call: async (prompt: string) => {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: 'llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content;
    }
  },
  // ========== BACKUP PROVIDERS ==========
  {
    name: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    call: async (prompt: string) => {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  },
  {
    name: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    call: async (prompt: string) => {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      return data.choices[0]?.message?.content;
    }
  }
];

// Round-robin counter (starts at a random position to distribute load)
let currentIndex = Math.floor(Math.random() * providers.length);

export async function POST(request: NextRequest) {
  try {
    const { paragraph, question } = await request.json();
    
    if (!paragraph || !question) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 });
    }
    
    const prompt = `The student selected this text: "${paragraph.slice(0, 500)}". Their question: "${question}". Explain it simply using analogies. Keep it under 150 words. Be helpful and friendly.`;
    
    // Try each provider in order
    for (let attempt = 0; attempt < providers.length; attempt++) {
      const provider = providers[currentIndex];
      currentIndex = (currentIndex + 1) % providers.length;
      
      try {
        if (!provider.apiKey) {
          console.log(`${provider.name}: No API key, skipping`);
          continue;
        }
        
        console.log(`🔄 Trying ${provider.name}...`);
        const explanation = await provider.call(prompt);
        
        if (explanation) {
          console.log(`✅ ${provider.name} responded successfully`);
          return NextResponse.json({ explanation });
        }
      } catch (error: any) {
        console.log(`❌ ${provider.name} failed:`, error?.message || error);
        // Continue to next provider
      }
    }
    
    // All providers failed
    return NextResponse.json({ 
      explanation: "All AI services are currently busy. Please try again in a moment." 
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
