interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-black">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-4 h-px bg-gradient-to-r from-purple-200 via-purple-100 to-transparent" />
    </div>
  )
}
