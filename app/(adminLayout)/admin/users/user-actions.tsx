"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"
import { MoreHorizontal, User, ShieldAlert, ShieldCheck, Trash2, KeyRound } from "lucide-react"
import { User as UserType } from "./columns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface UserActionsProps {
  user: UserType
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = async (newRole: "ADMIN" | "COMPANY" | "JOB_SEEKER") => {
    try {
      setIsLoading(true)
      await axios.patch(`/api/admin/users/${user.id}/role`, { role: newRole })
      toast.success(`User role updated to ${newRole}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update user role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true)
      await axios.delete(`/api/admin/users/${user.id}`)
      toast.success("User deleted successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete user")
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      setIsLoading(true)
      await axios.post(`/api/admin/users/${user.id}/reset-password`)
      toast.success("Password reset email sent")
    } catch (error) {
      console.error(error)
      toast.error("Failed to send password reset")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
            <User className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleRoleChange("JOB_SEEKER")}
            disabled={user.role === "JOB_SEEKER" || isLoading}
          >
            <User className="mr-2 h-4 w-4" />
            Set as Job Seeker
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleRoleChange("COMPANY")}
            disabled={user.role === "COMPANY" || isLoading}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Set as Company
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleRoleChange("ADMIN")}
            disabled={user.role === "ADMIN" || isLoading}
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            Set as Admin
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetPassword} disabled={isLoading}>
            <KeyRound className="mr-2 h-4 w-4" />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 