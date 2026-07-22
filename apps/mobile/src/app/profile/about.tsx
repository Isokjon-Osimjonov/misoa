import React from 'react'
import { ScrollView, Text, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '../../components/ui'
import { tokens } from '../../lib/tokens'

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Biz haqimizda" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.text}>
            Misoa Market - bu sifatli va hamyonbop kosmetika mahsulotlarini taklif etuvchi onlayn platforma.
          </Text>
          <Text style={styles.text}>
            Biz mijozlarimizga eng yaxshi mahsulotlarni yetkazib berish va sifatli xizmat ko'rsatishni o'z oldimizga maqsad qilib qo'yganmiz.
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
