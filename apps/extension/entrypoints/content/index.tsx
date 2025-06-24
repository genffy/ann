import ReactDOM from 'react-dom/client'
import Selection from './Selection'

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'ann-selection',
      position: 'inline',
      anchor: 'html',
      onMount: (container) => {
        // Container is a body, and React warns when creating a root on the body, so create a wrapper div
        const app = document.createElement('div');
        container.append(app);
        // Create a root on the UI container and render a component
        const root = ReactDOM.createRoot(app);
        root.render(<Selection />);
        return root;
      },
      onRemove: (root) => {
        // Unmount the root when the UI is removed
        root?.unmount();
      },
    })
    ui.mount()
  }
})
