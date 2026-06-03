'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/Modal'

interface Product {
  id: number
  name: string
  price: number | string
  category: string | null
  stock: number
}

const emptyForm = { name: '', price: '', category: '', customCategory: '', stock: '0' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadProducts() {
    const data = await fetch('/api/products').then(r => r.json())
    setProducts(data)
  }

  useEffect(() => { loadProducts().finally(() => setLoading(false)) }, [])

  // Derive unique categories from existing products
  const existingCategories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean) as string[])
  ).sort()

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    const cat = p.category ?? ''
    const isKnown = existingCategories.includes(cat)
    setForm({
      name: p.name,
      price: String(p.price),
      category: isKnown ? cat : cat ? '__custom__' : '',
      customCategory: isKnown ? '' : cat,
      stock: String(p.stock),
    })
    setModalOpen(true)
  }

  function effectiveCategory() {
    if (form.category === '__custom__') return form.customCategory.trim()
    return form.category
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name,
        price: parseFloat(form.price),
        category: effectiveCategory() || null,
        stock: parseInt(form.stock, 10),
      }
      const url = editing ? `/api/products/${editing.id}` : '/api/products'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to save product'); return }
      toast.success(editing ? 'Product updated' : 'Product added')
      setModalOpen(false)
      await loadProducts()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      setProducts(prev => prev.filter(x => x.id !== p.id))
    } else {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + Add
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No products yet.</p>
          <button onClick={openAdd} className="mt-3 text-indigo-600 underline">Add your first product</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {products.map(p => (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.category && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{p.category}</span>
                    )}
                    <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                  </div>
                </div>
                <p className="font-semibold text-indigo-600">₱{Number(p.price).toFixed(2)}</p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 font-medium px-2 py-1 rounded bg-indigo-50">Edit</button>
                  <button onClick={() => handleDelete(p)} className="text-xs text-red-500 font-medium px-2 py-1 rounded bg-red-50">Del</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Price</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.category ? (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{p.category}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₱{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.stock}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value, customCategory: '' }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            >
              <option value="">— No category —</option>
              {existingCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Add new category...</option>
            </select>
            {form.category === '__custom__' && (
              <input
                type="text"
                value={form.customCategory}
                onChange={e => setForm(prev => ({ ...prev, customCategory: e.target.value }))}
                placeholder="New category name"
                required
                autoFocus
                className="mt-2 w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={e => setForm(prev => ({ ...prev, stock: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
