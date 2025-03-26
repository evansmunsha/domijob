"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { UploadDropzone } from "@/components/general/UploadThingReExport"
import { updateResume } from "@/app/actions"
import { FileText, Download, XIcon, Eye } from "lucide-react"
import Image from "next/image"
import PDFImage from "@/public/pdf.png"

interface ResumeSectionProps {
  resumeUrl: string
  userId: string
}

export function ResumeSection({ resumeUrl, userId }: ResumeSectionProps) {
  const [isPending, setIsPending] = useState(false)
  const [currentResume, setCurrentResume] = useState(resumeUrl)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function handleResumeUpdate(newResumeUrl: string) {
    try {
      setIsPending(true)
      await updateResume(userId, newResumeUrl)
      setCurrentResume(newResumeUrl)
      toast.success("Resume updated successfully")
    } catch (error) {
      console.error("Error updating resume:", error)
      toast.error("Failed to update resume")
    } finally {
      setIsPending(false)
    }
  }

  async function handleRemoveResume() {
    try {
      setIsPending(true)
      // In a real app, you would also delete the file from storage
      await updateResume(userId, "")
      setCurrentResume("")
      toast.success("Resume removed successfully")
    } catch (error) {
      console.error("Error removing resume:", error)
      toast.error("Failed to remove resume")
    } finally {
      setIsPending(false)
    }
  }

  // Simulate upload progress for better UX
  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress)
  }

  return (
    <div className="space-y-6">
      {currentResume ? (
        <Card className="p-6 border-2 border-dashed">
          <div className="flex items-start gap-4">
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
              <h3 className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Your Current Resume
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[300px] mb-4">
                {currentResume.split("/").pop()}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={currentResume} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={currentResume} target="_blank"  download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button size="sm" variant="destructive" onClick={handleRemoveResume} disabled={isPending}>
                  <XIcon className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No resume uploaded</h3>
          <p className="text-muted-foreground mb-4">Upload your resume to apply for jobs more quickly</p>
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">{currentResume ? "Update Your Resume" : "Upload Your Resume"}</h3>
        <div className="space-y-2">
          <UploadDropzone
            endpoint="resumeUploader"
            onUploadProgress={handleUploadProgress}
            onClientUploadComplete={(res) => {
              handleResumeUpdate(res[0].url)
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
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-4">Upload your resume in PDF format. Maximum file size: 2MB.</p>
      </div>
    </div>
  )
}

