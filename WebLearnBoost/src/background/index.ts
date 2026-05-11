chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Some Chromium builds expose sidePanel without setPanelBehavior.
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.windowId) return;
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => undefined);
});
