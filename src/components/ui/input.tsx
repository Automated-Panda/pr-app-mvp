import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'bg-dark-800 border border-dark-700 text-dark-100 placeholder:text-dark-500 focus:ring-2 focus:ring-peach-500/40 focus:border-peach-500 rounded-lg h-9 px-3 text-sm w-full outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
