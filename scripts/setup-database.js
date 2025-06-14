// Simple script to test database connection and create tables
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test if blog tables exist by trying to count posts
    try {
      const postCount = await prisma.blogPost.count()
      console.log(`✅ BlogPost table exists with ${postCount} posts`)
    } catch (error) {
      console.log('❌ BlogPost table does not exist')
      console.log('Run: npx prisma db push')
      return
    }
    
    // Test if newsletter table exists
    try {
      const subCount = await prisma.newsletterSubscription.count()
      console.log(`✅ NewsletterSubscription table exists with ${subCount} subscribers`)
    } catch (error) {
      console.log('❌ NewsletterSubscription table does not exist')
      console.log('Run: npx prisma db push')
      return
    }
    
    // Test creating a sample blog post
    console.log('🧪 Testing blog post creation...')
    
    // Find an admin user
    const adminUser = await prisma.user.findFirst({
      where: { userType: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }
    
    console.log(`✅ Found admin user: ${adminUser.name || adminUser.email}`)
    
    // Check if test post already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: 'test-post-setup' }
    })
    
    if (existingPost) {
      console.log('✅ Test blog post already exists')
    } else {
      // Create a test blog post
      const testPost = await prisma.blogPost.create({
        data: {
          title: 'Test Blog Post - Database Setup',
          slug: 'test-post-setup',
          excerpt: 'This is a test post created during database setup to verify everything is working correctly.',
          content: `# Test Blog Post

This is a test post created during database setup.

## Purpose

This post verifies that:
- Database tables are created correctly
- Blog post creation works
- API endpoints are functional

## Next Steps

You can now:
1. Create real blog posts through the admin interface
2. Delete this test post if desired
3. Start creating content for your blog

Happy blogging! 🎉`,
          category: 'Test',
          tags: ['test', 'setup'],
          readTime: 2,
          published: true,
          featured: false,
          authorId: adminUser.id,
          publishedAt: new Date(),
          metaTitle: 'Test Blog Post - Database Setup',
          metaDescription: 'Test post to verify blog functionality is working correctly.'
        }
      })
      
      console.log(`✅ Created test blog post: ${testPost.title}`)
    }
    
    // Test newsletter subscription
    console.log('🧪 Testing newsletter subscription...')
    
    const testEmail = 'test@example.com'
    const existingSub = await prisma.newsletterSubscription.findUnique({
      where: { email: testEmail }
    })
    
    if (existingSub) {
      console.log('✅ Test newsletter subscription already exists')
    } else {
      const testSub = await prisma.newsletterSubscription.create({
        data: {
          email: testEmail,
          status: 'ACTIVE',
          preferences: {
            jobAlerts: true,
            careerTips: true,
            weeklyDigest: true,
            productUpdates: false
          },
          tags: ['test'],
          source: 'database_setup',
          confirmedAt: new Date()
        }
      })
      
      console.log(`✅ Created test newsletter subscription: ${testSub.email}`)
    }
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Visit /admin/blog to manage blog posts')
    console.log('2. Visit /blog to see your blog')
    console.log('3. Visit /admin/growth to see analytics')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    
    if (error.code === 'P2021') {
      console.log('\n💡 Solution: Run "npx prisma db push" to create the database tables')
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Solution: Run "npx prisma db push" to create missing tables')
    } else {
      console.log('\n💡 Check your database connection and try again')
    }
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
