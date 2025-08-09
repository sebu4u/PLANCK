const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Configurare Supabase
const supabaseUrl = 'https://uasledcwtatuiycdfnqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhc2xlZGN3dGF0dWl5Y2RmbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MDI5MTYsImV4cCI6MjA2NDM3ODkxNn0.bbUOuY-tKXP6FkKLSYKovA1cvCrOhPfwAgHXrFWK8Dc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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