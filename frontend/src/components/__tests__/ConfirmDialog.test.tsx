import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

const defaultProps = {
  isDarkTheme: false,
  loading: false,
  title: 'Eliminar producto',
  message: '¿Estás seguro de que deseas eliminar este producto?',
  tone: 'danger' as const,
  confirmLabel: 'Eliminar',
  onConfirm: vi.fn(),
  onDismiss: vi.fn(),
}

describe('ConfirmDialog', () => {
  it('renders without crashing', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Eliminar producto')).toBeInTheDocument()
  })

  it('displays the message', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('¿Estás seguro de que deseas eliminar este producto?')).toBeInTheDocument()
  })

  it('shows confirm button with custom label', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('shows cancel button', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('shows default confirm label when not provided', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel={undefined} />)
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading />)
    const cancelBtn = screen.getByText('Cancelar')
    const confirmBtn = screen.getByText('Eliminar')
    expect(cancelBtn).toBeDisabled()
    expect(confirmBtn).toBeDisabled()
  })
})
