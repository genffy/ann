import { newSpecPage } from '@stencil/core/testing';
import { AnnSelection } from '../ann-selection';

describe('ann-selection', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [AnnSelection],
      html: `<ann-selection></ann-selection>`,
    });
    expect(page.root).toEqualHtml(`
      <ann-selection>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ann-selection>
    `);
  });
});
