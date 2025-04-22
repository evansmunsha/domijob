// Adapted from https://ui.shadcn.com/docs/components/toast
import { useEffect, useState } from "react"

const TOAST_TIMEOUT = 5000

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    setToasts((prevToasts) => [...prevToasts, newToast])

    // Auto-dismiss after timeout
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, TOAST_TIMEOUT)

    return id
  }

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
  }

  return { toast, dismiss, toasts }
}

// Simple export for direct import
export const toast = (props: ToastProps) => {
  // Create and append toast element
  const toastContainer = document.getElementById('toast-container') || 
    (() => {
      const container = document.createElement('div')
      container.id = 'toast-container'
      container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2'
      document.body.appendChild(container)
      return container
    })()
  
  // Create toast element
  const toastEl = document.createElement('div')
  const variantClass = props.variant === 'destructive' 
    ? 'bg-destructive text-destructive-foreground' 
    : props.variant === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-primary text-primary-foreground'
  
  toastEl.className = `${variantClass} rounded-md p-4 shadow-md animate-in fade-in slide-in-from-top-full duration-300 max-w-md`
  
  // Create toast content
  const content = `
    ${props.title ? `<h3 class="font-medium">${props.title}</h3>` : ''}
    ${props.description ? `<p class="text-sm mt-1">${props.description}</p>` : ''}
  `
  toastEl.innerHTML = content
  
  // Add to container
  toastContainer.appendChild(toastEl)
  
  // Remove after timeout
  setTimeout(() => {
    toastEl.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full')
    setTimeout(() => {
      if (toastContainer.contains(toastEl)) {
        toastContainer.removeChild(toastEl)
      }
      // Remove container if empty
      if (toastContainer.childNodes.length === 0) {
        document.body.removeChild(toastContainer)
      }
    }, 300)
  }, TOAST_TIMEOUT)
} 