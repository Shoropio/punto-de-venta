interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    config: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number | string
      callback: (response: { credential: string }) => void
    }
  ): void
  prompt(callback?: (notification: { isNotDisplayed: boolean; isUndismissed: boolean; reason: string }) => void): void
  revoke(hint: string, callback?: () => void): void
}

interface GoogleAccounts {
  id: GoogleAccountsId
}

interface Window {
  google?: {
    accounts: GoogleAccounts
  }
}
