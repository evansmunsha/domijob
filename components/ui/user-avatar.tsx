import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "next-auth"
import { cn } from "@/lib/utils"

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image">
}

export function UserAvatar({ user, className, ...props }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)} {...props}>
      {user.image ? (
        <AvatarImage src={user.image} alt={user.name ?? "User avatar"} />
      ) : (
        <AvatarFallback>
          {user.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "U"}
        </AvatarFallback>
      )}
    </Avatar>
  )
} 