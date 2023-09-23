import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ann-share',
  styleUrl: 'ann-share.css',
  shadow: true,
})
export class AnnShare {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
