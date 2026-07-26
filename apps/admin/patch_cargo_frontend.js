const fs = require('fs');
const file = '/Users/isokjon/misoa/apps/admin/src/pages/cargo-shipments/CargoShipmentsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Imports
code = code.replace(/import { Package, Plus, Search, Trash2, Eye, CheckCircle2, Truck, PackageCheck, DollarSign, BarChart3 } from 'lucide-react'/, 
  "import { Package, Plus, Search, Trash2, Eye, CheckCircle2, Truck, PackageCheck, DollarSign, BarChart3, List, LayoutGrid } from 'lucide-react'");
code = code.replace(/import { productsApi } from '\.\.\/\.\.\/api\/products\.api'/,
  "import { productsApi } from '../../api/products.api'\nimport { inventoryApi } from '../../api/inventory.api'");

// 2. Schema
code = code.replace(/productName: z\.string\(\),/g, 
  "productName: z.string(),\n    imageUrl: z.string().optional(),\n    availableQty: z.coerce.number().optional(),");

// 3. ViewMode state
code = code.replace(/const \[showDetail, setShowDetail\] = useState\(false\)/, 
  "const [showDetail, setShowDetail] = useState(false)\n  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')");

// 4. Header with Toggle Buttons
code = code.replace(/<div className="flex items-center justify-between">\s+<h1 className="text-2xl font-bold flex items-center gap-2">\s+<Package className="w-6 h-6" \/> Kargo jo'natmalar\s+<\/h1>\s+<Button onClick=\{\(\) => setShowForm\(true\)\}>\s+<Plus className="w-4 h-4 mr-2" \/> Yangi kargo\s+<\/Button>\s+<\/div>/, 
  `<div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" /> Kargo jo'natmalar
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Yangi kargo
          </Button>
        </div>
      </div>`);

// 5. ProductSelection logic
code = code.replace(/onSelect=\{\(p: any\) => \{\s+const exists = fields\.find\(\(f: any\) => f\.productId === p\.id\)\s+if \(!exists\) \{\s+append\(\{ \s+productId: p\.id, \s+productName: p\.name, \s+quantity: 1, \s+buyPriceKrw: p\.priceKrw \?\? 0, \s+sellPriceUzs: p\.priceUzs \?\? 0 \s+\}\)\s+\}\s+\}\}/,
  `onSelect={async (p: any) => {
                      const exists = fields.find((f: any) => f.productId === p.id)
                      if (!exists) {
                        try {
                          const costData = await inventoryApi.getCostPrice(p.id)
                          append({ 
                            productId: p.id, 
                            productName: p.name, 
                            imageUrl: p.imageUrls?.[0] ?? '',
                            availableQty: costData?.availableQty ?? 0,
                            quantity: 1, 
                            buyPriceKrw: costData?.costPriceKrw ?? p.priceKrw ?? 0, 
                            sellPriceUzs: p.priceUzs ?? 0 
                          })
                        } catch(e) {
                          append({ 
                            productId: p.id, 
                            productName: p.name, 
                            imageUrl: p.imageUrls?.[0] ?? '',
                            availableQty: 0,
                            quantity: 1, 
                            buyPriceKrw: p.priceKrw ?? 0, 
                            sellPriceUzs: p.priceUzs ?? 0 
                          })
                        }
                      }
                    }}`);

// 6. Form items loop rendering
code = code.replace(/<div key=\{field\.id\} className="flex gap-2 items-end">\s+<div className="flex-1">\s+<Label className="text-xs">\{watch\(\`items\.\$\{index\}\.productName\`\)\}<\/Label>\s+<Input type="hidden" \{\.\.\.register\(\`items\.\$\{index\}\.productId\`\)\} \/>\s+<Input type="hidden" \{\.\.\.register\(\`items\.\$\{index\}\.productName\`\)\} \/>\s+<\/div>/,
  `<div key={field.id} className="flex gap-2 items-end">
                      {field.imageUrl && (
                        <div className="flex-shrink-0">
                          <img src={field.imageUrl} className="w-10 h-10 rounded-md object-cover border" alt="" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Label className="text-xs">{watch(\`items.\${index}.productName\`)}</Label>
                        <Input type="hidden" {...register(\`items.\${index}.productId\`)} />
                        <Input type="hidden" {...register(\`items.\${index}.productName\`)} />
                        <Input type="hidden" {...register(\`items.\${index}.imageUrl\`)} />
                        <Input type="hidden" {...register(\`items.\${index}.availableQty\`)} />
                        {field.availableQty !== undefined && (
                          <p className="text-[10px] text-muted-foreground mt-1">Mavjud: {field.availableQty} ta</p>
                        )}
                      </div>`);

// 7. Grid / Table view rendering
const tableStrStart = `<div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">`;

const newRenderCode = `{viewMode === 'table' ? (
      <div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Raqam</th>
              <th className="p-3">Sana</th>
              <th className="p-3">Status</th>
              <th className="p-3">Mahsulotlar</th>
              <th className="p-3">Kargo Narxi</th>
              <th className="p-3">Amal</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-4 text-center">Yuklanmoqda...</td></tr>
            ) : shipments.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">Ma'lumot topilmadi</td></tr>
            ) : (
              shipments.map((s: any, idx: number) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{s.shipmentNumber}</td>
                  <td className="p-3">{formatDate(s.dateSent)}</td>
                  <td className="p-3">
                    <CargoStatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-sm">{s.totalQuantity ?? 0} ta</td>
                  <td className="p-3">₩{s.totalCostKrw?.toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedShipment(s)
                      setShowDetail(true)
                    }}>
                      <Eye className="w-4 h-4 mr-1" /> Ko'rish
                    </Button>
                    {s.status === 'SENT' && (
                      <Button variant="outline" size="sm" onClick={() => {
                        if (confirm(\`Kargo #\${s.shipmentNumber} yetib kelganligini tasdiqlaysizmi? Barcha mahsulotlar UZB omboriga o'tkaziladi.\`)) {
                          markArrivedMutation.mutate(s.id)
                        }
                      }}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Yetdi ✓
                      </Button>
                    )}
                    {s.status === 'SENT' && (
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('Ochirishni xohlaysizmi?')) deleteMutation.mutate(s.id)
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-4 text-center">Yuklanmoqda...</div>
          ) : shipments.length === 0 ? (
            <div className="col-span-full p-4 text-center">Ma'lumot topilmadi</div>
          ) : (
            shipments.map((s: any) => (
              <div key={s.id} className="border rounded-xl p-4 bg-background hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedShipment(s); setShowDetail(true); }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">{s.shipmentNumber}</span>
                  <CargoStatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{formatDate(s.dateSent)}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Mahsulotlar</p>
                    <p className="font-medium">{s.totalQuantity ?? 0} ta</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Kargo</p>
                    <p className="font-medium">₩{(s.cargoFeeKrw ?? 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedShipment(s); setShowDetail(true); }}>
                    Ko'rish
                  </Button>
                  {s.status === 'SENT' && (
                    <Button size="sm" className="flex-1 text-xs" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(\`Kargo #\${s.shipmentNumber} yetib kelganligini tasdiqlaysizmi?\`)) {
                        markArrivedMutation.mutate(s.id);
                      }
                    }}>
                      Yetdi
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}`;

const oldTableMatch = code.match(/<div className="border rounded-md overflow-hidden bg-background">[\s\S]*?<\/table>\s*<\/div>/);
if (oldTableMatch) {
  code = code.replace(oldTableMatch[0], newRenderCode);
} else {
  console.log("Could not find table to replace");
}

// Write the file
fs.writeFileSync(file, code);
console.log("Patch applied successfully!");
