import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

interface ProcessedImage {
  uri: string
  type: string
  name: string
}

export const pickAndProcessImage = async (
  options: {
    source?: 'library' | 'camera'
    allowsEditing?: boolean
  } = {}
): Promise<ProcessedImage | null> => {
  console.log('📷 pickAndProcessImage:', options)

  try {
    // Request permissions
    if (options.source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      console.log('Camera permission:', status)
      if (status !== 'granted') {
        throw new Error('Kamera ruxsati berilmadi')
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('Library permission:', status)
      if (status !== 'granted') {
        throw new Error('Galereya ruxsati berilmadi')
      }
    }

    // Launch picker
    const result = options.source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: options.allowsEditing ?? false,
          aspect: options.allowsEditing ? [1, 1] : undefined,
          quality: 1,
          exif: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: options.allowsEditing ?? false,
          aspect: options.allowsEditing ? [1, 1] : undefined,
          quality: 1,
          exif: false,
        })

    console.log('Picker canceled:', result.canceled)

    if (result.canceled || !result.assets?.length) {
      return null
    }

    const asset = result.assets[0]
    console.log('Asset URI:', asset.uri)
    console.log('Asset size:', asset.fileSize)
    console.log('Asset type:', asset.mimeType)

    // Process image
    let manipResult
    try {
      const actions = asset.fileSize && asset.fileSize < 500000
        ? [] // small file - no resize
        : [{ resize: { width: 1920 } }]

      manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        actions,
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )
      console.log('Processed:', manipResult.uri)
    } catch (manipErr) {
      console.log('Manipulator failed, using original:', manipErr)
      manipResult = { uri: asset.uri }
    }

    return {
      uri: manipResult.uri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    }

  } catch (err: any) {
    console.log('❌ pickAndProcessImage error:', err)
    throw err
  }
}

export const uploadImageToApi = async (
  image: ProcessedImage,
  endpoint: string,
  fieldName = 'file'
): Promise<any> => {
  console.log('📤 uploadImageToApi:', endpoint, fieldName)

  const formData = new FormData()

  formData.append(fieldName, {
    uri: image.uri,
    type: image.type,
    name: image.name,
  } as any)

  const { default: api } = await import('../lib/api')

  const response = await api.post(
    endpoint,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
      transformRequest: (data) => data,
    }
  )

  return response.data
}
