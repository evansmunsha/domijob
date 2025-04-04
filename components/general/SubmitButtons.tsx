"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react"

interface GeneralSubmitButtonProps {
  text: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary";
  icon?: React.ReactNode;
  width?: string; // ✅ Add this line
}



export function GeneralSubmitButton({ text, onClick }: GeneralSubmitButtonProps) {
  const { pending } = useFormStatus()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (onClick) {
      setIsLoading(true)
      await onClick()
      setIsLoading(false)
    }
  }

  return (
    <Button type="submit" disabled={pending || isLoading} onClick={handleClick} className="w-full">
      {(pending || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {text}
    </Button>
  )
}



export function SaveJobButton({ savedJob }: { savedJob: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="outline"
      disabled={pending}
      type="submit"
      className="flex items-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Heart
            className={`size-4 transition-colors ${
              savedJob ? "fill-current text-red-500" : ""
            }`}
          />
          {savedJob ? "Saved" : "Save Job"}
        </>
      )}
    </Button>
  );
}
