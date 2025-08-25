(function() {
    const STATE_KEY = 'rcr_enabled';
    let enabled = true;
    let listeners = [];
    let styleEl = null;
    let observer = null;
  
    function addCapListener(target, type, handler) {
      target.addEventListener(type, handler, {capture: true, passive: false});
      listeners.push({target, type, handler});
    }
  
    function stopSiteHandlers(e) {
      e.stopImmediatePropagation();
    }
  
    function removeInlineAttrs(root=document) {
      const ATTRS = ['oncontextmenu','onselectstart','ondragstart','oncopy','oncut','onpaste','onmousedown','onmouseup'];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        for (const a of ATTRS) {
          if (el.hasAttribute(a)) el.removeAttribute(a);
        }
        if (el.style) {
          if (el.style.userSelect === 'none') el.style.userSelect = 'text';
        }
      }
      [document, document.documentElement, document.body, window].forEach(t => {
        if (!t) return;
        t.oncontextmenu = null;
        t.onselectstart = null;
      });
    }
  
    function injectStyle() {
      if (styleEl) return;
      styleEl = document.createElement('style');
      styleEl.textContent = `
        * {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
      `;
      document.documentElement.appendChild(styleEl);
    }
  
    function attachCoreListeners() {
      ['contextmenu','selectstart','copy','cut','paste','dragstart','mousedown','mouseup']
        .forEach(t => addCapListener(document, t, stopSiteHandlers));
    }
  
    function detachAll() {
      for (const {target, type, handler} of listeners) {
        target.removeEventListener(type, handler, {capture: true});
      }
      listeners = [];
      if (styleEl) styleEl.remove();
      if (observer) observer.disconnect();
    }
  
    function enableAll() {
      injectStyle();
      removeInlineAttrs();
      attachCoreListeners();
    }
  
    function disableAll() {
      detachAll();
    }
  
    function getState(cb) {
      chrome.storage.sync.get({[STATE_KEY]: true}, (res) => cb(res[STATE_KEY]));
    }
  
    getState((isOn) => {
      enabled = isOn;
      if (enabled) enableAll();
    });
  
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.ns !== 'rcr') return;
      if (msg.type === 'toggle') {
        enabled = msg.enabled;
        if (enabled) enableAll(); else disableAll();
        sendResponse({ok: true, enabled});
      }
    });
  })();
  