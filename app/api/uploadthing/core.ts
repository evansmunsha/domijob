import { auth } from "@/app/utils/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      try {
        const session = await auth();
        console.log('Session:', session); // Log the session details

        if (!session?.user) {
          console.error('Unauthorized upload attempt'); // Log unauthorized attempts
          throw new UploadThingError("Unauthorized");
        }

        console.log('User is authorized to upload'); // Log authorized attempts
        return { userId: session.user.id };
      } catch (error) {
        console.error('Error during upload authorization:', error); // Log errors during authorization
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log('Upload complete for userId:', metadata.userId);
        console.log('File URL:', file.url);
        console.log('File metadata:', metadata); // Log file metadata
        console.log('File details:', file); // Log file details

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error('Error during upload completion:', error); // Log errors during upload completion
        throw error;
      }
    }),

  resumeUploader: f({
    "application/pdf": {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      try {
        const session = await auth();
        console.log('Session:', session); // Log the session details

        if (!session?.user) {
          console.error('Unauthorized upload attempt'); // Log unauthorized attempts
          throw new UploadThingError("Unauthorized");
        }

        console.log('User is authorized to upload'); // Log authorized attempts
        return { userId: session.user.id };
      } catch (error) {
        console.error('Error during upload authorization:', error); // Log errors during authorization
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log('Upload complete for userId:', metadata.userId);
        console.log('File URL:', file.url);
        console.log('File metadata:', metadata); // Log file metadata
        console.log('File details:', file); // Log file details

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error('Error during upload completion:', error); // Log errors during upload completion
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
