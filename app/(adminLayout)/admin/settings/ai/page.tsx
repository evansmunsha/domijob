import { redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { AISettings } from "@/components/admin/AISettings"

export const metadata = {
  title: "AI Settings | Admin Dashboard",
  description: "Configure AI features for your application",
}

export default async function AiSettingsPage() {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure AI features and monitor usage
        </p>
      </div>
      
      <AISettings />
    </div>
  )
}