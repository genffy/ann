import { newE2EPage } from '@stencil/core/testing'

describe('ann-share', () => {
  it('renders', async () => {
    const page = await newE2EPage()
    await page.setContent('<ann-share></ann-share>')

    const element = await page.find('ann-share')
    expect(element).toHaveClass('hydrated')
  })
})
