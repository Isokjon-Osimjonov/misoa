import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Package } from 'lucide-react'
import { productsApi } from '../api/products.api'

interface ProductSearchSelectProps {
  onSelect: (product: any) => void
  placeholder?: string
  filterUzbStock?: boolean
}

export function ProductSearchSelect({
  onSelect,
  placeholder = "Mahsulot qidiring...",
  filterUzbStock = false
}: ProductSearchSelectProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products-search', search, filterUzbStock],
    queryFn: () => productsApi.list({
      q: search,
      limit: 20,
      location: filterUzbStock ? 'UZB_STORE' : undefined
    }),
    enabled: search.length >= 1,
    staleTime: 30000,
  })

  const products = data?.items ?? data ?? []

  const handleSelect = (product: any) => {
    onSelect(product)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && search.length >= 1 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Qidirilmoqda...
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Mahsulot topilmadi
            </div>
          )}

          {products.map((product: any) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
            >
              {/* Product image */}
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.brandName ?? ''}
                  {filterUzbStock ? ` • UZB: ${product.uzbStock ?? 0} ta` : ''}
                </p>
              </div>

              {/* Price */}
              <div className="text-sm font-medium text-right flex-shrink-0">
                {filterUzbStock
                  ? `${(product.priceUzs ?? 0).toLocaleString()} UZS`
                  : `₩${(product.priceKrw ?? 0).toLocaleString()}`
                }
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
