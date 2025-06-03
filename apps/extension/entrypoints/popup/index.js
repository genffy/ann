document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider');
  const targetLangSelect = document.getElementById('targetLang');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  const apiKeysDiv = document.getElementById('apiKeys');
  const googleKeysDiv = document.getElementById('googleKeys');
  const baiduKeysDiv = document.getElementById('baiduKeys');
  const youdaoKeysDiv = document.getElementById('youdaoKeys');

  // API key input fields
  const googleApiKeyInput = document.getElementById('googleApiKey');
  const baiduAppIdInput = document.getElementById('baiduAppId');
  const baiduKeyInput = document.getElementById('baiduKey');
  const youdaoAppKeyInput = document.getElementById('youdaoAppKey');
  const youdaoAppSecretInput = document.getElementById('youdaoAppSecret');

  // Load current configuration
  await loadConfig();

  // Listen for translation service provider changes
  providerSelect.addEventListener('change', () => {
    showApiKeysForProvider(providerSelect.value);
  });

  // Save configuration
  saveBtn.addEventListener('click', saveConfig);

  // Show API key input fields for corresponding service provider
  function showApiKeysForProvider(provider) {
    // Hide all API key input fields
    googleKeysDiv.style.display = 'none';
    baiduKeysDiv.style.display = 'none';
    youdaoKeysDiv.style.display = 'none';

    if (provider === 'google') {
      apiKeysDiv.style.display = 'block';
      googleKeysDiv.style.display = 'block';
    } else if (provider === 'baidu') {
      apiKeysDiv.style.display = 'block';
      baiduKeysDiv.style.display = 'block';
    } else if (provider === 'youdao') {
      apiKeysDiv.style.display = 'block';
      youdaoKeysDiv.style.display = 'block';
    } else {
      apiKeysDiv.style.display = 'none';
    }
  }

  // Load configuration
  async function loadConfig() {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_TRANSLATION_CONFIG'
      });

      if (response) {
        providerSelect.value = response.provider || 'google';
        targetLangSelect.value = response.targetLanguage || 'zh';

        // Load API keys
        if (response.apiKeys) {
          if (response.apiKeys.google) {
            googleApiKeyInput.value = response.apiKeys.google.key || '';
          }

          if (response.apiKeys.baidu) {
            baiduAppIdInput.value = response.apiKeys.baidu.appId || '';
            baiduKeyInput.value = response.apiKeys.baidu.key || '';
          }

          if (response.apiKeys.youdao) {
            youdaoAppKeyInput.value = response.apiKeys.youdao.appKey || '';
            youdaoAppSecretInput.value = response.apiKeys.youdao.appSecret || '';
          }
        }

        // Show corresponding API key input fields
        showApiKeysForProvider(providerSelect.value);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      showStatus('Failed to load configuration', 'error');
    }
  }

  // Save configuration
  async function saveConfig() {
    try {
      const config = {
        provider: providerSelect.value,
        targetLanguage: targetLangSelect.value,
        sourceLanguage: 'auto',
        apiKeys: {
          google: {
            key: googleApiKeyInput.value.trim()
          },
          baidu: {
            appId: baiduAppIdInput.value.trim(),
            key: baiduKeyInput.value.trim()
          },
          youdao: {
            appKey: youdaoAppKeyInput.value.trim(),
            appSecret: youdaoAppSecretInput.value.trim()
          }
        }
      };

      const response = await browser.runtime.sendMessage({
        type: 'SET_TRANSLATION_CONFIG',
        config: config
      });

      if (response && response.success) {
        showStatus('Settings saved successfully!', 'success');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      showStatus('Failed to save settings', 'error');
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Hide status message after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
