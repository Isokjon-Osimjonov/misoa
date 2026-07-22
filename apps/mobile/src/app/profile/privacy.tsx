import React from 'react'
import { ScrollView, Text, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '../../components/ui'
import { tokens } from '../../lib/tokens'

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Maxfiylik siyosati" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.text}>
            Misoa Market sizning shaxsiy ma'lumotlaringiz xavfsizligini ta'minlashga katta e'tibor qaratadi.
          </Text>
          <Text style={styles.text}>
            Ushbu dastur orqali yig'ilgan ma'lumotlar faqat buyurtmalarni yetkazib berish va xizmat sifatini yaxshilash maqsadida ishlatiladi.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  content: { padding: 24 },
  section: { backgroundColor: 'white', padding: 20, borderRadius: 12 },
  text: { fontSize: 14, color: tokens.colors.text, lineHeight: 22, marginBottom: 16 }
})
