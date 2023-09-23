import { newSpecPage } from '@stencil/core/testing'
import { AnnDialog } from '../ann-dialog'

describe('ann-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [AnnDialog],
      html: `<ann-dialog></ann-dialog>`,
    })
    expect(page.root).toEqualHtml(`
      <ann-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ann-dialog>
    `)
  })
})
