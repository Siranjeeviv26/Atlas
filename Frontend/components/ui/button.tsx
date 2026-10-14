import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-teal text-white shadow-[0_10px_24px_-12px_rgba(31,168,160,0.9)] hover:bg-teal-dark',
        secondary: 'bg-midnight text-warm-white hover:bg-midnight-700',
        outline: 'border border-sand bg-white text-ink hover:border-ink-faint hover:bg-parchment',
        ghost: 'text-ink hover:bg-parchment',
        'ghost-light': 'text-on-dark hover:bg-midnight-700',
        link: 'text-teal underline-offset-4 hover:underline',
        danger: 'bg-clay text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-4 text-[13px]',
        md: 'h-11 px-6',
        lg: 'h-12 px-8 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className)

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      })
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
