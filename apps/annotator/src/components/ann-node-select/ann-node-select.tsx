import { Component, Host, h } from '@stencil/core'

@Component({
  tag: 'ann-node-select',
  styleUrl: 'ann-node-select.css',
  shadow: true,
})
export class AnnNodeSelect {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    )
  }
}
