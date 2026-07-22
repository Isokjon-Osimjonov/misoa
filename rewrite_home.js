const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'apps/mobile/src/app/(tabs)/home.tsx')
let content = fs.readFileSync(file, 'utf8')

// Add states for infinite scroll
const statesHook = `
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [allProductsPage, setAllProductsPage] = useState(1)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [hasMoreProducts, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMoreProducts = async () => {
    if (loadingMore || !hasMoreProducts) return
    setLoadingMore(true)
    try {
      const result = await productService.getProducts({
        page: allProductsPage,
        limit: 20,
        region: activeRegion as any,
      })
      const items = result.data ?? []
      const total = result.meta?.total ?? 0
      
      if (allProducts.length + items.length >= total || items.length === 0) {
        setHasMore(false)
      }
      setAllProducts((prev) => (allProductsPage === 1 ? items : [...prev, ...items]))
      setAllProductsPage((p) => p + 1)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadMoreProducts()
  }, [activeRegion])
`
content = content.replace('  const [isRefreshing, setIsRefreshing] = useState(false)', statesHook)

// Fix category routing
content = content.replace(
  `params: { categoryId: item.id }`,
  `params: { categoryId: item.id, categoryName: item.name }`
)

// Replace ScrollView with FlatList
const scrollStart = `<ScrollView\n        showsVerticalScrollIndicator={false}\n        contentContainerStyle={styles.scrollContent}\n        refreshControl={\n          <RefreshControl\n            refreshing={isRefreshing}\n            onRefresh={handleRefresh}\n            tintColor={tokens.colors.primary}\n            colors={[tokens.colors.primary]}\n          />\n        }\n      >`
const listHeaderStart = `      <FlatList
        data={allProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 24, marginBottom: 12 }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            showUzs={showUzs}
            onPress={() => router.push(\`/product/\${item.id}\`)}
            onAddToCart={() => handleAddToCart(item.id)}
          />
        )}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setAllProductsPage(1)
              setHasMore(true)
              await handleRefresh()
              await loadMoreProducts()
            }}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        ListFooterComponent={() =>
          loadingMore ? (
            <ActivityIndicator color={tokens.colors.primary} style={{ padding: 20 }} />
          ) : !hasMoreProducts && allProducts.length > 0 ? (
            <Text style={{ textAlign: 'center', margin: 20, color: tokens.colors.textMuted }}>
              Barcha mahsulotlar ko'rsatildi
            </Text>
          ) : null
        }
        ListHeaderComponent={
          <>`

content = content.replace(scrollStart, listHeaderStart)

const scrollEnd = `          )}
        </View>
      </ScrollView>`
const listHeaderEnd = `          )}
        </View>

        <View style={styles.section}>
          <View style={styles.paddingX}>
            <SectionHeader title="Barcha mahsulotlar" />
          </View>
        </View>
        <View style={{ height: 16 }} />
        </>
        }
      />`
content = content.replace(scrollEnd, listHeaderEnd)
content = content.replace(`import { ActivityIndicator } from 'react-native'`, '')
content = content.replace(`import {`, `import {\n  ActivityIndicator,`)

fs.writeFileSync(file, content)
console.log('home.tsx updated')
