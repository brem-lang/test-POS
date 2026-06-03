export interface CartEntry {
  product_id: number
  name: string
  unit_price: number
  quantity: number
}

interface CartItemProps {
  item: CartEntry
  onQtyChange: (product_id: number, qty: number) => void
  onRemove: (product_id: number) => void
}

export default function CartItem({ item, onQtyChange, onRemove }: CartItemProps) {
  const lineTotal = item.unit_price * item.quantity
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400">₱{item.unit_price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(item.product_id, item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center active:bg-gray-300"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          onClick={() => onQtyChange(item.product_id, item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center active:bg-gray-300"
        >
          +
        </button>
      </div>
      <div className="text-right w-20">
        <p className="text-sm font-semibold text-gray-900">₱{lineTotal.toFixed(2)}</p>
        <button
          onClick={() => onRemove(item.product_id)}
          className="text-xs text-red-400 hover:text-red-600"
        >
          remove
        </button>
      </div>
    </div>
  )
}
