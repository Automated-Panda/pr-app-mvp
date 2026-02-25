import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: Crumb[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-dark-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} />}
          {item.href ? (
            <Link to={item.href} className="hover:text-dark-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-dark-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
