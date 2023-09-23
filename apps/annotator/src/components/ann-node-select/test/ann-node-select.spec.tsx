import { newSpecPage } from '@stencil/core/testing'
import { AnnNodeSelect } from '../ann-node-select'

describe('ann-node-select', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [AnnNodeSelect],
      html: `<ann-node-select></ann-node-select>`,
    })
    expect(page.root).toEqualHtml(`
      <ann-node-select>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ann-node-select>
    `)
  })
})
