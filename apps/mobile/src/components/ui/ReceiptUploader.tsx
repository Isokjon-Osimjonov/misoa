import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  Image, ActivityIndicator,
  StyleSheet, Alert
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { tokens } from '../../lib/tokens'
import {
  pickAndProcessImage,
  uploadImageToApi
} from '../../utils/image.utils'

type UploadState =
  'idle' | 'uploading' | 'success' | 'error'

interface ReceiptUploaderProps {
  onUpload: (url: string) => void
  initialUrl?: string
  disabled?: boolean
}

export function ReceiptUploader({
  onUpload,
  initialUrl,
  disabled = false
}: ReceiptUploaderProps) {
  const [state, setState] =
    useState<UploadState>(
      initialUrl ? 'success' : 'idle')
  const [imageUrl, setImageUrl] =
    useState<string | null>(
      initialUrl ?? null)
  const [errorMsg, setErrorMsg] =
    useState<string | null>(null)

  const handlePick = async (
    source: 'library' | 'camera'
  ) => {
    if (disabled) return
    
    try {
      setState('uploading')
      setErrorMsg(null)

      const image = await
        pickAndProcessImage({ source })
      
      if (!image) {
        setState(imageUrl ? 'success' : 'idle')
        return
      }

      const result = await uploadImageToApi(
        image,
        '/upload/receipt',
        'receipt'
      )

      const url = result?.data?.url
        ?? result?.url

      if (!url) throw new Error(
        'URL qaytarilmadi')

      setImageUrl(url)
      setState('success')
      onUpload(url)

    } catch (err: any) {
      setState('error')
      setErrorMsg(
        err?.response?.data?.error?.message
        ?? err?.message
        ?? 'Xatolik yuz berdi'
      )
    }
  }

  const showSourcePicker = () => {
    Alert.alert(
      'Kvitansiya',
      'Qayerdan yuklaysiz?',
      [
        {
          text: '📷 Kamera',
          onPress: () => handlePick('camera')
        },
        {
          text: '🖼 Galereya',
          onPress: () => handlePick('library')
        },
        {
          text: 'Bekor qilish',
          style: 'cancel'
        }
      ]
    )
  }

  // IDLE STATE - placeholder
  if (state === 'idle') {
    return (
      <TouchableOpacity
        style={styles.placeholder}
        onPress={showSourcePicker}
        disabled={disabled}
        activeOpacity={0.7}>
        <Feather name="image"
          size={32}
          color={tokens.colors.textMuted}
        />
        <Text style={styles.placeholderText}>
          Kvitansiya yuklash
        </Text>
        <Text style={styles.placeholderSub}>
          Rasm tanlang yoki suratga oling
        </Text>
      </TouchableOpacity>
    )
  }

  // UPLOADING STATE - spinner
  if (state === 'uploading') {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator
          size="large"
          color={tokens.colors.primary}
        />
        <Text style={styles.uploadingText}>
          Yuklanmoqda...
        </Text>
      </View>
    )
  }

  // ERROR STATE
  if (state === 'error') {
    return (
      <TouchableOpacity
        style={[styles.placeholder,
          styles.errorContainer]}
        onPress={showSourcePicker}
        activeOpacity={0.7}>
        <Feather name="alert-circle"
          size={32}
          color={tokens.colors.error
            ?? '#EF4444'}
        />
        <Text style={styles.errorText}>
          {errorMsg ?? 'Xatolik yuz berdi'}
        </Text>
        <Text style={styles.retryText}>
          Qayta urinish →
        </Text>
      </TouchableOpacity>
    )
  }

  // SUCCESS STATE - image preview
  return (
    <View style={styles.successContainer}>
      <Image
        source={{ uri: imageUrl! }}
        style={styles.preview}
        resizeMode="cover"
      />
      <View style={styles.successBadge}>
        <Feather name="check-circle"
          size={16}
          color="#10B981"
        />
        <Text style={styles.successText}>
          Yuklandi
        </Text>
      </View>
      <TouchableOpacity
        style={styles.changeBtn}
        onPress={showSourcePicker}
        disabled={disabled}>
        <Feather name="refresh-cw"
          size={14}
          color={tokens.colors.primary}
        />
        <Text style={styles.changeBtnText}>
          Almashtirish
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    gap: 8,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '500',
    color: tokens.colors.text,
  },
  placeholderSub: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    marginTop: 12,
  },
  errorContainer: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 13,
    color: tokens.colors.primary,
    fontWeight: '500',
  },
  successContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  preview: {
    width: '100%',
    height: 200,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#F0FDF4',
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  changeBtnText: {
    fontSize: 13,
    color: tokens.colors.primary,
    fontWeight: '500',
  },
})
