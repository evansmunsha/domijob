 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Convert Tiptap JSON document to plain text
function convertTiptapToText(doc: any): string {
  if (!doc?.content) return '';
  let text = '';
  const walk = (node: any) => {
    if (node.type === 'text' && typeof node.text === 'string') text += node.text;
    if (node.content) node.content.forEach(walk);
    if (['paragraph','heading','blockquote','listItem','bulletList','orderedList'].includes(node.type)) text += '\n';
  };
  doc.content.forEach(walk);
  return text.trim();
}

interface AIJobEnhancerProps {
  jobTitle: string;
  jobDescription: string;
  industry?: string;
  location?: string;
  onApply: (enhancedDescription: string, titleSuggestion?: string) => void;
}

export function AIJobEnhancer({
  jobTitle,
  jobDescription,
  industry,
  location,
  onApply,
}: AIJobEnhancerProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedDescription, setEnhancedDescription] = useState("");
  const [titleSuggestion, setTitleSuggestion] = useState("");

  const enhanceJobDescription = async () => {
    if (!jobDescription.trim()) {
      toast.error("Job description is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/enhance-job", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          industry,
          location,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enhance job description");
      }

      const data = await response.json();
      // Normalize enhancedDescription
      let enhanced = data.enhancedDescription;
      if (typeof enhanced === 'object') {
        enhanced = convertTiptapToText(enhanced);
      } else if (typeof enhanced === 'string') {
        try {
          const parsed = JSON.parse(enhanced);
          if (parsed?.type === 'doc') enhanced = convertTiptapToText(parsed);
        } catch {}
      }
      setEnhancedDescription(enhanced || "");
      setTitleSuggestion(data.titleSuggestion || "");
      
      toast.success("Job description enhanced!");
    } catch (error) {
      console.error(error);
      toast.error(`Failed to enhance job description: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open && !enhancedDescription) {
      enhanceJobDescription();
    }
  };

  const handleApply = () => {
    onApply(enhancedDescription, titleSuggestion);
    setOpen(false);
    toast.success("Enhanced job description applied!");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="gap-1.5"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        Enhance with AI
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>AI Job Description Enhancement</DialogTitle>
            <DialogDescription>
              Our AI has improved your job description to attract more qualified candidates.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Enhancing your job description...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {titleSuggestion && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Title Suggestion</label>
                    <span className="text-xs text-muted-foreground">Optional improvement</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <p className="font-medium">{titleSuggestion}</p>
                  </div>
                </div>
              )}

              <Tabs defaultValue="enhanced">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="enhanced">Enhanced Version</TabsTrigger>
                  <TabsTrigger value="original">Original Version</TabsTrigger>
                </TabsList>
                <TabsContent value="enhanced" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enhanced Job Description</label>
                  </div>
                  <Textarea
                    value={enhancedDescription}
                    onChange={(e) => setEnhancedDescription(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="original" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Original Job Description</label>
                  </div>
                  <div className="min-h-[300px] p-3 bg-muted rounded-md overflow-y-auto whitespace-pre-wrap">
                    {jobDescription}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isLoading || !enhancedDescription}>
              <Check className="mr-2 h-4 w-4" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}