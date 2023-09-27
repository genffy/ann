import { Component, Host, State, h } from '@stencil/core'
import { SelectionObserver } from '../../utils/selection-observer';
import { isSelectionBackwards, itemsForRange, selectedRange, selectionFocusRect } from '../../utils/range-util';
import { TextRange } from './text-range';

/** HTML element created by the highlighter with an associated annotation. */
type AnnotationHighlight = HTMLElement & { _annotation?: any };

@Component({
  tag: 'ann-selection',
  styleUrl: 'ann-selection.css',
  shadow: true,
})
// listen to selection events
export class AnnSelection {
  private _selectionObserver: SelectionObserver;
  public selectedRanges: Range[];
  @State() _focusRect: DOMRect | null = null;
  constructor() {

    this._selectionObserver = new SelectionObserver(range => {
      if (range) {
        this._onSelection(range);
      } else {
        this._onClearSelection();
      }
    });
  }
  _onSelection(range: Range) {
    const annotatableRange = TextRange.trimmedRange(range);
    if (!annotatableRange) {
      this._onClearSelection();
      return;
    }

    const selection = document.getSelection()!;
    const isBackwards = isSelectionBackwards(selection);
    const focusRect = selectionFocusRect(selection);
    if (!focusRect) {
      // The selected range does not contain any text
      this._onClearSelection();
      return;
    }
    this._focusRect = focusRect;
    this.selectedRanges = [annotatableRange];

    const annotationsForSelection = itemsForRange(
      selectedRange() ?? new Range(),
      node => (node as AnnotationHighlight)._annotation?.$tag,
    );

    console.log(annotationsForSelection, focusRect, isBackwards)
  }

  _onClearSelection() {
    console.log('clear selection');
  }

  componentDidLoad() {
  }

  disconnectedCallback() {
    this._selectionObserver.disconnect();
  }

  render() {
    if (!this._focusRect) {
      return null
    }
    console.log(this._focusRect)
    return (
      <Host>
        <slot></slot>
        <div class="ann-selection__toolbar" style={{ top: `${this._focusRect.top}px`, left: `${this._focusRect.left}px` }}></div>
      </Host>
    )
  }
}
