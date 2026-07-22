import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { tokens } from '../../lib/tokens'

export function GuestPrompt() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kirish talab etiladi</Text>
      <Text style={styles.subtitle}>
        Bu sahifani ko'rish uchun tizimga kiring
      </Text>
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.loginText}>Kirish</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Orqaga</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: tokens.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginText: {
    color: tokens.colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  backBtn: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  backText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
})
