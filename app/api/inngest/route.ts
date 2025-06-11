import { inngest } from "@/app/utils/inngest/client";
import { analyzeSkillGap, handleJobCreated, handleJobExpiration, sendPeriodicJobListing, sendPersonalizedJobAlerts } from "@/app/utils/inngest/functions";
import { serve } from "inngest/next";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [handleJobExpiration, sendPeriodicJobListing, sendPersonalizedJobAlerts,analyzeSkillGap,handleJobCreated],
});
