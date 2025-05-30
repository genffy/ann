document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider');
  const targetLangSelect = document.getElementById('targetLang');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  const apiKeysDiv = document.getElementById('apiKeys');
  const googleKeysDiv = document.getElementById('googleKeys');
  const baiduKeysDiv = document.getElementById('baiduKeys');
  const youdaoKeysDiv = document.getElementById('youdaoKeys');
  
  // API 密钥输入框
  const googleApiKeyInput = document.getElementById('googleApiKey');
  const baiduAppIdInput = document.getElementById('baiduAppId');
  const baiduKeyInput = document.getElementById('baiduKey');
  const youdaoAppKeyInput = document.getElementById('youdaoAppKey');
  const youdaoAppSecretInput = document.getElementById('youdaoAppSecret');
  
  // 加载当前配置
  await loadConfig();
  
  // 监听翻译服务提供商变化
  providerSelect.addEventListener('change', () => {
    showApiKeysForProvider(providerSelect.value);
  });
  
  // 保存配置
  saveBtn.addEventListener('click', saveConfig);
  
  // 显示对应服务商的 API 密钥输入框
  function showApiKeysForProvider(provider) {
    // 隐藏所有 API 密钥输入框
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
  
  // 加载配置
  async function loadConfig() {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_TRANSLATION_CONFIG'
      });
      
      if (response) {
        providerSelect.value = response.provider || 'google';
        targetLangSelect.value = response.targetLanguage || 'zh';
        
        // 加载 API 密钥
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
        
        // 显示对应的 API 密钥输入框
        showApiKeysForProvider(providerSelect.value);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      showStatus('加载配置失败', 'error');
    }
  }
  
  // 保存配置
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
        showStatus('设置保存成功！', 'success');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      showStatus('保存设置失败', 'error');
    }
  }
  
  // 显示状态消息
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // 3秒后隐藏状态消息
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}); 