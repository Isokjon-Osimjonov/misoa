import { useRouter } from 'expo-router'
import { useAuthStore } from '../lib/auth-store'

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    action()
  }

  return { requireAuth, isAuthenticated }
}
