import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, ChevronUp, X, Package } from 'lucide-react'
import { productsApi } from '../api/products.api'
import { cn } from '../lib/utils'

interface ProductSearchSelectProps {
  onSelect: (product: any) => void
  placeholder?: string
  filterUzbStock?: boolean
  selectedIds?: string[]
}

export function ProductSearchSelect({
  onSelect,
  placeholder = "Mahsulot tanlang...",
  filterUzbStock = false,
  selectedIds = []
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch products - load all on open
  // filter by search
  const { data, isLoading } = useQuery({
    queryKey: ['products-search', search, filterUzbStock],
    queryFn: () => productsApi.list({
      q: search || undefined,
      limit: 50,
      location: filterUzbStock ? 'UZB_STORE' : undefined
    }),
    enabled: open,
    staleTime: 60000,
  })

  const rawProducts = data?.data ?? []
  const productsArray = Array.isArray(rawProducts) ? rawProducts : []
  const products = productsArray.filter(
    (p: any) => !selectedIds.includes(p.id)
  )

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSelect = (product: any) => {
    onSelect(product)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full flex items-center gap-2",
          "px-3 py-2 border rounded-lg",
          "text-sm text-left",
          "bg-background hover:bg-muted/30",
          "transition-colors",
          open && "border-primary ring-1 ring-primary/20"
        )}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-muted-foreground">
          {placeholder}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg">

          {/* Search input inside dropdown */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Product list */}
          <div className="max-h-60 overflow-y-auto">

            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Yuklanmoqda...
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {search ? 'Mahsulot topilmadi' : 'Mahsulotlar yo\'q'}
              </div>
            )}

            {products.map((product: any) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors border-b last:border-0"
              >
                {/* Image */}
                {(() => {
                  const imageUrl = product.imageUrls?.[0]
                  
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-9 h-9 rounded-md object-cover border flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )
                })()}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.brandName ?? ''}
                    {filterUzbStock && product.uzbStock != null ? ` • ${product.uzbStock} ta mavjud` : ''}
                  </p>
                </div>

                {/* Show Korea retail price */}
                <span className="text-sm font-medium text-right flex-shrink-0 text-muted-foreground">
                  ₩{(product.retailPrice ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
