// Enhanced logging utility for notification system testing
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? data : "")
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || "")
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? data : "")
    }
  },

  notification: (type: string, userId: string, message: string, data?: any) => {
    console.log(
      `[NOTIFICATION] ${new Date().toISOString()} - Type: ${type}, User: ${userId}, Message: ${message}`,
      data ? data : "",
    )
  },
}

