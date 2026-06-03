interface Product {
  id: number
  name: string
  price: number | string
  category: string | null
  stock: number
}

interface ProductCardProps {
  product: Product
  onClick: (product: Product) => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  return (
    <button
      onClick={() => onClick(product)}
      disabled={product.stock === 0}
      className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-400 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 text-sm leading-tight">{product.name}</p>
        {product.category && (
          <span className="shrink-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-indigo-600 mt-2">₱{price.toFixed(2)}</p>
      <p className="text-xs text-gray-400 mt-1">Stock: {product.stock}</p>
    </button>
  )
}
