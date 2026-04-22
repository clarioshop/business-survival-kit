// app/api/explain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// ============================================
// ACCOUNT 1 & 2 API KEYS
// ============================================

const ACCOUNTS = [
    { name: 'account1', apiKey: process.env.GROQ_API_KEY_1 },
    { name: 'account2', apiKey: process.env.GROQ_API_KEY_2 }
].filter(acc => acc.apiKey);

// ============================================
// MODELS IN PRIORITY ORDER (Best to Worst)
// ============================================

const MODELS = [
    { name: 'llama-3.1-8b-instant', rpm: 30, rpd: 14400, priority: 1 },     // Highest daily limit
    { name: 'qwen/qwen3-32b', rpm: 60, rpd: 1000, priority: 2 },             // Highest RPM (60!)
    { name: 'allam-2-7b', rpm: 30, rpd: 7000, priority: 3 },                 // Good daily limit
    { name: 'llama-3.3-70b-versatile', rpm: 30, rpd: 1000, priority: 4 },    // Fallback
    { name: 'llama-4-scout-17b', rpm: 30, rpd: 1000, priority: 5 },          // Large token capacity
    { name: 'openai/gpt-oss-20b', rpm: 30, rpd: 1000, priority: 6 }          // Last resort
];

// ============================================
// ROUND-ROBIN COUNTERS
// ============================================

let currentAccountIndex = 0;
let currentModelIndex = 0;

// ============================================
// GET NEXT ACCOUNT (Rotates between accounts)
// ============================================

function getNextAccount() {
    const account = ACCOUNTS[currentAccountIndex % ACCOUNTS.length];
    currentAccountIndex++;
    return account;
}

// ============================================
// GET NEXT MODEL (Rotates through priority list)
// ============================================

function getNextModel() {
    const model = MODELS[currentModelIndex % MODELS.length];
    currentModelIndex++;
    return model;
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(request: NextRequest) {
    try {
        const { paragraph, question } = await request.json();
        
        if (!paragraph || !question) {
            return NextResponse.json({ error: 'Missing information' }, { status: 400 });
        }
        
        const prompt = `The student selected this text: "${paragraph.slice(0, 500)}". Their question: "${question}". Explain it simply using analogies. Keep it under 150 words. Be helpful and friendly.`;
        
        // Try all combinations: Accounts × Models
        const maxAttempts = ACCOUNTS.length * MODELS.length;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const account = getNextAccount();
            const model = getNextModel();
            
            if (!account.apiKey) {
                console.log(`⚠️ ${account.name}: No API key, skipping`);
                continue;
            }
            
            try {
                console.log(`🔄 Attempt ${attempt + 1}: ${account.name} / ${model.name}`);
                
                const groq = new Groq({ apiKey: account.apiKey });
                
                const response = await groq.chat.completions.create({
                    model: model.name,
                    messages: [
                        { role: 'system', content: 'You are a friendly AS Business tutor. Explain concepts simply using analogies. Keep responses under 150 words.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                });
                
                const explanation = response.choices[0]?.message?.content;
                
                if (explanation) {
                    console.log(`✅ SUCCESS: ${account.name} / ${model.name}`);
                    
                    // Optional: Return debug info (remove in production)
                    // return NextResponse.json({ 
                    //     explanation, 
                    //     _debug: { account: account.name, model: model.name } 
                    // });
                    
                    return NextResponse.json({ explanation });
                }
                
            } catch (error: any) {
                console.error(`❌ FAILED: ${account.name} / ${model.name} - ${error?.message || error}`);
                
                // Check if it's a rate limit error
                if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
                    console.log(`   ⏰ Rate limit hit for ${account.name}/${model.name}`);
                }
                // Continue to next combination
            }
        }
        
        // All combinations failed
        return NextResponse.json({ 
            explanation: "All AI services are currently busy. Please try again in a moment." 
        });
        
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
