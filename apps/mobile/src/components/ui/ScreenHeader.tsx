import React from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ViewStyle
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { tokens } from '../../lib/tokens'

interface ScreenHeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  rightElement?: React.ReactNode
  style?: ViewStyle
}

export function ScreenHeader({
  title,
  onBack,
  showBack = true,
  rightElement,
  style,
}: ScreenHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <View style={[styles.header, style]}>
      {/* Center - title always centered via absolute positioning */}
      <Text
        style={styles.headerTitle}
        numberOfLines={1}>
        {title}
      </Text>

      {/* Left - back button or spacer */}
      {showBack ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather
            name="chevron-left"
            size={24}
            color={tokens.colors.text}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}

      {/* Right - action or spacer */}
      <View style={styles.rightSlot}>
        {rightElement ?? null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tokens.colors.background,
    position: 'relative',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: tokens.colors.text,
    paddingHorizontal: 56, // 40px btn + 16px padding
  },
  rightSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    zIndex: 1,
  },
})
