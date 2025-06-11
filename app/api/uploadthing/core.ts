import { auth } from "@/app/utils/auth"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Keep your existing imageUploader
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const session = await auth()
        console.log("Session:", session) // Log the session details

        if (!session?.user) {
          console.error("Unauthorized upload attempt") // Log unauthorized attempts
          throw new UploadThingError("Unauthorized")
        }

        console.log("User is authorized to upload") // Log authorized attempts
        return { userId: session.user.id }
      } catch (error) {
        console.error("Error during upload authorization:", error) // Log errors during authorization
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId)
        console.log("File URL:", file.ufsUrl)
        console.log("File metadata:", metadata) // Log file metadata
        console.log("File details:", file) // Log file details

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: metadata.userId }
      } catch (error) {
        console.error("Error during upload completion:", error) // Log errors during upload completion
        throw error
      }
    }),

  // Update resumeUploader to support both PDF and DOCX
  resumeUploader: f({
    "application/pdf": {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        // Allow anonymous uploads for resume parsing
        const session = await auth()
        console.log("Session for resume upload:", session)

        // For resume uploads, we'll allow anonymous users
        const userId = session?.user?.id || "anonymous"
        console.log("User ID for resume upload:", userId)

        return { userId }
      } catch (error) {
        console.error("Error during resume upload authorization:", error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Resume upload complete for userId:", metadata.userId)
        console.log("File URL:", file.ufsUrl)
        console.log("File metadata:", metadata)
        console.log("File details:", file)

        return {
          uploadedBy: metadata.userId,
          url: file.ufsUrl, // Make sure to return the URL
        }
      } catch (error) {
        console.error("Error during resume upload completion:", error)
        throw error
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
