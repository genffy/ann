import { newE2EPage } from '@stencil/core/testing';

describe('ann-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ann-dialog></ann-dialog>');

    const element = await page.find('ann-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
