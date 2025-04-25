import { useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ResumeAnalysis {
  atsScore: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
}

interface ResumeUploadProps {
  onUploadComplete: (text: string, analysis: ResumeAnalysis) => void;
  onError: (error: string) => void;
}

export function ResumeUpload({ onUploadComplete, onError }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: async (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev: number) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ai/resume-parse", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload resume");
        }

        const data = await response.json();
        setUploadProgress(100);
        
        if (data.success) {
          onUploadComplete(data.text, data.analysis);
          toast.success("Resume uploaded and analyzed successfully!");
        } else {
          throw new Error(data.error || "Failed to process resume");
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : "Failed to upload resume");
        toast.error(error instanceof Error ? error.message : "Failed to upload resume");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop your resume here...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Drag and drop your resume here, or click to select a file
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX (Max size: 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Processing resume...</p>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
} 