//types/blog.ts
// Blog-related type definitions

export interface BlogAuthor {
  id: string
  name: string | null
  image: string | null
}

export interface BlogComment {
  id: string
  content: string
  createdAt: string
  authorId: string | null
  postId: string
  parentId: string | null
  approved: boolean
  author: BlogAuthor | null
  replies: BlogComment[]
  post?: {
    id: string
    title: string
    slug: string
  }
  _count?: {
    replies: number
  }
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
  featured: boolean
  authorId: string
  category: string
  tags: string[]
  readTime: number
  views: number
  likes: number
  image: string | null
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: BlogAuthor
  comments: BlogComment[]
  relatedPosts?: BlogPost[]
}

export interface BlogPostWithRelated extends BlogPost {
  relatedPosts: BlogPost[]
}

// Database types (with Date objects)
export interface BlogCommentDB {
  id: string
  content: string
  createdAt: Date
  authorId: string | null
  postId: string
  parentId: string | null
  approved: boolean
  updatedAt: Date
  author: BlogAuthor | null
  replies: BlogCommentDB[]
}

export interface BlogPostDB {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
  featured: boolean
  authorId: string
  category: string
  tags: string[]
  readTime: number
  views: number
  likes: number
  image: string | null
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  author: BlogAuthor
  comments: BlogCommentDB[]
  relatedPosts?: BlogPostDB[]
}

// Utility function to serialize dates
export function serializeBlogPost(post: BlogPostDB): BlogPost {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() || null,
    comments: post.comments.map(serializeBlogComment),
    relatedPosts: post.relatedPosts?.map(serializeBlogPost) || []
  }
}

export function serializeBlogComment(comment: BlogCommentDB): BlogComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    replies: comment.replies.map(serializeBlogComment)
  }
}

// Form types
export interface BlogPostFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  published: boolean
  featured: boolean
  metaTitle: string
  metaDescription: string
  readTime?: number
}

export interface CommentFormData {
  content: string
  parentId?: string
}

// API response types
export interface BlogPostResponse {
  success: boolean
  data?: BlogPost
  error?: string
}

export interface BlogCommentsResponse {
  success: boolean
  data?: BlogComment[]
  error?: string
}

export interface BlogLikeResponse {
  success: boolean
  likes: number
  isLiked: boolean
  error?: string
}
