import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

export async function pickAndProcessImage(
  options: ImagePicker.ImagePickerOptions = {}
): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    ...options,
  })

  if (result.canceled || !result.assets || !result.assets[0]) return null

  const uri = result.assets[0].uri

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )
    return manipResult.uri
  } catch (error) {
    console.error('Image processing failed:', error)
    return uri
  }
}

export async function captureAndProcessImage(
  options: ImagePicker.ImagePickerOptions = {}
): Promise<string | null> {
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    ...options,
  })

  if (result.canceled || !result.assets || !result.assets[0]) return null

  const uri = result.assets[0].uri

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )
    return manipResult.uri
  } catch (error) {
    console.error('Image processing failed:', error)
    return uri
  }
}
