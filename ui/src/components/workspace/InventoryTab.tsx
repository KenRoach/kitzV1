import { useEffect, useState } from 'react'
import { Package, AlertTriangle, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useWorkspaceStore, type Product } from '@/stores/workspaceStore'

export function InventoryTab() {
  const { products, isLoading, fetchProducts, addProduct, updateProduct, deleteProduct } = useWorkspaceStore()
  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [category, setCategory] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [imageUrl, setImageUrl] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => { void fetchProducts() }, [fetchProducts])

  const activeProducts = products.filter(p => p.is_active)
  const lowStock = activeProducts.filter(p => p.stock_qty <= p.low_stock_threshold && p.stock_qty > 0)
  const outOfStock = activeProducts.filter(p => p.stock_qty === 0)

  const resetForm = () => {
    setName(''); setSku(''); setDescription(''); setPrice(''); setCost('')
    setCategory(''); setStockQty('0'); setLowStockThreshold('5'); setImageUrl(''); setEditId(null)
  }

  const startEdit = (p: Product) => {
    setEditId(p.id); setName(p.name); setSku(p.sku || ''); setDescription(p.description || '')
    setPrice(String(p.price)); setCost(String(p.cost || '')); setCategory(p.category || '')
    setStockQty(String(p.stock_qty)); setLowStockThreshold(String(p.low_stock_threshold)); setImageUrl(p.image_url || '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price) return
    const data = {
      name, sku, description, price: parseFloat(price), cost: parseFloat(cost) || 0,
      category, stock_qty: parseInt(stockQty) || 0, low_stock_threshold: parseInt(lowStockThreshold) || 5,
      image_url: imageUrl, is_active: true,
    }
    if (editId) {
      await updateProduct(editId, data)
    } else {
      await addProduct(data)
    }
    resetForm()
  }

  const stockColor = (p: Product) => {
    if (p.stock_qty === 0) return 'text-red-500'
    if (p.stock_qty <= p.low_stock_threshold) return 'text-amber-500'
    return 'text-green-500'
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" /> {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock
            </div>
          )}
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <Package className="h-4 w-4" /> {outOfStock.length} out of stock
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-purple-500">{activeProducts.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Active Products</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{lowStock.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Low Stock</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{outOfStock.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Out of Stock</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{editId ? 'Edit Product' : 'Add Product'}</h3>
          {editId && (
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Product name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
            <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-001"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Product description"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Price *</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
            <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stock Qty</label>
            <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Low Stock At</label>
            <input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} placeholder="5"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Food, Services"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black outline-none focus:border-purple-500" />
          </div>
        </div>
        <button type="submit" className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 transition">
          <Plus className="h-4 w-4" /> {editId ? 'Update' : 'Add Product'}
        </button>
      </form>

      {/* Product List */}
      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {products.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">No products yet. Add your first product above.</p>
      )}
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className={`flex items-center justify-between rounded-lg border ${p.is_active ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-60'} px-4 py-3 transition hover:bg-gray-50`}>
            <div className="flex items-center gap-3">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-black">{p.name}</p>
                  {p.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{p.category}</span>}
                  {!p.is_active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500">Inactive</span>}
                </div>
                <p className="text-xs text-gray-400">{p.sku ? `SKU: ${p.sku} · ` : ''}${p.price.toFixed(2)}{p.cost ? ` · Cost: $${p.cost.toFixed(2)}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-sm font-semibold ${stockColor(p)}`}>
                {p.stock_qty} in stock
              </span>
              <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600" aria-label={`Edit ${p.name}`}>
                <Pencil className="h-4 w-4" />
              </button>
              {p.is_active && (
                <button onClick={() => deleteProduct(p.id)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500" aria-label={`Delete ${p.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
