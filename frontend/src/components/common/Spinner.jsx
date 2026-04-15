export default function Spinner({ size = 'md', color = 'brand' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  const colors = { brand: 'border-brand-500', white: 'border-white' }
  return (
    <div className={`${sizes[size]} ${colors[color]} border-2 border-t-transparent rounded-full animate-spin`} />
  )
}
