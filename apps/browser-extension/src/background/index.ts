import { chromeAPI } from './chrome-api';
import { Extension } from './extension';
import type { ExternalMessage } from './messages';
/**
 * Initialize the extension's Service Worker / background page.
 *
 * This is exported for use in tests.
 */
export async function init() {
  function initContextMenu() {
    chrome.contextMenus.removeAll()
    var shareParentId = chrome.contextMenus.create({
      "id": `${chromeAPI.runtime.id}share`,
      "title": "分享到...",
      // "all"
      // "page"
      // "frame"
      // "selection"
      // "link"
      // "editable"
      // "image"
      // "video"
      // "audio"
      // "launcher"
      // "browser_action"
      // "page_action"
      // "action"
      "contexts": ["page"]
    }, function () {
      console.log(chrome.runtime.lastError)
    })
  }
  const extension = new Extension();
  const initialized = extension.init();

  // Tokens indicating which features the current extension supports.
  const allFeatures = [
    // "activate" message to activate extension on current tab and
    // optionally first navigate to a different URL.
    'activate',
  ];

  chromeAPI.runtime.onInstalled.addListener(async installDetails => {
    // Check whether this is the inital installation or an update of an existing
    // installation.
    if (installDetails.reason === 'install') {
      const extensionInfo = await chromeAPI.management.getSelf();
      extension.firstRun(extensionInfo);
    }
  });

  // Respond to messages sent by the JavaScript from https://annhub.xyz.
  // This is how it knows whether the user has this Chrome extension installed.
  chromeAPI.runtime.onMessageExternal.addListener(
    (request: ExternalMessage, sender, sendResponse) => {
      switch (request.type) {
        case 'ping':
          {
            const queryFeatures = request.queryFeatures ?? [];
            const features = allFeatures.filter(f => queryFeatures.includes(f));
            sendResponse({ type: 'pong', features });
          }
          break;
        case 'activate':
          {
            if (typeof sender.tab?.id !== 'number') {
              return;
            }

            const { url, query } = request;
            if (url) {
              chromeAPI.tabs.update(sender.tab.id, { url });
            }
            extension.activate(sender.tab.id, {
              afterNavigationTo: url,
              query,
            });

            sendResponse({ active: true });
          }
          break;
      }
    },
  );

  chromeAPI.runtime.requestUpdateCheck?.().then(() => {
    chromeAPI.runtime.onUpdateAvailable.addListener(() => {
      initContextMenu()
      chromeAPI.runtime.reload()
    });
  });

  await initialized;
}

// nb. We use `globalThis` for the global object because it is `window` in Karma
// tests but `self` in the real extension's Service Worker.
const inTests = '__karma__' in globalThis;
if (!inTests) {
  init();
}
