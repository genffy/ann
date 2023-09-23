import { newE2EPage } from '@stencil/core/testing'

describe('ann-selection', () => {
  it('renders', async () => {
    const page = await newE2EPage()
    await page.setContent('<ann-selection></ann-selection>')

    const element = await page.find('ann-selection')
    expect(element).toHaveClass('hydrated')
  })
})
