import Modal from './Modal'
import { CartEntry } from './CartItem'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  orderId: number | null
  items: CartEntry[]
  total: number
  paymentMethod: 'cash' | 'card'
  amountTendered?: number
}

export default function ReceiptModal({
  open, onClose, orderId, items, total, paymentMethod, amountTendered,
}: ReceiptModalProps) {
  const change = paymentMethod === 'cash' && amountTendered ? amountTendered - total : 0

  return (
    <Modal open={open} onClose={onClose} title="Receipt">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Order #{orderId}</p>
          <p className="text-green-600 font-semibold">Payment Successful</p>
        </div>
        <div className="border rounded-lg p-3 space-y-1">
          {items.map((item) => (
            <div key={item.product_id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.name} × {item.quantity}</span>
              <span className="font-medium">₱{(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Payment</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>
          {paymentMethod === 'cash' && amountTendered != null && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tendered</span>
                <span>₱{amountTendered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-green-700">
                <span>Change</span>
                <span>₱{change.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  )
}
