import { newSpecPage } from '@stencil/core/testing';
import { AnnShare } from '../ann-share';

describe('ann-share', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [AnnShare],
      html: `<ann-share></ann-share>`,
    });
    expect(page.root).toEqualHtml(`
      <ann-share>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ann-share>
    `);
  });
});
