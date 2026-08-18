import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscountDialog } from '../DiscountDialog'

const defaultProps = {
  isDarkTheme: false,
  customDiscountValue: '10',
  setCustomDiscountValue: vi.fn(),
  confirmCustomDiscount: vi.fn(),
  onDismiss: vi.fn(),
}

describe('DiscountDialog', () => {
  it('renders without crashing', () => {
    render(<DiscountDialog {...defaultProps} />)
    expect(screen.getByText('Porcentaje de descuento')).toBeInTheDocument()
  })

  it('shows preset percentage buttons', () => {
    render(<DiscountDialog {...defaultProps} />)
    expect(screen.getByText('5%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('shows input field', () => {
    render(<DiscountDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText('Otro %')).toBeInTheDocument()
  })

  it('shows cancel and apply buttons', () => {
    render(<DiscountDialog {...defaultProps} />)
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Aplicar')).toBeInTheDocument()
  })

  it('highlights the selected discount value', () => {
    render(<DiscountDialog {...defaultProps} customDiscountValue="10" />)
    const tenBtn = screen.getByText('10%')
    expect(tenBtn).toBeInTheDocument()
  })
})
