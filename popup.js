const STATE_KEY = 'rcr_enabled';

function getState() {
  return new Promise(resolve => {
    chrome.storage.sync.get({[STATE_KEY]: true}, res => resolve(res[STATE_KEY]));
  });
}

function setState(val) {
  return new Promise(resolve => {
    chrome.storage.sync.set({[STATE_KEY]: val}, () => resolve());
  });
}

async function updateUI() {
  const isOn = await getState();
  document.getElementById('toggle').checked = isOn;
  document.getElementById('statusText').textContent = isOn ? 'Enabled' : 'Disabled';
}

document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();
  document.getElementById('toggle').addEventListener('change', async (e) => {
    await setState(e.target.checked);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {ns:'rcr', type:'toggle', enabled: e.target.checked});
      }
    });
    updateUI();
  });
});
