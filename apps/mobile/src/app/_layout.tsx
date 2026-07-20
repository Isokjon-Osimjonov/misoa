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
import { useEffect } from 'react'
import { registerForPushNotifications, setupNotificationListeners } from '../lib/push-notifications'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
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

  useEffect(() => {
    initialize()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {(!fontsLoaded || authLoading) ? (
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
