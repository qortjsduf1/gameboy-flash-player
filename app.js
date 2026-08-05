// FlashBoy - 레트로 플래시 에뮬레이터 엔진 (HTML Native target=_blank New Tab Binding)

document.addEventListener('DOMContentLoaded', () => {
  // --- 요소 참조 ---
  const flashContainer = document.getElementById('flashContainer');
  const urlInput = document.getElementById('urlInput');
  const loadUrlBtn = document.getElementById('loadUrlBtn');
  const statusOverlay = document.getElementById('statusOverlay');
  const statusText = document.getElementById('statusText');
  const powerLed = document.getElementById('powerLed');

  // 조이스틱 및 하단 버튼
  const joystickBase = document.getElementById('joystickBase');
  const joystickStick = document.getElementById('joystickStick');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnSelectLink = document.getElementById('btnSelectLink');
  
  // 키 설정 모달 & 드롭다운 요소
  const keyConfigModal = document.getElementById('keyConfigModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveKeyConfigBtn = document.getElementById('saveKeyConfigBtn');

  const joystickPresetSelect = document.getElementById('joystickPresetSelect');
  const selectKeyA = document.getElementById('selectKeyA');
  const selectKeyB = document.getElementById('selectKeyB');
  const selectKeyStart = document.getElementById('selectKeyStart');

  const presetDefaultBtn = document.getElementById('presetDefaultBtn');
  const presetDadBtn = document.getElementById('presetDadBtn');
  const presetWasdBtn = document.getElementById('presetWasdBtn');

  const labelA = document.getElementById('labelA');
  const labelB = document.getElementById('labelB');

  // Key Definition Dictionary
  const KEY_CONFIGS = {
    'z': { key: 'z', code: 'KeyZ', keyCode: 90, label: 'Z' },
    'x': { key: 'x', code: 'KeyX', keyCode: 88, label: 'X' },
    'c': { key: 'c', code: 'KeyC', keyCode: 67, label: 'C' },
    'a': { key: 'a', code: 'KeyA', keyCode: 65, label: 'A' },
    's': { key: 's', code: 'KeyS', keyCode: 83, label: 'S' },
    'd': { key: 'd', code: 'KeyD', keyCode: 68, label: 'D' },
    'j': { key: 'j', code: 'KeyJ', keyCode: 74, label: 'J' },
    'k': { key: 'k', code: 'KeyK', keyCode: 75, label: 'K' },
    'w': { key: 'w', code: 'KeyW', keyCode: 87, label: 'W' },
    'p': { key: 'p', code: 'KeyP', keyCode: 80, label: 'P' },
    'space': { key: ' ', code: 'Space', keyCode: 32, label: 'SPACE' },
    'enter': { key: 'Enter', code: 'Enter', keyCode: 13, label: 'ENTER' },
    'shift': { key: 'Shift', code: 'ShiftLeft', keyCode: 16, label: 'SHIFT' },
    'ctrl': { key: 'Control', code: 'ControlLeft', keyCode: 17, label: 'CTRL' },
    'up_arrow': { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    'down_arrow': { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    'left_arrow': { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    'right_arrow': { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    'up_wasd': { key: 'w', code: 'KeyW', keyCode: 87 },
    'down_wasd': { key: 's', code: 'KeyS', keyCode: 83 },
    'left_wasd': { key: 'a', code: 'KeyA', keyCode: 65 },
    'right_wasd': { key: 'd', code: 'KeyD', keyCode: 68 }
  };

  let joystickMode = localStorage.getItem('flashboy_joy_mode') || 'arrow';
  let buttonMap = JSON.parse(localStorage.getItem('flashboy_btn_map')) || {
    a: 'z',
    b: 'x',
    start: 'enter'
  };

  // --- 1. Ruffle 초기화 및 캔버스 포커스 고정 ---
  let rufflePlayerInstance = null;

  function initRuffle() {
    if (!window.RufflePlayer) {
      console.warn('RufflePlayer 라이브러리가 로드되지 않았습니다.');
      return;
    }
    const ruffle = window.RufflePlayer.newest();
    rufflePlayerInstance = ruffle.createPlayer();
    rufflePlayerInstance.style.width = '100%';
    rufflePlayerInstance.style.height = '100%';
    
    rufflePlayerInstance.config = {
      autoplay: 'on',
      unmuteOverlay: 'hidden',
      letterbox: 'on',
      warnOnUnsupportedContent: false,
      logLevel: 'error'
    };
  }

  initRuffle();
  updateButtonLabels();

  function keepCanvasFocused() {
    if (!rufflePlayerInstance) return;

    let targetCanvas = rufflePlayerInstance.shadowRoot ? 
      rufflePlayerInstance.shadowRoot.querySelector('canvas') : 
      rufflePlayerInstance.querySelector('canvas');

    if (!targetCanvas) targetCanvas = rufflePlayerInstance;

    targetCanvas.setAttribute('tabindex', '0');
    try {
      if (document.activeElement !== targetCanvas) {
        targetCanvas.focus({ preventScroll: true });
      }
    } catch(e) {}
  }

  // --- 2. 상태 표시 및 파싱 ---
  function showStatus(message) {
    statusText.textContent = message;
    statusOverlay.classList.remove('hidden');
  }

  function hideStatus() {
    statusOverlay.classList.add('hidden');
  }

  function turnOnPower() {
    powerLed.classList.add('active');
  }

  function decodeHtmlEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  // --- 3. SELECT 버튼 터치 시 햅틱 피드백 ---
  if (btnSelectLink) {
    btnSelectLink.addEventListener('click', () => {
      triggerHaptic();
    });
  }

  // --- 4. URL 로드 및 Tistory 파서 ---

  loadUrlBtn.addEventListener('click', () => {
    let inputUrl = urlInput.value.trim();
    if (!inputUrl) {
      alert('올바른 URL 주소를 입력해주세요.');
      return;
    }

    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = 'https://' + inputUrl;
    }

    processInputUrl(inputUrl);
  });

  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadUrlBtn.click();
    }
  });

  async function processInputUrl(targetUrl) {
    showStatus('주소 분석 및 플래시 게임 탐색 중...');

    if (targetUrl.toLowerCase().includes('.swf')) {
      await fetchAndLoadSwf(targetUrl);
      return;
    }

    try {
      showStatus('블로그 페이지 파싱 중...');
      const htmlContent = await fetchHtmlWithFallback(targetUrl);
      const swfUrl = extractSwfFromHtml(htmlContent, targetUrl);

      if (swfUrl) {
        showStatus('플래시 바이너리 다운로드 중...');
        await fetchAndLoadSwf(swfUrl);
      } else {
        throw new Error('페이지 내에서 .swf 플래시 주소를 찾지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      showStatus(`오류: ${err.message}`);
      setTimeout(hideStatus, 3500);
    }
  }

  async function fetchHtmlWithFallback(url) {
    const fetchTargets = [
      `/api/proxy?url=${encodeURIComponent(url)}`,
      url,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    for (const target of fetchTargets) {
      try {
        const response = await fetch(target);
        if (response.ok) {
          const html = await response.text();
          if (html && html.length > 300) return html;
        }
      } catch (e) {}
    }
    throw new Error('블로그 페이지를 불러올 수 없습니다.');
  }

  function extractSwfFromHtml(rawHtml, baseUrl) {
    const html = decodeHtmlEntities(rawHtml);

    const kakaocdnRegex = /(https?:\/\/(?:blog\.kakaocdn\.net|cfile\d*\.uf\.tistory\.com|t1\.daumcdn\.net)[^"'\s<>]+\.swf(?:\?[^"'\s<>]*)?)/gi;
    let match = kakaocdnRegex.exec(html);
    if (match) return match[1];

    const swfRegex = /(https?:\/\/[^"'\s<>]+?\.swf(?:\?[^"'\s<>]*)?)/gi;
    match = swfRegex.exec(html);
    if (match) return match[1];

    const embedRegex = /<(?:embed|param|object)[^>]+(?:src|value)=["']([^"'\s>]+?\.swf[^"'\s>]*)["']/gi;
    match = embedRegex.exec(html);
    if (match) {
      let rel = match[1];
      if (rel.startsWith('//')) return 'https:' + rel;
      if (rel.startsWith('http')) return rel;
      return new URL(rel, baseUrl).href;
    }

    return null;
  }

  async function fetchAndLoadSwf(swfUrl) {
    const cleanSwfUrl = decodeHtmlEntities(swfUrl);

    const targets = [
      `/api/proxy?url=${encodeURIComponent(cleanSwfUrl)}`,
      cleanSwfUrl,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanSwfUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanSwfUrl)}`
    ];

    for (const target of targets) {
      try {
        const res = await fetch(target);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          loadSwfDataBuffer(buffer, cleanSwfUrl);
          return;
        }
      } catch (e) {}
    }

    throw new Error('SWF 플래시 바이너리 다운로드 실패');
  }

  function loadSwfDataBuffer(arrayBuffer, title) {
    if (!rufflePlayerInstance) {
      initRuffle();
    }

    flashContainer.innerHTML = '';
    flashContainer.appendChild(rufflePlayerInstance);

    rufflePlayerInstance.load({
      data: arrayBuffer,
      parameters: '',
      allowScriptAccess: true
    }).then(() => {
      hideStatus();
      turnOnPower();
      keepCanvasFocused();
      console.log('Flash Game Loaded Successfully:', title);
    }).catch((err) => {
      console.error('Ruffle Load Error:', err);
      showStatus('플래시 실행 오류');
      setTimeout(hideStatus, 3000);
    });
  }

  // --- 5. 8방향 슬라이딩 조이스틱 엔진 ---

  let isJoystickActive = false;
  let activeDirectionKeys = new Set();

  const dirIndicators = {
    'up': document.querySelector('.dir-up'),
    'down': document.querySelector('.dir-down'),
    'left': document.querySelector('.dir-left'),
    'right': document.querySelector('.dir-right'),
    'up-left': document.querySelector('.dir-upleft'),
    'up-right': document.querySelector('.dir-upright'),
    'down-left': document.querySelector('.dir-downleft'),
    'down-right': document.querySelector('.dir-downright')
  };

  const handleJoystickStart = (e) => {
    e.preventDefault();
    isJoystickActive = true;
    keepCanvasFocused();
    triggerHaptic();
    updateJoystickPosition(e);
  };

  const handleJoystickMove = (e) => {
    if (!isJoystickActive) return;
    e.preventDefault();
    updateJoystickPosition(e);
  };

  const handleJoystickEnd = (e) => {
    if (!isJoystickActive) return;
    e.preventDefault();
    isJoystickActive = false;

    joystickStick.style.transform = `translate(0px, 0px)`;
    clearDirIndicators();
    updateDirectionKeys([]);
  };

  joystickBase.addEventListener('pointerdown', handleJoystickStart);
  window.addEventListener('pointermove', handleJoystickMove);
  window.addEventListener('pointerup', handleJoystickEnd);
  window.addEventListener('pointercancel', handleJoystickEnd);

  function updateJoystickPosition(e) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const pointerX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : centerX);
    const pointerY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : centerY);

    let deltaX = pointerX - centerX;
    let deltaY = pointerY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    const maxDistance = rect.width / 2 - 8;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }

    joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    if (distance < 10) {
      clearDirIndicators();
      updateDirectionKeys([]);
      return;
    }

    let degrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    let newKeys = [];
    let activeDirName = '';

    if (degrees >= -22.5 && degrees < 22.5) {
      newKeys = ['right'];
      activeDirName = 'right';
    } else if (degrees >= 22.5 && degrees < 67.5) {
      newKeys = ['down', 'right'];
      activeDirName = 'down-right';
    } else if (degrees >= 67.5 && degrees < 112.5) {
      newKeys = ['down'];
      activeDirName = 'down';
    } else if (degrees >= 112.5 && degrees < 157.5) {
      newKeys = ['down', 'left'];
      activeDirName = 'down-left';
    } else if (degrees >= 157.5 || degrees < -157.5) {
      newKeys = ['left'];
      activeDirName = 'left';
    } else if (degrees >= -157.5 && degrees < -112.5) {
      newKeys = ['up', 'left'];
      activeDirName = 'up-left';
    } else if (degrees >= -112.5 && degrees < -67.5) {
      newKeys = ['up'];
      activeDirName = 'up';
    } else if (degrees >= -67.5 && degrees < -22.5) {
      newKeys = ['up', 'right'];
      activeDirName = 'up-right';
    }

    highlightDirIndicator(activeDirName);
    updateDirectionKeys(newKeys);
  }

  function clearDirIndicators() {
    Object.values(dirIndicators).forEach(el => el && el.classList.remove('active'));
  }

  function highlightDirIndicator(dirName) {
    clearDirIndicators();
    if (dirIndicators[dirName]) {
      dirIndicators[dirName].classList.add('active');
    }
  }

  function updateDirectionKeys(targetKeysArray) {
    const targetSet = new Set(targetKeysArray);

    activeDirectionKeys.forEach(dirName => {
      if (!targetSet.has(dirName)) {
        const keyConfigKey = `${dirName}_${joystickMode}`;
        const config = KEY_CONFIGS[keyConfigKey];
        if (config) dispatchRawKeyEvent('keyup', config);
      }
    });

    targetSet.forEach(dirName => {
      if (!activeDirectionKeys.has(dirName)) {
        const keyConfigKey = `${dirName}_${joystickMode}`;
        const config = KEY_CONFIGS[keyConfigKey];
        if (config) dispatchRawKeyEvent('keydown', config);
      }
    });

    activeDirectionKeys = targetSet;
  }

  // --- 6. A/B/START 액션 버튼 ---

  const actionButtons = document.querySelectorAll('.round-btn, #btnStart');

  actionButtons.forEach(btn => {
    const btnId = btn.getAttribute('data-key');

    const pressHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      keepCanvasFocused();
      btn.classList.add('pressed');
      triggerHaptic();

      const keyVal = buttonMap[btnId];
      const config = KEY_CONFIGS[keyVal];
      if (config) dispatchRawKeyEvent('keydown', config);
    };

    const releaseHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      btn.classList.remove('pressed');

      const keyVal = buttonMap[btnId];
      const config = KEY_CONFIGS[keyVal];
      if (config) dispatchRawKeyEvent('keyup', config);
    };

    btn.addEventListener('pointerdown', pressHandler);
    btn.addEventListener('pointerup', releaseHandler);
    btn.addEventListener('pointerleave', releaseHandler);
    btn.addEventListener('pointercancel', releaseHandler);
  });

  function dispatchRawKeyEvent(type, config) {
    const eventInit = {
      key: config.key,
      code: config.code,
      keyCode: config.keyCode,
      which: config.keyCode,
      bubbles: true,
      cancelable: true
    };

    const event = new KeyboardEvent(type, eventInit);

    if (rufflePlayerInstance) {
      let canvas = rufflePlayerInstance.shadowRoot ? 
        rufflePlayerInstance.shadowRoot.querySelector('canvas') : 
        rufflePlayerInstance.querySelector('canvas');
      
      if (!canvas) canvas = rufflePlayerInstance;

      canvas.dispatchEvent(event);
    }

    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  function triggerHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  // --- 7. 키설정 모달 제어 ---

  function updateButtonLabels() {
    const configA = KEY_CONFIGS[buttonMap.a];
    const configB = KEY_CONFIGS[buttonMap.b];

    if (labelA && configA) labelA.textContent = configA.label || configA.key.toUpperCase();
    if (labelB && configB) labelB.textContent = configB.label || configB.key.toUpperCase();
  }

  function syncSelectsWithCurrentState() {
    joystickPresetSelect.value = joystickMode;
    selectKeyA.value = buttonMap.a;
    selectKeyB.value = buttonMap.b;
    selectKeyStart.value = buttonMap.start;
  }

  btnOpenSettings.addEventListener('click', (e) => {
    e.preventDefault();
    syncSelectsWithCurrentState();
    keyConfigModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    keyConfigModal.classList.add('hidden');
    keepCanvasFocused();
  });

  presetDefaultBtn.addEventListener('click', () => {
    joystickMode = 'arrow';
    buttonMap = { a: 'z', b: 'x', start: 'enter' };
    syncSelectsWithCurrentState();
  });

  presetDadBtn.addEventListener('click', () => {
    joystickMode = 'arrow';
    buttonMap = { a: 'a', b: 's', start: 'enter' };
    syncSelectsWithCurrentState();
  });

  presetWasdBtn.addEventListener('click', () => {
    joystickMode = 'wasd';
    buttonMap = { a: 'k', b: 'j', start: 'enter' };
    syncSelectsWithCurrentState();
  });

  saveKeyConfigBtn.addEventListener('click', () => {
    joystickMode = joystickPresetSelect.value;
    buttonMap.a = selectKeyA.value;
    buttonMap.b = selectKeyB.value;
    buttonMap.start = selectKeyStart.value;

    localStorage.setItem('flashboy_joy_mode', joystickMode);
    localStorage.setItem('flashboy_btn_map', JSON.stringify(buttonMap));

    updateButtonLabels();
    keyConfigModal.classList.add('hidden');
    keepCanvasFocused();
    alert('조작키 맵핑 설정이 성공적으로 저장되었습니다!');
  });
});
