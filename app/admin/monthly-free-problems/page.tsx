"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, Trash2, Search, Loader2, AlertCircle } from "lucide-react"
import { currentMonthKey } from "@/lib/monthly-free-rotation"
import { Navigation } from "@/components/navigation"

interface Problem {
  id: string
  title: string
  difficulty: string
  category: string
  class?: number
}

export default function AdminMonthlyFreeProblemsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState("Toate")
  const [category, setCategory] = useState("Toate")
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  // Verifică dacă utilizatorul este admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return

      if (!user) {
        router.push("/login")
        return
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          router.push("/login")
          return
        }

        // Verifică dacă este admin prin API
        const response = await fetch("/api/admin/problems", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.status === 403) {
          setError("Acces interzis. Doar adminii pot accesa această pagină.")
          setIsAdmin(false)
        } else if (response.ok) {
          setIsAdmin(true)
        } else {
          setError("Eroare la verificarea permisiunilor.")
          setIsAdmin(false)
        }
      } catch (err) {
        console.error("Failed to check admin status:", err)
        setError("Eroare la verificarea permisiunilor.")
        setIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [user, authLoading, router])

  // Încarcă problemele disponibile
  useEffect(() => {
    if (!isAdmin || checkingAdmin) return

    const loadProblems = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) return

        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (difficulty !== "Toate") params.set("difficulty", difficulty)
        if (category !== "Toate") params.set("category", category)

        const response = await fetch(`/api/admin/problems?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Nu am putut încărca problemele.")
        }

        const data = await response.json()
        setProblems(data.problems || [])
      } catch (err) {
        console.error("Failed to load problems:", err)
        setError(err instanceof Error ? err.message : "Eroare la încărcarea problemelor.")
      } finally {
        setLoading(false)
      }
    }

    loadProblems()
  }, [isAdmin, checkingAdmin, search, difficulty, category])

  // Încarcă selecțiile existente pentru luna curentă
  useEffect(() => {
    if (!isAdmin || checkingAdmin) return

    const loadSelections = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) return

        const response = await fetch(`/api/admin/monthly-free-problems?month_key=${monthKey}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSelectedProblems(new Set(data.problem_ids || []))
        }
      } catch (err) {
        console.error("Failed to load selections:", err)
      }
    }

    loadSelections()
  }, [isAdmin, checkingAdmin, monthKey])

  const handleToggleProblem = (problemId: string) => {
    const newSelected = new Set(selectedProblems)
    if (newSelected.has(problemId)) {
      newSelected.delete(problemId)
    } else {
      if (newSelected.size >= 50) {
        setError("Nu poți selecta mai mult de 50 de probleme.")
        return
      }
      newSelected.add(problemId)
    }
    setSelectedProblems(newSelected)
    setError(null)
  }

  const handleSave = async () => {
    if (selectedProblems.size === 0) {
      setError("Selectează cel puțin o problemă.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error("Sesiune expirată.")
      }

      const response = await fetch("/api/admin/monthly-free-problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          month_key: monthKey,
          problem_ids: Array.from(selectedProblems),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut salva selecțiile.")
      }

      setError(null)
      alert(`Succes! ${selectedProblems.size} probleme au fost selectate pentru ${monthKey}.`)
    } catch (err) {
      console.error("Failed to save selections:", err)
      setError(err instanceof Error ? err.message : "Eroare la salvarea selecțiilor.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Ești sigur că vrei să ștergi selecțiile pentru această lună? Sistemul va folosi algoritmul automat.")) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error("Sesiune expirată.")
      }

      const response = await fetch(`/api/admin/monthly-free-problems?month_key=${monthKey}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut șterge selecțiile.")
      }

      setSelectedProblems(new Set())
      setError(null)
      alert("Selecțiile au fost șterse. Sistemul va folosi algoritmul automat.")
    } catch (err) {
      console.error("Failed to delete selections:", err)
      setError(err instanceof Error ? err.message : "Eroare la ștergerea selecțiilor.")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold text-white mb-2">Acces interzis</h2>
            <p className="text-gray-400 mb-6">{error || "Doar adminii pot accesa această pagină."}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Înapoi la pagina principală
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const filteredProblems = problems.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (difficulty !== "Toate" && p.difficulty !== difficulty) {
      return false
    }
    if (category !== "Toate" && p.category && !p.category.toLowerCase().includes(category.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administrare - Probleme Gratuite Lunare</h1>
          <p className="text-gray-400">
            Selectează cele 50 de probleme care vor fi gratuite pentru luna {monthKey}
          </p>
        </div>

        {/* Selector lună */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <label className="block text-sm font-medium mb-2">Lună:</label>
          <Input
            type="text"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            placeholder="YYYY-MM"
            className="max-w-xs bg-white/10 border-white/20 text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM (ex: 2024-12)</p>
        </div>

        {/* Filtre */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Căutare:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Caută probleme..."
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dificultate:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 text-white"
              >
                <option value="Toate">Toate</option>
                <option value="Ușor">Ușor</option>
                <option value="Mediu">Mediu</option>
                <option value="Avansat">Avansat</option>
                <option value="Concurs">Concurs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categorie:</label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filtrează după categorie..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </div>

        {/* Statistici */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Probleme selectate:</p>
              <p className="text-2xl font-bold text-green-400">{selectedProblems.size} / 50</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || selectedProblems.size === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvează...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvează selecțiile
                  </>
                )}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={saving || selectedProblems.size === 0}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Șterge selecțiile
              </Button>
            </div>
          </div>
        </div>

        {/* Eroare */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Lista probleme */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProblems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Nu s-au găsit probleme care să corespundă filtrelor.
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  className={`p-4 rounded-lg border ${
                    selectedProblems.has(problem.id)
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  } transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedProblems.has(problem.id)}
                      onCheckedChange={() => handleToggleProblem(problem.id)}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{problem.title}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-400">
                        {problem.class && <><span>Clasa {problem.class}</span><span>•</span></>}
                        <span>{problem.difficulty}</span>
                        {problem.category && <><span>•</span><span>{problem.category}</span></>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

