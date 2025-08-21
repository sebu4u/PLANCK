const { createClient } = require('@supabase/supabase-js');

// Configurare Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabilele de mediu NEXT_PUBLIC_SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY sunt necesare');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function awardExistingBadges() {
  try {
    console.log('🚀 Acordare badge-uri pentru utilizatorii existenți...');
    
    // Obține toți utilizatorii cu probleme rezolvate
    const { data: usersWithProblems, error: usersError } = await supabase
      .from('solved_problems')
      .select('user_id')
      .order('user_id');
    
    if (usersError) {
      console.error('❌ Eroare la obținerea utilizatorilor:', usersError);
      return;
    }
    
    // Obține utilizatorii unici
    const uniqueUsers = [...new Set(usersWithProblems.map(u => u.user_id))];
    console.log(`📊 Găsiți ${uniqueUsers.length} utilizatori cu probleme rezolvate`);
    
    let awardedCount = 0;
    
    for (const userId of uniqueUsers) {
      try {
        // Verifică și acordă badge-uri pentru fiecare utilizator
        const { error } = await supabase.rpc('check_and_award_badges', {
          user_uuid: userId
        });
        
        if (error) {
          console.error(`❌ Eroare pentru utilizatorul ${userId}:`, error);
          continue;
        }
        
        awardedCount++;
        console.log(`✅ Badge-uri verificate pentru utilizatorul ${userId}`);
        
      } catch (error) {
        console.error(`❌ Eroare pentru utilizatorul ${userId}:`, error);
      }
    }
    
    console.log(`🎉 Proces finalizat! Badge-uri verificate pentru ${awardedCount} utilizatori`);
    
    // Afișează statistici
    const { data: badgeStats } = await supabase
      .from('user_badges')
      .select(`
        badge:badges (name, icon)
      `);
    
    if (badgeStats) {
      const badgeCounts = {};
      badgeStats.forEach(ub => {
        const badgeName = ub.badge.name;
        badgeCounts[badgeName] = (badgeCounts[badgeName] || 0) + 1;
      });
      
      console.log('\n📊 Statistici badge-uri:');
      Object.entries(badgeCounts).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} utilizatori`);
      });
    }
    
  } catch (error) {
    console.error('❌ Eroare generală:', error);
  }
}

if (require.main === module) {
  awardExistingBadges().catch(console.error);
}

module.exports = { awardExistingBadges };
