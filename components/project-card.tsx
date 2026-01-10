import Link from "next/link"
import { FileCode, Calendar, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Project } from "@/lib/types"

interface ProjectCardProps {
    project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
    const fileCount = project.files?.length || 0
    const date = new Date(project.updated_at).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric"
    })

    return (
        <Link href={`/planckcode/ide?projectId=${project.id}`} className="block group">
            <Card className="h-full bg-[#1e1e1e] border-[#3b3b3b] overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:-translate-y-1">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-green-400 transition-colors line-clamp-1">
                        {project.name}
                    </CardTitle>
                    <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                        {project.description || "No description provided."}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                        <div className="flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5" />
                            {fileCount} {fileCount === 1 ? "file" : "files"}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {date}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                    <div className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-600 group-hover:text-white transition-colors">
                        <span>Open Project</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
