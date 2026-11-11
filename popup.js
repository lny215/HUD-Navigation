document.addEventListener('DOMContentLoaded', () => {
  const showHtag = document.getElementById('showHtag');
  const showAlt = document.getElementById('showAlt');
  const showTagging = document.getElementById('showTagging');
  const showMeta = document.getElementById('showMeta');
  const showNav = document.getElementById('showNav');

  chrome.storage.sync.get({
    showHtag: true,
    showAlt: true,
    showTagging: true,
    showMeta: true,
    showNav: true
  }, (items) => {
    showHtag.checked = items.showHtag;
    showAlt.checked = items.showAlt;
    showTagging.checked = items.showTagging;
    showMeta.checked = items.showMeta;
    showNav.checked = items.showNav;
  });

  function updateSettings() {
    const settings = {
      showHtag: showHtag.checked,
      showAlt: showAlt.checked,
      showTagging: showTagging.checked,
      showMeta: showMeta.checked,
      showNav: showNav.checked
    };

    chrome.storage.sync.set(settings);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_HUD_SETTINGS',
          settings: settings
        });
      }
    });
  }

  showHtag.addEventListener('change', updateSettings);
  showAlt.addEventListener('change', updateSettings);
  showTagging.addEventListener('change', updateSettings);
  showMeta.addEventListener('change', updateSettings);
  showNav.addEventListener('change', updateSettings);
});