import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Feather } from '@expo/vector-icons'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../lib/auth-store'
import { useRegionStore } from '../../lib/region-store'
import { useExchangeStore } from '../../lib/exchange-store'
import { productService } from '../../services/product.service'
import { ProductCard } from '../../components/ui/ProductCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'
import { tokens } from '../../lib/tokens'
import { useCartStore } from '../../lib/cart-store'

interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children: Category[]
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2

export default function CategoriesScreen() {
  const params = useLocalSearchParams<{
    categoryId?: string
    sort?: string
  }>()

  const [selectedL1, setSelectedL1] = useState<Category | null>(null)
  const [selectedL2, setSelectedL2] = useState<Category | null>(null)
  const [selectedL3, setSelectedL3] = useState<Category | null>(null)

  const activeCategoryId = selectedL3?.id ?? selectedL2?.id ?? selectedL1?.id ?? null

  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [sortOption, setSortOption] = useState<string>(params.sort || 'newest')

  const customer = useAuthStore((s) => s.customer)
  const guestRegion = useRegionStore((s) => s.guestRegion)
  const activeRegion = customer?.phoneRegion || guestRegion
  const showUzs = activeRegion === 'UZB'

  const addItem = useCartStore((s) => s.addItem)
  const [addingId, setAddingId] = useState<string | null>(null)

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    staleTime: 5 * 60 * 1000,
  })
  
  const categories = categoriesData ?? []

  // Init category from params
  useEffect(() => {
    if (params.categoryId && categories.length > 0) {
      // Need to find category in tree
      let l1 = null, l2 = null, l3 = null
      for (const root of categories) {
        if (root.id === params.categoryId) { l1 = root; break }
        if (root.children) {
          for (const child of root.children) {
            if (child.id === params.categoryId) { l1 = root; l2 = child; break }
            if (child.children) {
              for (const sub of child.children) {
                if (sub.id === params.categoryId) { l1 = root; l2 = child; l3 = sub; break }
              }
            }
          }
        }
      }
      if (l1) setSelectedL1(l1)
      if (l2) setSelectedL2(l2)
      if (l3) setSelectedL3(l3)
    }
  }, [params.categoryId, categories])

  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProducts,
  } = useInfiniteQuery({
    queryKey: ['products-infinite', activeCategoryId, searchQuery, activeRegion, sortOption],
    queryFn: ({ pageParam = 1 }) =>
      productService.getProducts({
        sort: sortOption as any,
        limit: 12,
        page: pageParam,
        category: activeCategoryId ?? undefined,
        q: searchQuery || undefined,
        region: activeRegion as any,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.meta.hasNext) return lastPage.meta.page + 1
      return undefined
    },
    staleTime: 2 * 60 * 1000,
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchCategories(), refetchProducts()])
    setIsRefreshing(false)
  }

  const products = productsData?.pages.flatMap((p: any) => p.data) ?? []

  const handleAddToCart = async (productId: string) => {
    if (addingId) return
    setAddingId(productId)
    try {
      await addItem(productId, 1)
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      if (code === 'REGION_MISMATCH') {
        Alert.alert(
          'Hudud mos kelmaydi',
          "Savatingizda boshqa hududdan mahsulot bor. Savatni tozalab qayta urinib ko'ring.",
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('Xatolik', err?.response?.data?.error?.message ?? "Savatga qo'shib bo'lmadi")
      }
    } finally {
      setAddingId(null)
    }
  }

  const handleSelectL1 = (cat: Category) => {
    if (selectedL1?.id === cat.id) {
      setSelectedL1(null)
      setSelectedL2(null)
      setSelectedL3(null)
    } else {
      setSelectedL1(cat)
      setSelectedL2(null)
      setSelectedL3(null)
    }
  }

  const handleSelectL2 = (cat: Category) => {
    if (selectedL2?.id === cat.id) {
      setSelectedL2(null)
      setSelectedL3(null)
    } else {
      setSelectedL2(cat)
      setSelectedL3(null)
    }
  }

  const handleSelectL3 = (cat: Category) => {
    if (selectedL3?.id === cat.id) {
      setSelectedL3(null)
    } else {
      setSelectedL3(cat)
    }
  }

  const renderHeader = () => (
    <View style={{ paddingBottom: 16 }}>
      {/* SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchContainer,
            {
              borderWidth: searchFocused ? 1 : 0.5,
              borderColor: searchFocused ? tokens.colors.primary : tokens.colors.border,
            },
          ]}
        >
          <Feather name="search" size={16} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Mahsulot qidiring..."
            placeholderTextColor={tokens.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Feather name="x" size={16} color={tokens.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filtersContainer}>
        {/* LEVEL 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          <TouchableOpacity
            style={[styles.pill, activeCategoryId === null && styles.pillActive]}
            onPress={() => {
              setSelectedL1(null)
              setSelectedL2(null)
              setSelectedL3(null)
            }}
          >
            <Text style={[styles.pillText, activeCategoryId === null && styles.pillTextActive]}>Hammasi</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, selectedL1?.id === cat.id && styles.pillActive]}
              onPress={() => handleSelectL1(cat)}
            >
              <Text style={[styles.pillText, selectedL1?.id === cat.id && styles.pillTextActive]} numberOfLines={1}>
                {cat.name}
              </Text>
              {cat.children && cat.children.length > 0 && (
                <Feather
                  name={selectedL1?.id === cat.id ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={selectedL1?.id === cat.id ? tokens.colors.white : tokens.colors.textMuted}
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LEVEL 2 */}
        {selectedL1 && selectedL1.children && selectedL1.children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsRow, styles.pillsRowIndented]}>
            {selectedL1.children.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, styles.pillSm, selectedL2?.id === cat.id && styles.pillActive]}
                onPress={() => handleSelectL2(cat)}
              >
                <Text style={[styles.pillText, styles.pillTextSm, selectedL2?.id === cat.id && styles.pillTextActive]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {cat.children && cat.children.length > 0 && (
                  <Feather
                    name={selectedL2?.id === cat.id ? 'chevron-up' : 'chevron-down'}
                    size={10}
                    color={selectedL2?.id === cat.id ? tokens.colors.white : tokens.colors.textMuted}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* LEVEL 3 */}
        {selectedL2 && selectedL2.children && selectedL2.children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsRow, styles.pillsRowIndented]}>
            {selectedL2.children.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, styles.pillSm, selectedL3?.id === cat.id && styles.pillActive]}
                onPress={() => handleSelectL3(cat)}
              >
                <Text style={[styles.pillText, styles.pillTextSm, selectedL3?.id === cat.id && styles.pillTextActive]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      
     
    </View>
  )

  const renderEmpty = () => {
    if (productsLoading) {
      return (
        <View style={styles.paddingX}>
          {[0, 1].map((row) => (
            <View key={`row-${row}`} style={[styles.gridRow, { marginBottom: 12 }]}>
              <SkeletonLoader width={CARD_WIDTH} height={220} borderRadius={16} />
              <SkeletonLoader width={CARD_WIDTH} height={220} borderRadius={16} />
            </View>
          ))}
        </View>
      )
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', marginTop: 40 }}>
        <EmptyState icon="package" heading="Mahsulot topilmadi" subtitle="Boshqa kategoriyani tanlang" />
      </View>
    )
  }

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator style={{ margin: 20 }} color={tokens.colors.primary} />
    }
    if (!hasNextPage && products.length > 0) {
      return <Text style={styles.endText}>Barcha mahsulotlar ko'rsatildi</Text>
    }
    return <View style={{ height: 80 }} /> // bottom padding
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={tokens.colors.primary} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            showUzs={showUzs}
            onPress={() => router.push(`/product/${item.id}`)}
            onAddToCart={() => handleAddToCart(item.id)}
          />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  searchWrapper: { paddingHorizontal: tokens.spacing.lg, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.sm },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 24, backgroundColor: tokens.colors.surface, paddingHorizontal: 16, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: tokens.colors.text },
  filtersContainer: { marginTop: tokens.spacing.sm, gap: 8 },
  pillsRow: { paddingHorizontal: tokens.spacing.lg, gap: 8, paddingBottom: 2, flexDirection: 'row', alignItems: 'center' },
  pillsRowIndented: { paddingLeft: tokens.spacing.xl },
  pill: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: tokens.colors.surface, borderWidth: 0.5, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  pillSm: { height: 30, paddingHorizontal: 12, borderRadius: 15 },
  pillActive: { backgroundColor: tokens.colors.primary, borderWidth: 0 },
  pillText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: tokens.colors.textSecondary },
  pillTextSm: { fontSize: 12 },
  pillTextActive: { color: tokens.colors.white, fontWeight: '500' },
  paddingX: { paddingHorizontal: 24 },
  listContent: { paddingBottom: 20 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingHorizontal: 24 },
  endText: { textAlign: 'center', margin: 20, color: tokens.colors.textMuted },
})
