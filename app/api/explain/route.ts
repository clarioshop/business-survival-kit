import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// ============================================
// ACCOUNT 1 & 2 API KEYS (Set in Vercel Environment Variables)
// ============================================

const ACCOUNTS = [
    { name: 'account1', apiKey: process.env.GROQ_API_KEY_1 },
    { name: 'account2', apiKey: process.env.GROQ_API_KEY_2 }
].filter(acc => acc.apiKey);

// ============================================
// MODELS IN PRIORITY ORDER
// ============================================

const MODELS = [
    { name: 'llama-3.1-8b-instant', rpm: 30, rpd: 14400, priority: 1 },
    { name: 'qwen/qwen3-32b', rpm: 60, rpd: 1000, priority: 2 },
    { name: 'allam-2-7b', rpm: 30, rpd: 7000, priority: 3 },
    { name: 'llama-3.3-70b-versatile', rpm: 30, rpd: 1000, priority: 4 },
    { name: 'llama-4-scout-17b-16e-instruct', rpm: 30, rpd: 1000, priority: 5 }
];

// ============================================
// ROUND-ROBIN COUNTERS
// ============================================

let currentAccountIndex = 0;
let currentModelIndex = 0;

// ============================================
// HELPER: Promise with timeout
// ============================================

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

// ============================================
// GET NEXT ACCOUNT
// ============================================

function getNextAccount() {
    if (ACCOUNTS.length === 0) return null;
    const account = ACCOUNTS[currentAccountIndex % ACCOUNTS.length];
    currentAccountIndex++;
    return account;
}

// ============================================
// GET NEXT MODEL
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
    const startTime = Date.now();
    
    try {
        const { paragraph, question } = await request.json();
        
        if (!paragraph || !question) {
            return NextResponse.json({ error: 'Missing information' }, { status: 400 });
        }
        
        const prompt = `The student selected this text: "${paragraph.slice(0, 500)}". Their question: "${question}". Explain it simply using analogies. Keep it under 150 words. Be helpful and friendly.`;
        
        // If no API keys configured
        if (ACCOUNTS.length === 0) {
            console.error('No Groq API keys configured');
            return NextResponse.json({ 
                explanation: "AI service is not configured. Please contact support." 
            });
        }
        
        // Try all combinations: Accounts × Models
        const maxAttempts = ACCOUNTS.length * MODELS.length;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const account = getNextAccount();
            const model = getNextModel();
            
            if (!account || !account.apiKey) {
                console.log(`⚠️ No valid API key for attempt ${attempt + 1}`);
                continue;
            }
            
            try {
                console.log(`🔄 Attempt ${attempt + 1}: ${account.name} / ${model.name}`);
                
                const groq = new Groq({ apiKey: account.apiKey });
                
                // Make API call with 8 second timeout
                const response = await withTimeout(
                    groq.chat.completions.create({
                        model: model.name,
                        messages: [
                            { 
                                role: 'system', 
                                content: 'You are a friendly AS Business tutor. Explain concepts simply using analogies. Keep responses under 150 words. Be warm and helpful.' 
                            },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 500,
                        temperature: 0.7,
                    }),
                    8000
                );
                
                const explanation = response.choices[0]?.message?.content;
                
                if (explanation) {
                    const elapsed = Date.now() - startTime;
                    console.log(`✅ SUCCESS: ${account.name} / ${model.name} (${elapsed}ms)`);
                    return NextResponse.json({ explanation });
                }
                
            } catch (error: any) {
                const elapsed = Date.now() - startTime;
                const errorMessage = error?.message || String(error);
                
                if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                    console.log(`⏰ RATE LIMIT: ${account.name} / ${model.name} - ${elapsed}ms`);
                } else if (errorMessage.includes('Timeout')) {
                    console.log(`⏱️ TIMEOUT: ${account.name} / ${model.name} - ${elapsed}ms`);
                } else {
                    console.log(`❌ FAILED: ${account.name} / ${model.name} - ${errorMessage.slice(0, 100)}`);
                }
                // Continue to next combination
            }
        }
        
        // All combinations failed
        const elapsed = Date.now() - startTime;
        console.log(`💀 All providers failed after ${elapsed}ms`);
        
        return NextResponse.json({ 
            explanation: "All AI services are currently busy. Please try again in a moment." 
        });
        
    } catch (error: any) {
        console.error('API error:', error?.message || error);
        return NextResponse.json({ 
            error: 'Failed to process request' 
        }, { status: 500 });
    }
}
