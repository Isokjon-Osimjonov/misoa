import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '../lib/auth-store'

export default function Index() {
  const [checked, setChecked] = useState(false)
  const [hasSeenOnboarding, setHasSeen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    const check = async () => {
      try {
        // TEMP: force reset for testing
        await SecureStore.deleteItemAsync('onboarding_complete')
        
        const seen = await SecureStore.getItemAsync('onboarding_complete')
        console.log('onboarding value:', seen)
        setHasSeen(seen === 'true')
      } catch {
        setHasSeen(false)
      } finally {
        setChecked(true)
      }
    }
    check()
  }, [])

  // Wait for check to complete
  if (!checked) return null

  // Show onboarding first
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />
  }

  // Then check auth
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />
  }

  // Authenticated → home
  return <Redirect href="/(tabs)/home" />
}
