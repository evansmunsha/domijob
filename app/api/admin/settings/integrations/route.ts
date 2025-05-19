import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import crypto from "crypto"

// Function to generate a new API key
function generateApiKey() {
  return `sk_live_${crypto.randomBytes(24).toString('hex')}`
}

export async function GET() {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Fetch all settings from the database
    const allSettings = await prisma.setting.findMany()
    
    // Group settings by category
    const settingsMap = allSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      
      // Parse JSON values if needed
      try {
        // Try to parse as JSON first
        acc[setting.category][setting.key.replace(`${setting.category}_`, '')] = JSON.parse(setting.value);
      } catch (e) {
        // Handle boolean values
        if (setting.value === 'true' || setting.value === 'false') {
          acc[setting.category][setting.key.replace(`${setting.category}_`, '')] = setting.value === 'true';
        }
        // Handle numeric values
        else if (!isNaN(Number(setting.value))) {
          acc[setting.category][setting.key.replace(`${setting.category}_`, '')] = Number(setting.value);
        }
        // Default to string
        else {
          acc[setting.category][setting.key.replace(`${setting.category}_`, '')] = setting.value;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Default settings structure with database values or fallbacks
    const settings = {
      api_key: process.env.APP_API_KEY || "sk_live_•••••••••••••••••••••••••••",
      stripe: settingsMap.stripe || {
        enabled: true,
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || "",
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || "",
        connected: !!process.env.STRIPE_SECRET_KEY
      },
      email: settingsMap.email || {
        provider: "resend",
        enabled: true,
        api_key: process.env.RESEND_API_KEY ? "•••••••••••••" : "",
        from_email: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        connected: !!process.env.RESEND_API_KEY
      },
      analytics: settingsMap.analytics || {
        enabled: true,
        provider: "google",
        tracking_id: process.env.GA_TRACKING_ID || "",
        connected: !!process.env.GA_TRACKING_ID
      },
      affiliate: {
        enabled: settingsMap.affiliate?.enabled ?? true,
        commission_rate: settingsMap.affiliate?.commission_rate ?? 10,
        min_payout: settingsMap.affiliate?.min_payout ?? 50,
        payout_methods: settingsMap.affiliate?.payout_methods ?? ["paypal", "bank_transfer"]
      }
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[SETTINGS_GET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const data = await req.json()
    
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Process site settings
      if (data.site) {
        const { name, description, logoUrl, primaryColor } = data.site;
        
        await Promise.all([
          tx.setting.upsert({
            where: { key: "site_name" },
            update: { value: name, updatedAt: new Date() },
            create: { 
              key: "site_name", 
              value: name, 
              category: "site",
              description: "Website name"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "site_description" },
            update: { value: description, updatedAt: new Date() },
            create: { 
              key: "site_description", 
              value: description, 
              category: "site",
              description: "Website description"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "site_logo_url" },
            update: { value: logoUrl, updatedAt: new Date() },
            create: { 
              key: "site_logo_url", 
              value: logoUrl, 
              category: "site",
              description: "Logo URL"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "site_primary_color" },
            update: { value: primaryColor, updatedAt: new Date() },
            create: { 
              key: "site_primary_color", 
              value: primaryColor, 
              category: "site",
              description: "Primary brand color"
            }
          })
        ]);
      }
      
      // Process job settings
      if (data.jobs) {
        const { expireDays, allowFeatured, featuredPrice } = data.jobs;
        
        await Promise.all([
          tx.setting.upsert({
            where: { key: "jobs_expire_days" },
            update: { value: expireDays.toString(), updatedAt: new Date() },
            create: { 
              key: "jobs_expire_days", 
              value: expireDays.toString(), 
              category: "jobs",
              description: "Number of days until job listings expire"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "jobs_allow_featured" },
            update: { value: allowFeatured.toString(), updatedAt: new Date() },
            create: { 
              key: "jobs_allow_featured", 
              value: allowFeatured.toString(), 
              category: "jobs",
              description: "Whether featured job listings are enabled"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "jobs_featured_price" },
            update: { value: featuredPrice.toString(), updatedAt: new Date() },
            create: { 
              key: "jobs_featured_price", 
              value: featuredPrice.toString(), 
              category: "jobs",
              description: "Price for featuring a job listing"
            }
          })
        ]);
      }
      
      // Handle affiliate settings
      if (data.affiliate) {
        const { enabled, commissionRate, minPayout } = data.affiliate;
        
        await Promise.all([
          tx.setting.upsert({
            where: { key: "affiliate_enabled" },
            update: { value: enabled.toString(), updatedAt: new Date() },
            create: { 
              key: "affiliate_enabled", 
              value: enabled.toString(), 
              category: "affiliate",
              description: "Whether the affiliate program is enabled"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "affiliate_commission_rate" },
            update: { value: commissionRate.toString(), updatedAt: new Date() },
            create: { 
              key: "affiliate_commission_rate", 
              value: commissionRate.toString(), 
              category: "affiliate",
              description: "Default commission rate for affiliates (percentage)"
            }
          }),
          
          tx.setting.upsert({
            where: { key: "affiliate_min_payout" },
            update: { value: minPayout.toString(), updatedAt: new Date() },
            create: { 
              key: "affiliate_min_payout", 
              value: minPayout.toString(), 
              category: "affiliate",
              description: "Minimum amount required for affiliate payout"
            }
          })
        ]);
        
        // Also update all affiliates with the new commission rate
        if (commissionRate !== undefined) {
          await tx.affiliate.updateMany({
            data: { 
              commissionRate: commissionRate / 100,
              updatedAt: new Date()
            }
          });
        }
      }
      
      // Log the admin who updated settings
      if (session.user.email) {
        await tx.setting.upsert({
          where: { key: "settings_last_updated_by" },
          update: { 
            value: session.user.email, 
            updatedAt: new Date() 
          },
          create: { 
            key: "settings_last_updated_by", 
            value: session.user.email, 
            category: "system",
            description: "Admin who last updated settings"
          }
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Settings updated successfully"
    })
  } catch (error) {
    console.error("[SETTINGS_POST]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { action } = await req.json()
    
    if (action === "regenerate_api_key") {
      const newApiKey = generateApiKey()
      
      // In a real implementation, save this key to database or environment variables
      // process.env.APP_API_KEY = newApiKey
      
      return NextResponse.json({
        success: true,
        api_key: newApiKey
      })
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[SETTINGS_PUT]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 