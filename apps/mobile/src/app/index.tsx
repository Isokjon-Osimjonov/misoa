import { router } from 'expo-router'
import { useEffect, useState, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '../lib/auth-store'

export default function Index() {
  const [checked, setChecked] = useState(false)
  const [hasSeenOnboarding, setHasSeen] = useState(false)
  const { isLoading } = useAuthStore()
  const hasRedirected = useRef(false)

  useEffect(() => {
    const check = async () => {
      try {
        // TEMP: remove before production
        await SecureStore.deleteItemAsync('onboarding_complete')
        
        const seen = await SecureStore.getItemAsync('onboarding_complete')
        setHasSeen(seen === 'true')
      } catch {
        setHasSeen(false)
      } finally {
        setChecked(true)
      }
    }
    check()
  }, [])

  useEffect(() => {
    if (hasRedirected.current) return
    if (!checked || isLoading) return
    
    hasRedirected.current = true
    
    if (!hasSeenOnboarding) {
      router.replace('/onboarding')
      return
    }
    
    router.replace('/(tabs)/home')
  }, [checked, isLoading, hasSeenOnboarding])

  return null
}
