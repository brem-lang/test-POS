'use client'

import { useEffect, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ProductCard from '@/components/ProductCard'
import CartItemComponent, { CartEntry } from '@/components/CartItem'
import ReceiptModal from '@/components/ReceiptModal'

interface Product {
  id: number
  name: string
  price: number | string
  category: string | null
  stock: number
}

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; product_id: number }
  | { type: 'SET_QTY'; product_id: number; qty: number }
  | { type: 'CLEAR' }

function cartReducer(state: CartEntry[], action: CartAction): CartEntry[] {
  switch (action.type) {
    case 'ADD': {
      const price = typeof action.product.price === 'string' ? parseFloat(action.product.price) : action.product.price
      const existing = state.find(i => i.product_id === action.product.id)
      if (existing) return state.map(i => i.product_id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...state, { product_id: action.product.id, name: action.product.name, unit_price: price, quantity: 1 }]
    }
    case 'REMOVE': return state.filter(i => i.product_id !== action.product_id)
    case 'SET_QTY':
      if (action.qty <= 0) return state.filter(i => i.product_id !== action.product_id)
      return state.map(i => i.product_id === action.product_id ? { ...i, quantity: action.qty } : i)
    case 'CLEAR': return []
    default: return state
  }
}

export default function POSPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [charging, setCharging] = useState(false)
  const [receipt, setReceipt] = useState<{ orderId: number; items: CartEntry[]; total: number } | null>(null)
  // Mobile tab: 'products' | 'cart'
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products')

  useEffect(() => {
    fetch('/api/sessions/current', { cache: 'no-store' }).then(r => {
      if (!r.ok) { router.push('/open-session'); return null }
      return r.json()
    }).then(s => { if (s) setSessionId(s.id) })
    fetch('/api/products', { cache: 'no-store' }).then(r => r.json()).then(setProducts)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || p.category === category
    return matchSearch && matchCat
  })
  const total = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  async function handleCharge() {
    if (!cart.length) { toast.error('Cart is empty'); return }
    if (!sessionId) { toast.error('No active session'); return }
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered)
      if (isNaN(tendered) || tendered < total) {
        toast.error('Amount tendered must be at least the total')
        return
      }
    }
    setCharging(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          payment_method: paymentMethod,
          items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
        }),
      })
      if (!res.ok) { toast.error('Failed to place order'); return }
      const order = await res.json()
      setReceipt({ orderId: order.id, items: [...cart], total })
    } finally {
      setCharging(false)
    }
  }

  function handleReceiptClose() {
    setReceipt(null)
    dispatch({ type: 'CLEAR' })
    setAmountTendered('')
    setMobileTab('products')
    toast.success('Order completed!')
  }

  // Product grid panel
  const productsPanel = (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
        {filtered.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={p => {
              dispatch({ type: 'ADD', product: p })
              // On mobile, briefly show feedback
            }}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No products found</p>
        )}
      </div>
    </div>
  )

  // Cart panel
  const cartPanel = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Cart</h2>
        <p className="text-xs text-gray-400">{cartCount} item(s)</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {cart.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">Cart is empty</p>
        ) : (
          cart.map(item => (
            <CartItemComponent
              key={item.product_id}
              item={item}
              onQtyChange={(id, qty) => dispatch({ type: 'SET_QTY', product_id: id, qty })}
              onRemove={id => dispatch({ type: 'REMOVE', product_id: id })}
            />
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-100 space-y-3">
        <div className="flex justify-between font-bold text-xl">
          <span>Total</span>
          <span>₱{total.toFixed(2)}</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
          >
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${paymentMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
          >
            Card
          </button>
        </div>
        {paymentMethod === 'cash' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount Tendered</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-medium">₱</span>
              <input
                type="number"
                min={total}
                step="0.01"
                value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                placeholder={total.toFixed(2)}
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            {amountTendered && parseFloat(amountTendered) >= total && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Change</p>
                <p className="text-3xl font-bold text-green-700">₱{(parseFloat(amountTendered) - total).toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleCharge}
          disabled={charging || cart.length === 0}
          className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 active:scale-95"
        >
          {charging ? 'Processing...' : `Charge ₱${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop layout: side by side */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {productsPanel}
        </div>
        <div className="w-80 xl:w-96 border-l border-gray-200 flex flex-col">
          {cartPanel}
        </div>
      </div>

      {/* Mobile layout: tabs */}
      <div className="flex flex-col md:hidden" style={{ height: 'calc(100vh - 112px)' }}>
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-white shrink-0">
          <button
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${mobileTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            Products
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${mobileTab === 'cart' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          >
            Cart
            {cartCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-50">
          {mobileTab === 'products' ? productsPanel : cartPanel}
        </div>
      </div>

      {receipt && (
        <ReceiptModal
          open
          onClose={handleReceiptClose}
          orderId={receipt.orderId}
          items={receipt.items}
          total={receipt.total}
          paymentMethod={paymentMethod}
          amountTendered={paymentMethod === 'cash' ? parseFloat(amountTendered) : undefined}
        />
      )}
    </>
  )
}
