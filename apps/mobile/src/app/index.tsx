import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

export default function Index() {
  const [checked, setChecked] = useState(false)
  const [hasSeenOnboarding, setHasSeen] = useState(false)

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

  if (!checked) return null

  // First time → show onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />
  }

  // NOT authenticated → still go HOME
  // Guest mode - no forced login
  return <Redirect href="/(tabs)/home" />
}
