"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface SaveProjectDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (name: string, description: string) => Promise<void>
    isSaving: boolean
}

export function SaveProjectDialog({ isOpen, onClose, onSave, isSaving }: SaveProjectDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        await onSave(name, description)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
            <DialogContent className="bg-[#1e1e1e] border-[#3b3b3b] text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Project</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Give your project a name and description to save it.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-200">
                            Project Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My Algorithm"
                            className="bg-[#2d2d2d] border-[#3b3b3b] text-white focus:border-green-500"
                            disabled={isSaving}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-200">
                            Description <span className="text-gray-500 text-xs">(Optional)</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this code does..."
                            className="bg-[#2d2d2d] border-[#3b3b3b] text-white min-h-[100px] resize-none focus:border-green-500"
                            disabled={isSaving}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="bg-transparent border-[#3b3b3b] text-white hover:bg-[#3d3d3d]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
