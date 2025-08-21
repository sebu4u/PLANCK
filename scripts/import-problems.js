const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env from .env.local if present, otherwise fall back to default .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

// Configurare Supabase din variabile de mediu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const csvPath = path.join(__dirname, '../data/problems-to-import.csv');

async function importProblems() {
  const problems = [];
  const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true, trim: true }));

  for await (const record of parser) {
    // Validare minimă
    if (!record.id || !record.title || !record.statement || !record.difficulty || !record.category || !record.youtube_url) {
      console.warn('Rând ignorat (lipsesc câmpuri obligatorii):', record);
      continue;
    }
    problems.push(record);
  }

  console.log(`Import ${problems.length} probleme în Supabase...`);
  for (const problem of problems) {
    const { error } = await supabase.from('problems').insert([
      {
        id: problem.id,
        title: problem.title,
        description: problem.description || '',
        statement: problem.statement,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: problem.tags ? problem.tags.split(',').map(t => t.trim()) : [],
        youtube_url: problem.youtube_url,
        created_at: problem.created_at || null,
      },
    ]);
    if (error) {
      console.error('Eroare la import:', error.message, problem);
    } else {
      console.log('Importat:', problem.title);
    }
  }
  console.log('Import finalizat!');
}

importProblems().catch((err) => {
  console.error('Eroare la import:', err);
  process.exit(1);
}); 