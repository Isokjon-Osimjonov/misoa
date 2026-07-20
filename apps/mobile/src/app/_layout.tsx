import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { View, Platform, ActivityIndicator, Text } from 'react-native'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { queryClient } from '../lib/query-client'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useNetworkStatus } from '../components/ui/NoInternet'
import NoInternet from '../components/ui/NoInternet'
import { useAuthStore } from '../lib/auth-store'
import { useEffect, useState } from 'react'
import { registerForPushNotifications, setupNotificationListeners } from '../lib/push-notifications'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

// Inner component — has access to QueryClientProvider
function AppContent() {
  const isConnected = useNetworkStatus()
  const queryClient = useQueryClient()
  const router = useRouter()
  const customer = useAuthStore((s) => s.customer)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Push token registration
  useEffect(() => {
    if (!isAuthenticated || !customer) return
    registerForPushNotifications().then(async (token) => {
      if (!token) return
      try {
        const api = (await import('../lib/api')).default
        await api.post('/auth/push-token', { token, platform: Platform.OS })
      } catch {}
    })
  }, [isAuthenticated, customer?.id])

  // Notification tap handler
  useEffect(() => {
    const cleanup = setupNotificationListeners(undefined, (response) => {
      const data = response.notification.request.content.data as any
      if (data?.orderId) router.push('/orders/' + data.orderId)
      else if (data?.productId) router.push('/product/' + data.productId)
    })
    return cleanup
  }, [])

  if (!isConnected) {
    return (
      <SafeAreaProvider>
        <NoInternet onRetry={() => queryClient.invalidateQueries()} />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}

// Root layout — provides QueryClient
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  })

  const initialize = useAuthStore((s) => s.initialize)
  const authLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // TEMP: force reset for testing
        await SecureStore.deleteItemAsync('onboarding_complete')
        
        const seen = await SecureStore.getItemAsync('onboarding_complete')
        
        console.log('🔍 onboarding_complete value:', seen)
        console.log('🔍 hasSeenOnboarding will be:', seen === 'true')
        
        setHasSeenOnboarding(seen === 'true')
      } catch(e) {
        console.log('❌ SecureStore error:', e)
        setHasSeenOnboarding(false)
      } finally {
        setOnboardingChecked(true)
      }
    }
    checkOnboarding()
  }, [])

  useEffect(() => {
    if (!fontsLoaded || authLoading || !onboardingChecked) return
    
    if (!hasSeenOnboarding) {
      router.replace('/onboarding')
      return
    }
    
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    
    router.replace('/(tabs)/home')
  }, [onboardingChecked, hasSeenOnboarding, isAuthenticated, fontsLoaded, authLoading])

  return (
    <QueryClientProvider client={queryClient}>
      {(!fontsLoaded || authLoading || !onboardingChecked) ? (
        <SafeAreaProvider>
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff'
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#7C3AED',
              marginBottom: 24,
              letterSpacing: -0.5,
            }}>
              Misoa Market
            </Text>
            <ActivityIndicator
              size="small"
              color="#7C3AED"
            />
          </View>
        </SafeAreaProvider>
      ) : (
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      )}
    </QueryClientProvider>
  )
}

