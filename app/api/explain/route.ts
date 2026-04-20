import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    const { paragraph, question } = await request.json();
    
    if (!paragraph || !question) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 });
    }
    
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a friendly AS Business tutor. Explain concepts simply using analogies. Keep responses under 150 words.' },
        { role: 'user', content: `The student selected this text: "${paragraph}". Their question: "${question}". Explain it simply.` }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const explanation = response.choices[0]?.message?.content || "I couldn't explain that. Please try again.";
    
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to get explanation' }, { status: 500 });
  }
}
