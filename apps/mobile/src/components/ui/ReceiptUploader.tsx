import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity,
  Image, ActivityIndicator,
  StyleSheet, Alert
} from 'react-native'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera
} from 'lucide-react-native'
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
      'Kvitansiya yuklash',
      '',
      [
        {
          text: 'Kamera',
          onPress: () => handlePick('camera')
        },
        {
          text: 'Galereya',
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
        <Upload
          size={24}
          color={tokens.colors.textMuted}
        />
        <Text style={styles.placeholderText}>
          Kvitansiya yuklash
        </Text>
      </TouchableOpacity>
    )
  }

  // UPLOADING STATE - spinner
  if (state === 'uploading') {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator
          size="small"
          color={tokens.colors.primary}
        />
        <Text style={styles.uploadingText}>
          Yuklanmoqda
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
        <AlertCircle
          size={20}
          color="#EF4444"
        />
        <Text style={styles.errorText}>
          {errorMsg ?? 'Xatolik yuz berdi'}
        </Text>
        <Text style={styles.retryText}>
          Qayta urinish
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
      <View style={styles.successRow}>
        <CheckCircle2
          size={14}
          color="#10B981"
        />
        <Text style={styles.successText}>
          Yuklandi
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          onPress={showSourcePicker}
          disabled={disabled}>
          <RefreshCw
            size={14}
            color={tokens.colors.textMuted}
          />
          <Text style={styles.changeText}>
            O'zgartirish
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    gap: 6,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.textMuted,
  },
  uploadingText: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    borderColor: '#FCA5A5',
    borderStyle: 'solid',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 12,
    color: tokens.colors.primary,
  },
  successContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  preview: {
    width: '100%',
    height: 180,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: tokens.colors.surface,
    gap: 6,
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
  },
  changeText: {
    fontSize: 13,
    color: tokens.colors.textMuted,
  },
})
