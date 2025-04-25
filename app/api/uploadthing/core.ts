import { auth } from "@/app/utils/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const session = await auth();
        console.log("Session:", session);

        if (!session?.user) {
          console.error("Unauthorized upload attempt");
          throw new UploadThingError("Unauthorized");
        }

        console.log("User is authorized to upload");
        return { userId: session.user.id };
      } catch (error) {
        console.error("Error during upload authorization:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("File URL:", file.url);
        console.log("File metadata:", metadata);
        console.log("File details:", file);

        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error during upload completion:", error);
        throw error;
      }
    }),

  resumeUploader: f({
    "application/pdf": {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const session = await auth();
        console.log("Session:", session);

        if (!session?.user) {
          console.error("Unauthorized upload attempt");
          throw new UploadThingError("Unauthorized");
        }

        console.log("User is authorized to upload");
        return { userId: session.user.id };
      } catch (error) {
        console.error("Error during upload authorization:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Upload complete for userId:", metadata.userId);
        console.log("File URL:", file.url); // ✅ fixed from file.ufsUrl
        console.log("File metadata:", metadata);
        console.log("File details:", file);

        return {
          uploadedBy: metadata.userId,
          url: file.url, // ✅ correct
          name: file.name,
          size: file.size,
        };
      } catch (error) {
        console.error("Error during upload completion:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
