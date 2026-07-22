import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { tokens } from '../../lib/tokens'

interface AuthBottomSheetProps {
  visible: boolean
  onClose: () => void
  message: string
}

export function AuthBottomSheet({ visible, onClose, message }: AuthBottomSheetProps) {
  const router = useRouter()

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Kirish talab etiladi</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              onClose()
              router.push('/auth/login')
            }}
          >
            <Text style={styles.primaryText}>Kirish</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
            <Text style={styles.ghostText}>Hozir emas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: tokens.colors.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    color: tokens.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ghostBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
})
