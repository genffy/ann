import { Component, Host, h } from '@stencil/core'

@Component({
  tag: 'ann-dialog',
  styleUrl: 'ann-dialog.css',
  shadow: true,
})
export class AnnDialog {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    )
  }
}
