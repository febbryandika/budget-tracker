type Category = { id: string; name: string }

type Props = {
  categories: Category[]
  value: string | undefined
  onChange: (categoryId: string | undefined) => void
}

export function CategoryFilter({ categories, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Category</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}
