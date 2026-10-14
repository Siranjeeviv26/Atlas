import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders its label and fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Send enquiry</Button>)

    const button = screen.getByRole('button', { name: /send enquiry/i })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows a spinner and blocks clicks while loading', () => {
    const onClick = vi.fn()
    render(
      <Button isLoading onClick={onClick}>
        Submit
      </Button>,
    )

    const button = screen.getByRole('button', { name: /submit/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('clones a child link when asChild is set, merging classes', () => {
    render(
      <Button asChild variant="primary" size="lg" className="extra-class">
        <a href="/destinations">Explore</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: /explore/i })
    expect(link.getAttribute('href')).toBe('/destinations')
    expect(link.className).toContain('extra-class')
    expect(link.className).toContain('rounded-full')
  })
})
