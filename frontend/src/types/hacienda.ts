export type HaciendaSettingRow = {
  id?: number
  branch_id?: number | null
  environment: 'staging' | 'production'
  legal_name: string
  commercial_name?: string | null
  identification_type: string
  identification_number: string
  economic_activity_code: string
  province: string
  canton: string
  district: string
  barrio?: string | null
  other_signs: string
  country_code?: string
  phone?: string | null
  email: string
  branch_code: string
  terminal_code: string
  certificate_path?: string | null
  certificate_pin?: string | null
  api_username?: string | null
  api_password?: string | null
  callback_url?: string | null
  is_active: boolean
}

export const emptyHaciendaSetting: HaciendaSettingRow = {
  branch_id: 1,
  environment: 'staging',
  legal_name: '',
  commercial_name: '',
  identification_type: '02',
  identification_number: '',
  economic_activity_code: '',
  province: '1',
  canton: '01',
  district: '01',
  barrio: '',
  other_signs: '',
  country_code: '506',
  phone: '',
  email: '',
  branch_code: '001',
  terminal_code: '00001',
  certificate_path: '',
  certificate_pin: '',
  api_username: '',
  api_password: '',
  callback_url: '',
  is_active: false,
}
