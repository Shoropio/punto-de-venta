import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginScreen } from '../LoginScreen'

const defaultProps = {
  isDarkTheme: false,
  email: '',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  loading: false,
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  message: 'Bienvenido al sistema',
  toasts: [],
  dismissToast: vi.fn(),
}

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByText('Iniciar sesion')).toBeInTheDocument()
  })

  it('displays the subtitle', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByText('POS profesional')).toBeInTheDocument()
  })

  it('shows email and password inputs', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByPlaceholderText('Correo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contrasena')).toBeInTheDocument()
  })

  it('shows login button with "Entrar" text', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('shows Google login button', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByText('Google')).toBeInTheDocument()
  })

  it('displays the message', () => {
    render(<LoginScreen {...defaultProps} />)
    expect(screen.getByText('Bienvenido al sistema')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(<LoginScreen {...defaultProps} loading />)
    const entrarBtn = screen.getByText('Entrar').closest('button')
    expect(entrarBtn).toBeDisabled()
  })
})
