"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Heart, 
  Share2, 
  MessageSquare,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  Check,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BlogInteractionsProps {
  postId: string
  postTitle: string
  postUrl: string
  initialLikes: number
  initialComments: number
  views: number
}

export function BlogInteractions({ 
  postId, 
  postTitle, 
  postUrl, 
  initialLikes, 
  initialComments,
  views 
}: BlogInteractionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likes)
        setIsLiked(!isLiked)
        toast.success(isLiked ? "Like removed" : "Post liked! ❤️")
      } else {
        toast.error("Failed to like post")
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Something went wrong")
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = (platform: string) => {
    const encodedTitle = encodeURIComponent(postTitle)
    const encodedUrl = encodeURIComponent(postUrl)
    
    let shareUrl = ""
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=DomiJob`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "copy":
        navigator.clipboard.writeText(postUrl)
        setCopied(true)
        toast.success("Link copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section")
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        {/* Like Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={`gap-2 transition-all duration-200 ${
            isLiked 
              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400" 
              : "hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20"
          }`}
        >
          <Heart 
            className={`h-4 w-4 transition-all duration-200 ${
              isLiked ? "fill-current" : ""
            }`} 
          />
          <span className="font-medium">{likes}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToComments}
          className="gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-950/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">{initialComments}</span>
        </Button>

        {/* Share Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-950/20"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => handleShare("twitter")} className="gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("linkedin")} className="gap-2">
              <Linkedin className="h-4 w-4 text-blue-600" />
              Share on LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("facebook")} className="gap-2">
              <Facebook className="h-4 w-4 text-blue-500" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("copy")} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Link Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Views Counter */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>{views.toLocaleString()} views</span>
      </div>
    </div>
  )
}
