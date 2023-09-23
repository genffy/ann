import { newE2EPage } from '@stencil/core/testing';

describe('ann-node-select', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ann-node-select></ann-node-select>');

    const element = await page.find('ann-node-select');
    expect(element).toHaveClass('hydrated');
  });
});
