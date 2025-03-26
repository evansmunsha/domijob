"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { updateSkills } from "@/app/actions"
import { X, Plus, Loader2 } from "lucide-react"

interface SkillsSectionProps {
  userId: string
  initialSkills: string[]
}

export function SkillsSection({ userId, initialSkills }: SkillsSectionProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills || [])
  const [newSkill, setNewSkill] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault()

    if (!newSkill.trim()) return

    // Check if skill already exists
    if (skills.includes(newSkill.trim())) {
      toast.error("This skill is already in your list")
      return
    }

    const updatedSkills = [...skills, newSkill.trim()]

    try {
      setIsPending(true)
      await updateSkills(userId, updatedSkills)
      setSkills(updatedSkills)
      setNewSkill("")
      toast.success("Skill added successfully")
    } catch (error) {
      console.error("Error adding skill:", error)
      toast.error("Failed to add skill")
    } finally {
      setIsPending(false)
    }
  }

  async function handleRemoveSkill(skillToRemove: string) {
    const updatedSkills = skills.filter((skill) => skill !== skillToRemove)

    try {
      setIsPending(true)
      await updateSkills(userId, updatedSkills)
      setSkills(updatedSkills)
      toast.success("Skill removed successfully")
    } catch (error) {
      console.error("Error removing skill:", error)
      toast.error("Failed to remove skill")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        

        {skills.length > 0 ? (
          ""
        ):(
          <>
            <h3 className="font-medium mb-2">Your Skills Will Show Up Here </h3>
            <p className="text-sm text-muted-foreground mb-4">Add skills that showcase your expertise to employers</p>
          </>
          
        )}


        

        <div className="flex flex-wrap gap-2 min-h-[100px]">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1.5">
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No skills added yet. Add some skills to stand out to employers.
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Add a New Skill</h3>
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Enter a skill (e.g., JavaScript, Project Management)"
            className="flex-1"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !newSkill.trim()}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Add both technical skills and soft skills that are relevant to your career goals.
        </p>
      </div>
    </div>
  )
}

