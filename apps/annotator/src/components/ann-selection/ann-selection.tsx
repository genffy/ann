import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ann-selection',
  styleUrl: 'ann-selection.css',
  shadow: true,
})
export class AnnSelection {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
