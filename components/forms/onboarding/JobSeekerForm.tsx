"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { jobSeekerSchema } from "@/app/utils/zodSchemas"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, XIcon, FileText, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import PDFImage from "@/public/pdf.png"
import Image from "next/image"
import { UploadDropzone } from "@/components/general/UploadThingReExport"
import { createJobSeeker } from "@/app/actions"
import { useRouter } from "next/navigation"

export default function JobSeekerForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [newLanguage, setNewLanguage] = useState("")

  const form = useForm<z.infer<typeof jobSeekerSchema>>({
    resolver: zodResolver(jobSeekerSchema),
    defaultValues: {
      about: "",
      resume: "",
      name: "",
      skills: [],
      languages: [],
    },
  })

  const addSkill = () => {
    if (!newSkill.trim()) return
    if (skills.includes(newSkill.trim())) {
      toast.error("This skill is already in your list")
      return
    }
    setSkills([...skills, newSkill.trim()])
    setNewSkill("")
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const addLanguage = () => {
    if (!newLanguage.trim()) return
    if (languages.includes(newLanguage.trim())) {
      toast.error("This language is already in your list")
      return
    }
    setLanguages([...languages, newLanguage.trim()])
    setNewLanguage("")
  }

  const removeLanguage = (language: string) => {
    setLanguages(languages.filter((l) => l !== language))
  }

  async function onSubmit(values: z.infer<typeof jobSeekerSchema>) {
    try {
      setPending(true)

      // Add skills and languages to the form values
      values.skills = skills
      values.languages = languages

      // Show a loading toast that we'll update with success/error
      const loadingToast = toast.loading("Creating your profile...")

      await createJobSeeker(values)

      // Update the toast to success
      // This might not be seen if the redirect happens quickly
      toast.success("Profile created successfully!", {
        id: loadingToast,
        duration: 3000,
      })

      // If for some reason the redirect doesn't happen, manually redirect
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message !== "NEXT_REDIRECT") {
          // Show specific error message if available
          const errorMessage = error.message || "Something went wrong. Please try again."
          toast.error(errorMessage)
          console.error("Profile creation error:", error)
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setPending(false)
    }
  }

  // Simulate upload progress for better UX
  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Create your job seeker profile</h2>
        <p className="text-muted-foreground">Tell us about yourself so employers can get to know you better</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormDescription>This will be displayed on your profile and applications</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="about"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell employers about your skills, experience, and career goals..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief summary highlighting your expertise and what you&apos;re looking for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Skills Section */}
          <div className="space-y-4">
            <FormLabel>Skills</FormLabel>
            <div className="flex flex-wrap gap-2 min-h-[60px] border rounded-md p-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-2 py-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm p-2">
                  No skills added yet. Add skills to stand out to employers.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill (e.g., JavaScript, Project Management)"
                className="flex-1"
              />
              <Button type="button" onClick={addSkill} disabled={!newSkill.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Languages Section */}
          <div className="space-y-4">
            <FormLabel>Languages</FormLabel>
            <div className="flex flex-wrap gap-2 min-h-[60px] border rounded-md p-2">
              {languages.length > 0 ? (
                languages.map((language) => (
                  <Badge key={language} variant="outline" className="px-2 py-1">
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm p-2">
                  No languages added yet. Add languages to show your communication skills.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Enter a language (e.g., English, Spanish)"
                className="flex-1"
              />
              <Button type="button" onClick={addLanguage} disabled={!newLanguage.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <FormField
            control={form.control}
            name="resume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resume (PDF)</FormLabel>
                <FormControl>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    {field.value ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Image
                            src={PDFImage || "/placeholder.svg"}
                            alt="Resume PDF"
                            width={60}
                            height={60}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            Resume uploaded successfully
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {field.value.split("/").pop()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => field.onChange("")}
                          className="flex-shrink-0"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadDropzone
                          endpoint="resumeUploader"
                          onUploadProgress={handleUploadProgress}
                          onClientUploadComplete={(res) => {
                            field.onChange(res[0].url)
                            toast.success("Resume uploaded successfully!")
                            setUploadProgress(0)
                          }}
                          onUploadError={(error) => {
                            toast.error(error.message || "Something went wrong with the upload. Please try again.")
                            setUploadProgress(0)
                          }}
                          className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90 ut-label:text-muted-foreground ut-allowed-content:text-muted-foreground border-primary"
                        />
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload your resume in PDF format. Employers will see this when you apply for jobs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

