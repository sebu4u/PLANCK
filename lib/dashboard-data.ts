import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with access token
function createAuthenticatedClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

// ============================================
// User Stats & Rank
// ============================================

export interface UserStats {
  elo: number
  rank: string
  current_streak: number
  best_streak: number
  total_time_minutes: number
  problems_solved_today: number
  problems_solved_total: number
  last_activity_date: string | null
}

export async function getUserStats(userId: string, accessToken: string): Promise<UserStats> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user stats:', error)
      // Return placeholder data
      return {
        elo: 520,
        rank: 'Bronze II',
        current_streak: 4,
        best_streak: 7,
        total_time_minutes: 12,
        problems_solved_today: 0,
        problems_solved_total: 0,
        last_activity_date: null,
      }
    }

    return data as UserStats
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return {
      elo: 520,
      rank: 'Bronze II',
      current_streak: 4,
      best_streak: 7,
      total_time_minutes: 12,
      problems_solved_today: 0,
      problems_solved_total: 0,
      last_activity_date: null,
    }
  }
}

export function getNextRankThreshold(currentElo: number): { nextRank: string; threshold: number; progress: number } {
  // 19 tiers total matching SQL function get_rank_from_elo
  // Distribuție progresivă: mai ușor în Bronze/Silver/Gold, din ce în ce mai greu
  const ranks = [
    { name: 'Bronze III', threshold: 500 },
    { name: 'Bronze II', threshold: 833 },
    { name: 'Bronze I', threshold: 1166 },
    { name: 'Silver III', threshold: 1500 },
    { name: 'Silver II', threshold: 2000 },
    { name: 'Silver I', threshold: 2500 },
    { name: 'Gold III', threshold: 3000 },
    { name: 'Gold II', threshold: 3667 },
    { name: 'Gold I', threshold: 4334 },
    { name: 'Platinum III', threshold: 5000 },
    { name: 'Platinum II', threshold: 5833 },
    { name: 'Platinum I', threshold: 6666 },
    { name: 'Diamond III', threshold: 7500 },
    { name: 'Diamond II', threshold: 8667 },
    { name: 'Diamond I', threshold: 9834 },
    { name: 'Masters III', threshold: 11000 },
    { name: 'Masters II', threshold: 12333 },
    { name: 'Masters I', threshold: 13666 },
    { name: 'Ascendant', threshold: 15000 },
    { name: 'Singularity', threshold: 16500 },
  ]

  const nextRank = ranks.find(r => r.threshold > currentElo)
  if (!nextRank) {
    return { nextRank: 'Singularity', threshold: 16500, progress: 100 }
  }

  const currentRank = ranks.filter(r => r.threshold <= currentElo).pop()
  const currentThreshold = currentRank?.threshold || 500
  const rangeSize = nextRank.threshold - currentThreshold
  const progress = rangeSize > 0 ? ((currentElo - currentThreshold) / rangeSize) * 100 : 0

  return {
    nextRank: nextRank.name,
    threshold: nextRank.threshold,
    progress: Math.min(100, Math.max(0, progress)),
  }
}

// ============================================
// Daily Activity Heatmap
// ============================================

export interface DailyActivity {
  activity_date: string
  problems_solved: number
  time_minutes: number
  activity_level: number
}

export async function getDailyActivity(userId: string, accessToken: string): Promise<DailyActivity[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    // Get last 365 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 365)

    const { data, error } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', startDate.toISOString().split('T')[0])
      .lte('activity_date', endDate.toISOString().split('T')[0])
      .order('activity_date', { ascending: true })

    if (error) {
      console.error('Error fetching daily activity:', error)
      return generatePlaceholderActivity()
    }

    return data as DailyActivity[]
  } catch (error) {
    console.error('Error in getDailyActivity:', error)
    return generatePlaceholderActivity()
  }
}

function generatePlaceholderActivity(): DailyActivity[] {
  const activities: DailyActivity[] = []
  const today = new Date()

  // Generate sparse activity for last 365 days
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Randomly add activity (20% chance)
    if (Math.random() < 0.2) {
      const level = Math.floor(Math.random() * 4) + 1
      activities.push({
        activity_date: date.toISOString().split('T')[0],
        problems_solved: level,
        time_minutes: level * 15,
        activity_level: level,
      })
    }
  }

  return activities.reverse()
}

// ============================================
// Daily Challenge
// ============================================

export interface DailyChallenge {
  id: string
  title: string
  description: string
  difficulty: string
  bonus_elo: number
  expires_at: string
  is_completed: boolean
  problem_id?: string
  problem_class?: string | null
  problem_difficulty?: string | null
}

export async function getDailyChallenge(userId: string, accessToken: string): Promise<DailyChallenge | null> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const today = new Date().toISOString().split('T')[0]

    // Ensure there is a challenge for today (random problem)
    await supabase.rpc('ensure_daily_challenge_for_today')

    // Get today's challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('active_date', today)
      .single()

    if (challengeError || !challenge) {
      console.error('Error fetching daily challenge:', challengeError)
      return {
        id: 'placeholder',
        title: 'Rezolvă problema de cinematică',
        description: 'O problemă clasică de mișcare rectilinie uniform variată. Testează-ți cunoștințele!',
        difficulty: 'Medium',
        bonus_elo: 10,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_completed: false,
      }
    }

    // Load problem details
    const { data: problem } = await supabase
      .from('problems')
      .select('id, class, difficulty, statement, title')
      .eq('id', challenge.problem_id)
      .single()

    // Check if user completed challenge explicitly
    const { data: userChallenge } = await supabase
      .from('user_challenges')
      .select('completed')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .single()

    // Also consider it "completed" if the user already solved this problem in the past
    const { data: solved } = await supabase
      .from('solved_problems')
      .select('id')
      .eq('user_id', userId)
      .eq('problem_id', challenge.problem_id)
      .maybeSingle()

    const isCompleted = userChallenge?.completed || !!solved

    const classLabel =
      problem?.class != null
        ? `Clasa a ${problem.class}-a`
        : null

    const baseText = (problem?.statement || problem?.title || challenge.description || '').trim()
    const snippet = baseText.length > 140 ? `${baseText.slice(0, 140)}…` : baseText

    return {
      id: challenge.id,
      title: `Problema ${problem?.id || challenge.problem_id}`,
      description: snippet,
      difficulty: challenge.difficulty,
      bonus_elo: challenge.bonus_elo,
      expires_at: challenge.expires_at,
      is_completed: isCompleted,
      problem_id: problem?.id || challenge.problem_id,
      problem_class: classLabel,
      problem_difficulty: problem?.difficulty || null,
    }
  } catch (error) {
    console.error('Error in getDailyChallenge:', error)
    return {
      id: 'placeholder',
      title: 'Rezolvă problema de cinematică',
      description: 'O problemă clasică de mișcare rectilinie uniform variată. Testează-ți cunoștințele!',
      difficulty: 'Medium',
      bonus_elo: 10,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
    }
  }
}

// ============================================
// Learning Roadmap
// ============================================

export interface RoadmapStep {
  id: string
  step_number: number
  title: string
  description: string
  category: string
  total_items: number
  completed_items: number
  is_locked: boolean
  is_completed: boolean
}

export async function getUserRoadmap(userId: string, accessToken: string): Promise<RoadmapStep[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data: roadmapSteps, error } = await supabase
      .from('learning_roadmap')
      .select('*')
      .eq('user_id', userId)
      .order('step_number', { ascending: true })

    if (error || !roadmapSteps || roadmapSteps.length === 0) {
      console.error('Error fetching roadmap:', error)
      return generatePlaceholderRoadmap()
    }

    // Get progress for each step
    const stepsWithProgress = await Promise.all(
      roadmapSteps.map(async (step) => {
        const { data: progress } = await supabase
          .from('user_roadmap_progress')
          .select('completed_items, is_completed')
          .eq('user_id', userId)
          .eq('roadmap_id', step.id)
          .single()

        return {
          id: step.id,
          step_number: step.step_number,
          title: step.title,
          description: step.description,
          category: step.category,
          total_items: step.total_items,
          completed_items: progress?.completed_items || 0,
          is_locked: step.is_locked,
          is_completed: progress?.is_completed || false,
        }
      })
    )

    return stepsWithProgress
  } catch (error) {
    console.error('Error in getUserRoadmap:', error)
    return generatePlaceholderRoadmap()
  }
}

function generatePlaceholderRoadmap(): RoadmapStep[] {
  return [
    {
      id: '1',
      step_number: 1,
      title: 'Bazele Mecanicii',
      description: 'Începe cu conceptele fundamentale',
      category: 'Mecanică',
      total_items: 10,
      completed_items: 3,
      is_locked: false,
      is_completed: false,
    },
    {
      id: '2',
      step_number: 2,
      title: 'Cinematica',
      description: 'Studiază mișcarea corpurilor',
      category: 'Mecanică',
      total_items: 15,
      completed_items: 0,
      is_locked: false,
      is_completed: false,
    },
    {
      id: '3',
      step_number: 3,
      title: 'Dinamica',
      description: 'Înțelege forțele și legile lui Newton',
      category: 'Mecanică',
      total_items: 12,
      completed_items: 0,
      is_locked: true,
      is_completed: false,
    },
    {
      id: '4',
      step_number: 4,
      title: 'Termodinamica',
      description: 'Explorează energia termică',
      category: 'Termodinamică',
      total_items: 20,
      completed_items: 0,
      is_locked: true,
      is_completed: false,
    },
    {
      id: '5',
      step_number: 5,
      title: 'Electrostatica',
      description: 'Descoperă fenomenele electrice',
      category: 'Electricitate',
      total_items: 18,
      completed_items: 0,
      is_locked: true,
      is_completed: false,
    },
  ]
}

// ============================================
// Recommendations
// ============================================

export interface Recommendation {
  id: string
  type: 'lesson' | 'problem' | 'course' | 'topic'
  title: string
  description: string
  target_url: string
  reason: string | null
  priority: number
}

export async function getRecommendations(userId: string, accessToken: string): Promise<Recommendation[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(3)

    if (error || !data || data.length === 0) {
      console.error('Error fetching recommendations:', error)
      return generatePlaceholderRecommendations()
    }

    return data as Recommendation[]
  } catch (error) {
    console.error('Error in getRecommendations:', error)
    return generatePlaceholderRecommendations()
  }
}

function generatePlaceholderRecommendations(): Recommendation[] {
  return [
    {
      id: '1',
      type: 'lesson',
      title: 'Lecția 10.2 – Legea gazelor',
      description: 'Continuă cu teoria gazelor perfecte și ecuația de stare',
      target_url: '/cursuri/fizica/lectia-10-2',
      reason: 'Bazat pe progresul tău recent',
      priority: 1,
    },
    {
      id: '2',
      type: 'problem',
      title: 'Problema #154 – Presiunea în lichide',
      description: 'Practică calculele de presiune hidrostatică',
      target_url: '/probleme/154',
      reason: 'Potrivit pentru nivelul tău actual',
      priority: 2,
    },
  ]
}

// ============================================
// Recent Sketches
// ============================================

export interface RecentSketch {
  id: string
  name: string
  updated_at: string
  thumbnail_url?: string
}

export async function getRecentSketches(userId: string, accessToken: string): Promise<RecentSketch[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(3)

    if (error || !data || data.length === 0) {
      console.error('Error fetching recent sketches:', error)
      return [
        {
          id: 'placeholder-1',
          name: 'lectia_10.sketch',
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
      ]
    }

    return data as RecentSketch[]
  } catch (error) {
    console.error('Error in getRecentSketches:', error)
    return [
      {
        id: 'placeholder-1',
        name: 'lectia_10.sketch',
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }
}

// ============================================
// Continue Learning
// ============================================

export interface ContinueLearningItem {
  type: 'lesson' | 'problem' | 'sketch'
  title: string
  description: string
  url: string
}

export async function getContinueLearning(userId: string, accessToken: string): Promise<ContinueLearningItem[]> {
  // For now, return placeholder data
  // In production, this would fetch from user activity/progress tables
  return [
    {
      type: 'lesson',
      title: 'Lecția 10.2 – Legea gazelor',
      description: 'Continuă de unde ai rămas',
      url: '/cursuri/fizica/lectia-10-2',
    },
    {
      type: 'problem',
      title: 'Problema #154 – Presiunea în lichide',
      description: 'În progres - 50% completat',
      url: '/probleme/154',
    },
    {
      type: 'sketch',
      title: 'lectia_10.sketch',
      description: 'Ultima ta schiță',
      url: '/sketch/boards',
    },
  ]
}

// ============================================
// Achievements
// ============================================

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earned_at: string
}

export async function getUserAchievements(userId: string, accessToken: string): Promise<Achievement[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        earned_at,
        badges:badge_id (
          name,
          description,
          icon,
          color
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(5)

    if (error || !data || data.length === 0) {
      console.error('Error fetching achievements:', error)
      return [
        {
          id: '1',
          name: 'First 10 problems solved',
          description: 'Ai rezolvat primele 10 probleme',
          icon: '⭐',
          color: 'bg-yellow-500',
          earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: '3-day streak badge',
          description: 'Ai menținut un streak de 3 zile',
          icon: '🔥',
          color: 'bg-orange-500',
          earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          name: 'Mechanics mastered',
          description: 'Ai completat secțiunea de mecanică',
          icon: '🎯',
          color: 'bg-blue-500',
          earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.badges.name,
      description: item.badges.description,
      icon: item.badges.icon,
      color: item.badges.color,
      earned_at: item.earned_at,
    }))
  } catch (error) {
    console.error('Error in getUserAchievements:', error)
    return [
      {
        id: '1',
        name: 'First 10 problems solved',
        description: 'Ai rezolvat primele 10 probleme',
        icon: '⭐',
        color: 'bg-yellow-500',
        earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        name: '3-day streak badge',
        description: 'Ai menținut un streak de 3 zile',
        icon: '🔥',
        color: 'bg-orange-500',
        earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'Mechanics mastered',
        description: 'Ai completat secțiunea de mecanică',
        icon: '🎯',
        color: 'bg-blue-500',
        earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }
}

// ============================================
// Learning Insights
// ============================================

export interface LearningInsights {
  total_time_minutes: number
  problems_solved_week: number
  average_difficulty: number
  weekly_activity: number[]
}

export async function getLearningInsights(userId: string, accessToken: string): Promise<LearningInsights> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    // Get stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('total_time_minutes')
      .eq('user_id', userId)
      .single()

    // Get weekly activity
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: weeklyActivity } = await supabase
      .from('daily_activity')
      .select('problems_solved, activity_date')
      .eq('user_id', userId)
      .gte('activity_date', weekAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: true })

    const problemsThisWeek = weeklyActivity?.reduce((sum, day) => sum + day.problems_solved, 0) || 0
    const activityData = weeklyActivity?.map(day => day.problems_solved) || [0, 1, 2, 1, 3, 2, 1]

    // Calculate average difficulty from solved problems
    // Get all solved problems for this user
    const { data: solvedProblems } = await supabase
      .from('solved_problems')
      .select('problem_id')
      .eq('user_id', userId)

    let averageDifficulty = 2.3 // Default
    if (solvedProblems && solvedProblems.length > 0) {
      const problemIds = solvedProblems.map(sp => sp.problem_id)
      
      // Get difficulties for solved problems
      const { data: problems } = await supabase
        .from('problems')
        .select('difficulty')
        .in('id', problemIds)

      if (problems && problems.length > 0) {
        // Map difficulty to number: Ușor=1, Mediu=2, Avansat=3
        const difficultyMap: Record<string, number> = {
          'Ușor': 1,
          'Mediu': 2,
          'Avansat': 3,
        }
        
        const difficulties = problems
          .map(p => difficultyMap[p.difficulty] || 2)
          .filter(d => d !== undefined)
        
        if (difficulties.length > 0) {
          averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
        }
      }
    }

    return {
      total_time_minutes: stats?.total_time_minutes || 12,
      problems_solved_week: problemsThisWeek,
      average_difficulty: averageDifficulty,
      weekly_activity: activityData,
    }
  } catch (error) {
    console.error('Error in getLearningInsights:', error)
    return {
      total_time_minutes: 12,
      problems_solved_week: 8,
      average_difficulty: 2.3,
      weekly_activity: [0, 1, 2, 1, 3, 2, 1],
    }
  }
}

// ============================================
// User Tasks
// ============================================

export interface UserTask {
  id: string
  task_type: string
  task_description: string
  is_completed: boolean
}

export async function getUserTasks(userId: string, accessToken: string): Promise<UserTask[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', today)

    if (error || !data || data.length === 0) {
      console.error('Error fetching user tasks:', error)
      return [
        { id: '1', task_type: 'solve_problem', task_description: 'Rezolvă 1 problemă', is_completed: false },
        { id: '2', task_type: 'learn_minutes', task_description: 'Învață 10 minute', is_completed: false },
        { id: '3', task_type: 'open_sketch', task_description: 'Deschide Sketch', is_completed: false },
      ]
    }

    return data as UserTask[]
  } catch (error) {
    console.error('Error in getUserTasks:', error)
    return [
      { id: '1', task_type: 'solve_problem', task_description: 'Rezolvă 1 problemă', is_completed: false },
      { id: '2', task_type: 'learn_minutes', task_description: 'Învață 10 minute', is_completed: false },
      { id: '3', task_type: 'open_sketch', task_description: 'Deschide Sketch', is_completed: false },
    ]
  }
}

// ============================================
// Dashboard Updates
// ============================================

export interface DashboardUpdate {
  id: string
  title: string
  description: string | null
  type: string
}

export async function getDashboardUpdates(accessToken: string): Promise<DashboardUpdate[]> {
  const supabase = createAuthenticatedClient(accessToken)

  try {
    const { data, error } = await supabase
      .from('dashboard_updates')
      .select('*')
      .eq('is_global', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error || !data || data.length === 0) {
      console.error('Error fetching dashboard updates:', error)
      return [
        { id: '1', title: 'New challenge available', description: null, type: 'challenge' },
        { id: '2', title: 'New lesson: Termodinamica 11.1', description: null, type: 'lesson' },
        { id: '3', title: 'Leaderboard refreshed', description: null, type: 'leaderboard' },
      ]
    }

    return data as DashboardUpdate[]
  } catch (error) {
    console.error('Error in getDashboardUpdates:', error)
    return [
      { id: '1', title: 'New challenge available', description: null, type: 'challenge' },
      { id: '2', title: 'New lesson: Termodinamica 11.1', description: null, type: 'lesson' },
      { id: '3', title: 'Leaderboard refreshed', description: null, type: 'leaderboard' },
    ]
  }
}

// ============================================
// Helper: Format relative time
// ============================================

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'acum'
  if (diffInSeconds < 3600) return `acum ${Math.floor(diffInSeconds / 60)} minute`
  if (diffInSeconds < 86400) return `acum ${Math.floor(diffInSeconds / 3600)} ore`
  if (diffInSeconds < 604800) return `acum ${Math.floor(diffInSeconds / 86400)} zile`
  return date.toLocaleDateString('ro-RO')
}

// ============================================
// Helper: Format duration
// ============================================

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

