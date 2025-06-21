export interface BlogAuthor {
  id: string
  name: string | null
  image: string | null
}

export interface BlogComment {
  id: string
  content: string
  approved: boolean
  createdAt: string
  updatedAt: string
  authorId: string
  postId: string
  parentId: string | null
  author: BlogAuthor
  replies: BlogComment[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  readTime: number
  views: number
  published: boolean
  featured: boolean
  image: string | null
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  authorId: string
  author: BlogAuthor
  _count: {
    comments: number
    likes: number
  }
  userLiked?: boolean
  relatedPosts?: BlogPost[]
  comments?: BlogComment[]
}

export interface BlogPostWithCounts extends BlogPost {
  _count: {
    comments: number
    likes: number
  }
}
