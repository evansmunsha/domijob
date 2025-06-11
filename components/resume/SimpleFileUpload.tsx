"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SimpleFileUploadProps {
  onFileProcessed: (text: string, fileName: string, fileSize: number) => void
  onError: (error: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function SimpleFileUpload({ 
  onFileProcessed, 
  onError, 
  isLoading = false,
  disabled = false 
}: SimpleFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    size: number
    type: string
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.docx') && !fileName.endsWith('.pdf')) {
      onError("Only DOCX and PDF files are supported")
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      onError("File size must be less than 2MB")
      return
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type
    })

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ai/resume-parse', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process file')
      }

      const data = await response.json()
      
      if (data.success && data.text) {
        onFileProcessed(data.text, file.name, file.size)
        toast({
          title: "Success",
          description: "File processed successfully!",
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        })
      } else {
        throw new Error(data.error || 'No text extracted from file')
      }

    } catch (error) {
      console.error('File processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file'
      onError(errorMessage)
      setUploadedFile(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled || isLoading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isLoading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isDisabled = disabled || isLoading || isProcessing

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isDisabled}
        />

        {uploadedFile && !isProcessing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{uploadedFile.name}</p>
                  <p className="text-sm text-green-600">
                    {Math.round(uploadedFile.size / 1024)} KB • {uploadedFile.type.includes('pdf') ? 'PDF' : 'DOCX'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-green-600 text-center">
              ✅ File uploaded successfully! The text has been extracted and is ready for analysis.
            </p>
          </div>
        ) : (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver && !isDisabled 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!isDisabled ? handleBrowseClick : undefined}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-lg font-medium">Processing file...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting text from your document
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragOver ? 'Drop your file here' : 'Upload your resume'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline">DOCX</Badge>
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Max 2MB</Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
