'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { PlanckCodeSidebar } from '@/components/planckcode-sidebar'
import { ProjectCard } from '@/components/project-card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, FolderOpen, FileCode, Crown } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Project } from '@/lib/types'
import { Toaster } from "@/components/ui/toaster"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"

const FREE_PLAN_PROJECT_LIMIT = 3

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const { isFree } = useSubscriptionPlan()

    const hasReachedLimit = isFree && projects.length >= FREE_PLAN_PROJECT_LIMIT
    const remainingProjects = FREE_PLAN_PROJECT_LIMIT - projects.length

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }
                setUserId(user.id)

                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })

                if (error) throw error
                setProjects(data || [])
            } catch (err) {
                console.error('Error fetching projects:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [])

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden flex flex-col">
            <Navigation />
            <PlanckCodeSidebar />

            <main className="flex-1 md:ml-16 pt-24 px-6 md:px-12 pb-16">
                <div className="max-w-7xl mx-auto space-y-8">

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold font-vt323 tracking-wide mb-2 flex items-center gap-3">
                                <FolderOpen className="w-8 h-8 text-green-500" />
                                My Projects
                            </h1>
                            <p className="text-gray-400 font-mono text-sm max-w-xl">
                                Manage your saved C++ code snippets and full projects. Continue exactly where you left off.
                            </p>
                            {isFree && !loading && userId && (
                                <p className="text-sm mt-2 text-gray-500">
                                    {hasReachedLimit ? (
                                        <span className="text-orange-400">
                                            Ai atins limita de {FREE_PLAN_PROJECT_LIMIT} proiecte pentru planul gratuit.
                                        </span>
                                    ) : (
                                        <span>
                                            {projects.length}/{FREE_PLAN_PROJECT_LIMIT} proiecte utilizate
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {hasReachedLimit ? (
                                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-6">
                                    <Link href="/pricing" className="flex items-center gap-2">
                                        <Crown className="w-4 h-4" />
                                        Upgrade to Plus
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild className="bg-green-600 hover:bg-green-700 text-white font-bold px-6">
                                    <Link href="/planckcode/ide" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        New Project
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Loading projects...</p>
                        </div>
                    ) : !userId ? (
                        <div className="bg-[#1e1e1e] border border-[#3b3b3b] rounded-xl p-8 text-center max-w-md mx-auto mt-10">
                            <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
                            <p className="text-gray-400 mb-6">You need to sign in to save and view your projects.</p>
                            <Button asChild variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10">
                                <Link href="/auth">Sign In</Link>
                            </Button>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="bg-[#1e1e1e] border border-[#3b3b3b] rounded-xl p-12 text-center max-w-lg mx-auto mt-10 space-y-4">
                            <div className="bg-[#2d2d2d] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                                <FileCode className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold">No projects yet</h3>
                            <p className="text-gray-400">
                                Start coding in the IDE and save your first project to see it here.
                            </p>
                            <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
                                <Link href="/planckcode/ide">Open IDE</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Toaster />
        </div>
    )
}

