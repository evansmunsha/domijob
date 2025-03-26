"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { updateLanguages } from "@/app/actions"
import { X, Plus, Loader2 } from "lucide-react"

interface LanguagesSectionProps {
  userId: string
  initialLanguages: string[]
}

export function LanguagesSection({ userId, initialLanguages }: LanguagesSectionProps) {
  const [languages, setLanguages] = useState<string[]>(initialLanguages || [])
  const [newLanguage, setNewLanguage] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function handleAddLanguage(e: React.FormEvent) {
    e.preventDefault()

    if (!newLanguage.trim()) return

    // Check if language already exists
    if (languages.includes(newLanguage.trim())) {
      toast.error("This language is already in your list")
      return
    }

    const updatedLanguages = [...languages, newLanguage.trim()]

    try {
      setIsPending(true)
      await updateLanguages(userId, updatedLanguages)
      setLanguages(updatedLanguages)
      setNewLanguage("")
      toast.success("Language added successfully")
    } catch (error) {
      console.error("Error adding language:", error)
      toast.error("Failed to add language")
    } finally {
      setIsPending(false)
    }
  }

  async function handleRemoveLanguage(languageToRemove: string) {
    const updatedLanguages = languages.filter((language) => language !== languageToRemove)

    try {
      setIsPending(true)
      await updateLanguages(userId, updatedLanguages)
      setLanguages(updatedLanguages)
      toast.success("Language removed successfully")
    } catch (error) {
      console.error("Error removing language:", error)
      toast.error("Failed to remove language")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        

        {languages.length > 0 ? ("") : (
          <>
            <h3 className="font-medium mb-2">Your Languages Will Show Up Here</h3>
            <p className="text-sm text-muted-foreground mb-4">Add languages you speak to enhance your profile</p>
          </>
          
        )}


        

        <div className="flex flex-wrap gap-2 min-h-[100px]">
          {languages.length > 0 ? (
            languages.map((language) => (
              <Badge key={language} variant="outline" className="px-3 py-1.5">
                {language}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(language)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No languages added yet. Add languages to show your communication skills.
            </p>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Add a New Language</h3>
        <form onSubmit={handleAddLanguage} className="flex gap-2">
          <Input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Enter a language (e.g., English, Spanish)"
            className="flex-1"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !newLanguage.trim()}>
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
          Include your proficiency level if desired (e.g., "Spanish - Fluent").
        </p>
      </div>
    </div>
  )
}

