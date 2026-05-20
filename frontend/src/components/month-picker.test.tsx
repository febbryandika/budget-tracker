import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthPicker } from './month-picker'

describe('MonthPicker', () => {
  it('renders the current value as the selected option', () => {
    render(<MonthPicker value="2026-05" onChange={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('2026-05')
  })

  it('calls onChange with the selected month', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MonthPicker value="2026-05" onChange={onChange} />)
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '2026-04')
    expect(onChange).toHaveBeenCalledWith('2026-04')
  })

  it('prepends the current value when it is outside the last 12 months', () => {
    render(<MonthPicker value="2020-01" onChange={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    const firstOption = select.options[0]
    expect(firstOption.value).toBe('2020-01')
  })
})
