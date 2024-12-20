import { Toast, ToastProvider, ToastViewport } from "./toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {description}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 