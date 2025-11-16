// check-models.ts
// Utility script to check available OpenAI models

import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function checkModels() {
  console.log('🔍 Checking available OpenAI models...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in .env file');
    process.exit(1);
  }

  try {
    const models = await client.models.list();
    const gptModels = models.data
      .filter((m) => m.id.includes('gpt') || m.id.includes('o1'))
      .map((m) => m.id)
      .sort();

    console.log('📋 Available GPT/O1 models:\n');

    gptModels.forEach((m) => {
      if (m.includes('5.1-instant')) {
        console.log(`  ✅ ${m} ← RECOMMENDED for news agent`);
      } else if (m.includes('5.1-thinking')) {
        console.log(`  🧠 ${m} (complex reasoning, slower)`);
      } else if (m.includes('5.1')) {
        console.log(`  ✅ ${m} ← Good for news agent`);
      } else if (m.includes('4o')) {
        console.log(`  📌 ${m} (legacy, still good)`);
      } else if (m.includes('o1')) {
        console.log(`  💰 ${m} (expensive reasoning model)`);
      } else {
        console.log(`  📄 ${m}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATION FOR NEWS AGENT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (gptModels.some((m) => m.includes('5.1-instant'))) {
      const model = gptModels.find((m) => m.includes('5.1-instant'));
      console.log(`✅ Use: ${model}`);
      console.log('   → Fastest, least hallucinations, best for news\n');
    } else if (gptModels.some((m) => m.includes('5.1'))) {
      const model = gptModels.find((m) => m.includes('5.1'));
      console.log(`✅ Use: ${model}`);
      console.log('   → Latest model, good quality\n');
    } else if (gptModels.some((m) => m.includes('4o'))) {
      console.log('⚠️  GPT-5.1 not yet available in API');
      console.log('✅ Use: gpt-4o (still very good)\n');
    } else {
      console.log('⚠️  No suitable models found');
    }

    console.log('Update your .env file:');
    console.log('   OPENAI_MODEL=gpt-5.1-instant\n');
  } catch (err: any) {
    console.error('❌ Error fetching models:', err.message);
    if (err.status === 401) {
      console.error('   → Invalid OPENAI_API_KEY');
    }
    process.exit(1);
  }
}

checkModels();

