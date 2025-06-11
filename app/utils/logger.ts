// Define more specific types for the logger parameters
type LogData = Record<string, unknown> | unknown
type ErrorType = Error | unknown

export const logger = {
  info: (message: string, data?: LogData) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? data : "")
  },

  error: (message: string, error?: ErrorType) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || "")
  },

  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? data : "")
    }
  },

  notification: (type: string, userId: string, message: string, data?: LogData) => {
    console.log(
      `[NOTIFICATION] ${new Date().toISOString()} - Type: ${type}, User: ${userId}, Message: ${message}`,
      data ? data : "",
    )
  },
}

