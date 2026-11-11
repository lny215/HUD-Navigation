/**
 * Web Accessibility & Attribute Inspector Extension
 * Lightweight & Security-Enhanced Version
 */

const TAG_COLORS = {
  H1: '#098DF2',
  H2: '#36BA64',
  H3: '#DC9731',
  H4: '#E74C3C',
  H5: '#9B59B6',
  ALT: '#666666',
  P: '#888888',
  TAGGING: '#22F2FF',
  META: '#FF5722'
};

const TAG_BG_COLORS = {
  H1: 'rgba(9, 141, 242, 0.12)',
  H2: 'rgba(54, 186, 100, 0.12)',
  H3: 'rgba(220, 151, 49, 0.12)',
  H4: 'rgba(231, 76, 60, 0.12)',
  H5: 'rgba(155, 89, 182, 0.12)'
};

let sidePanel = null;
let expandBtn = null;
let metaFloatingBanner = null;
let isGlobalBadgeVisible = false;
let currentTab = 'HTAG';
let currentTargetEl = null;
let isTicking = false; // 마우스 렉 방지를 위한 쓰로틀링 락

let options = {
  showHtag: true,
  showAlt: true,
  showTagging: true,
  showMeta: true,
  showNav: true
};

// 보안 강화: XSS 방지를 위한 HTML 이스케이프 함수
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(['showHtag', 'showAlt', 'showTagging', 'showMeta', 'showNav'], (result) => {
    if (result.showHtag !== undefined) options.showHtag = result.showHtag;
    if (result.showAlt !== undefined) options.showAlt = result.showAlt;
    if (result.showTagging !== undefined) options.showTagging = result.showTagging;
    if (result.showMeta !== undefined) options.showMeta = result.showMeta;
    if (result.showNav !== undefined) options.showNav = result.showNav;
    applyOptions();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_HUD_SETTINGS') {
      options = message.settings;
      applyOptions();
      sendResponse({ status: 'ok' });
    }
    return true;
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.showHtag) options.showHtag = changes.showHtag.newValue;
      if (changes.showAlt) options.showAlt = changes.showAlt.newValue;
      if (changes.showTagging) options.showTagging = changes.showTagging.newValue;
      if (changes.showMeta) options.showMeta = changes.showMeta.newValue;
      if (changes.showNav) options.showNav = changes.showNav.newValue;
      applyOptions();
    }
  });
}

function applyOptions() {
  if (sidePanel && expandBtn) {
    if (options.showNav) {
      sidePanel.style.display = '';
      expandBtn.style.display = sidePanel.classList.contains('collapsed') ? 'flex' : 'none';
      renderNavList();
    } else {
      sidePanel.style.display = 'none';
      expandBtn.style.display = 'none';
    }
  }

  if (!options.showAlt) removeAllHighlights();

  if (options.showMeta) {
    renderMetaFloatingBanner();
  } else {
    removeMetaFloatingBanner();
  }
}

function renderMetaFloatingBanner() {
  if (document.getElementById('hud-meta-floating-banner')) return;

  const rawMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '페이지에 meta[name="description"]이 존재하지 않습니다.';
  const metaDesc = escapeHTML(rawMetaDesc);

  metaFloatingBanner = document.createElement('div');
  metaFloatingBanner.id = 'hud-meta-floating-banner';
  metaFloatingBanner.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 999999; width: 320px;
    background: #1E1E1E; color: #FFFFFF; border-radius: 12px; border: 1px solid #333333;
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.4);
    font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
    font-size: 13px; letter-spacing: -0.025em; overflow: hidden; user-select: none;
  `;

  metaFloatingBanner.innerHTML = `
    <div id="meta-banner-header" style="display:flex; justify-space-between; align-items:center; padding:10px 14px; background:#2A2A2A; cursor:move; border-bottom:1px solid #3A3A3A;">
      <span style="background-color:#FF5722; color:#FFFFFF; font-weight:700; font-size:11px; padding:2px 6px; border-radius:4px;">META DESCRIPTION</span>
      <div style="display:flex; gap:6px; align-items:center;">
        <button id="btn-meta-banner-copy" title="설명 복사" style="background:transparent; border:none; color:#AAAAAA; cursor:pointer; padding:2px; display:flex; align-items:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </button>
        <button id="btn-meta-banner-close" title="닫기" style="background:transparent; border:none; color:#AAAAAA; cursor:pointer; font-size:16px; line-height:1; padding:2px;">✕</button>
      </div>
    </div>
    <div style="padding:12px 14px; line-height:1.5; font-weight:500; color:#E0E0E0; word-break:break-all; white-space:pre-wrap; max-height:200px; overflow-y:auto; user-select:text;">${metaDesc}</div>
  `;

  document.body.appendChild(metaFloatingBanner);

  document.getElementById('btn-meta-banner-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(rawMetaDesc).then(() => showToast('메타 설명이 복사되었습니다.'));
  });

  document.getElementById('btn-meta-banner-close').addEventListener('click', () => {
    options.showMeta = false;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ showMeta: false });
    }
    removeMetaFloatingBanner();
  });

  makeElementDraggable(metaFloatingBanner, document.getElementById('meta-banner-header'));
}

function removeMetaFloatingBanner() {
  const banner = document.getElementById('hud-meta-floating-banner');
  if (banner) banner.remove();
}

function makeElementDraggable(elmnt, headerEl) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (headerEl) headerEl.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (e.target.closest('button')) return;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.right = 'auto';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function createSidePanel() {
  if (document.getElementById('nav-side-panel')) return;

  sidePanel = document.createElement('div');
  sidePanel.id = 'nav-side-panel';
  sidePanel.className = 'collapsed'; 
  sidePanel.innerHTML = `
    <div class="nav-header">
      <h1 class="nav-title">Navigation</h1>
      <div class="nav-header-actions">
        <button id="nav-btn-eye" class="nav-icon-btn" title="전체 배지 토글 (ON/OFF)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button id="nav-btn-collapse" class="nav-icon-btn" title="사이드바 접기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 17L13 12L18 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11 17L6 12L11 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="nav-tab-container">
      <button id="nav-tab-htag" class="nav-tab-btn active">H태그</button>
      <button id="nav-tab-tagging" class="nav-tab-btn">태깅값</button>
      <button id="nav-tab-meta" class="nav-tab-btn">메타</button>
    </div>
    <div class="nav-body-content" id="nav-htag-list"></div>
  `;

  expandBtn = document.createElement('button');
  expandBtn.id = 'nav-expand-btn';
  expandBtn.title = '사이드바 펼치기';
  expandBtn.style.display = 'flex';
  expandBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 17L11 12L6 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 17L18 12L13 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  (document.body || document.documentElement).appendChild(sidePanel);
  (document.body || document.documentElement).appendChild(expandBtn);

  const eyeBtn = document.getElementById('nav-btn-eye');
  const collapseBtn = document.getElementById('nav-btn-collapse');
  const tabHtag = document.getElementById('nav-tab-htag');
  const tabTagging = document.getElementById('nav-tab-tagging');
  const tabMeta = document.getElementById('nav-tab-meta');

  collapseBtn.addEventListener('click', () => {
    sidePanel.classList.add('collapsed');
    if (options.showNav) expandBtn.style.display = 'flex';
  });

  expandBtn.addEventListener('click', () => {
    sidePanel.classList.remove('collapsed');
    expandBtn.style.display = 'none';
    renderNavList();
  });

  const switchTab = (tabName, activeEl) => {
    currentTab = tabName;
    [tabHtag, tabTagging, tabMeta].forEach(el => el.classList.remove('active'));
    activeEl.classList.add('active');
    renderNavList();
  };

  tabHtag.addEventListener('click', () => switchTab('HTAG', tabHtag));
  tabTagging.addEventListener('click', () => switchTab('TAGGING', tabTagging));
  tabMeta.addEventListener('click', () => switchTab('META', tabMeta));

  eyeBtn.addEventListener('click', () => {
    isGlobalBadgeVisible = !isGlobalBadgeVisible;

    if (isGlobalBadgeVisible) {
      eyeBtn.style.color = '#22F2FF';
      eyeBtn.style.background = 'rgba(34, 242, 255, 0.15)';
      renderAllOverlayBadges();
      showToast('전체 배지가 표시되었습니다.');
    } else {
      eyeBtn.style.color = '';
      eyeBtn.style.background = '';
      removeAllHighlights();
      showToast('전체 배지가 숨겨졌습니다.');
    }
  });

  applyOptions();
}

function buildHTagTree(hElements) {
  const root = [];
  const stack = [];

  hElements.forEach((el, index) => {
    const tagName = el.tagName;
    const level = parseInt(tagName.replace('H', ''), 10);
    const textContent = (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
    if (!textContent) return;

    let targetId = el.getAttribute('data-hud-id');
    if (!targetId) {
      targetId = `htag-node-${index}-${Date.now()}`;
      el.setAttribute('data-hud-id', targetId);
    }

    const node = { tagName, level, textContent, targetId, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
}

function extractUnderlineCodes(text) {
  if (!text) return [];
  const regex = /_([A-Za-z]+\d+)_/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function buildTaggingGroupTree(taggedElements) {
  const groups = {};

  taggedElements.forEach((el, index) => {
    const rawVal = el.getAttribute('data-contents')?.trim();
    if (!rawVal) return;

    const matches = extractUnderlineCodes(rawVal);
    if (matches.length === 0) return;

    let targetId = el.getAttribute('data-hud-id');
    if (!targetId) {
      targetId = `tagging-node-${index}-${Date.now()}`;
      el.setAttribute('data-hud-id', targetId);
    }

    matches.forEach(code => {
      if (!groups[code]) groups[code] = { code, items: [] };
      groups[code].items.push({ targetId: targetId, fullContent: rawVal });
    });
  });

  return groups;
}

function generateHTagTreeHTML(nodes) {
  let html = '';
  nodes.forEach(node => {
    const hasChildren = node.children && node.children.length > 0;
    const safeText = escapeHTML(node.textContent);
    
    html += `
      <div class="htag-node-group">
        <div class="htag-item tag-${node.tagName}" data-target-id="${node.targetId}" title="${safeText}">
          <div class="htag-item-left">
            ${hasChildren ? `<button class="htag-toggle-btn" title="접기/펼치기">▶</button>` : `<span class="htag-toggle-placeholder"></span>`}
            <span class="htag-badge tag-${node.tagName}">${node.tagName}</span>
            <span class="htag-text">${safeText}</span>
          </div>
          <div class="htag-item-actions">
            <button class="htag-action-btn btn-locate" title="해당 위치로 이동" data-target-id="${node.targetId}">
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5 2.5z"/></svg>
            </button>
            <button class="htag-action-btn btn-copy" title="텍스트 복사" data-text="${encodeURIComponent(node.textContent)}">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
        ${hasChildren ? `<div class="htag-children-container">${generateHTagTreeHTML(node.children)}</div>` : ''}
      </div>
    `;
  });
  return html;
}

function generateTaggingGroupHTML(groups) {
  let html = '';
  Object.keys(groups).forEach(code => {
    const group = groups[code];
    const firstTargetId = group.items[0].targetId;
    const safeCode = escapeHTML(code);

    html += `
      <div class="htag-node-group">
        <div class="htag-item tag-TAGGING" data-target-id="${firstTargetId}">
          <div class="htag-item-left">
            <button class="htag-toggle-btn" title="접기/펼치기">▶</button>
            <span class="htag-text" style="font-weight: 500; font-size: 13px; color: #111;">${safeCode}</span>
          </div>
          <div class="htag-item-actions">
            <button class="htag-action-btn btn-locate" title="해당 위치로 이동" data-target-id="${firstTargetId}">
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5 2.5z"/></svg>
            </button>
            <button class="htag-action-btn btn-copy" title="코드 복사" data-text="${encodeURIComponent(code)}">
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
        <div class="htag-children-container">
          ${group.items.map(item => `
            <div class="htag-item" data-target-id="${item.targetId}" title="${escapeHTML(item.fullContent)}">
              <div class="htag-item-left">
                <span class="htag-toggle-placeholder"></span>
                <span class="htag-text" style="font-weight: 500; color: #555; font-size: 12px;">${escapeHTML(item.fullContent)}</span>
              </div>
              <div class="htag-item-actions">
                <button class="htag-action-btn btn-locate" title="해당 위치로 이동" data-target-id="${item.targetId}">
                  <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5 2.5z"/></svg>
                </button>
                <button class="htag-action-btn btn-copy" title="속성값 전체 복사" data-text="${encodeURIComponent(item.fullContent)}">
                  <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  return html;
}

function generateMetaHTML() {
  const rawDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  if (!rawDesc) return `<div class="empty-msg">페이지에 meta name="description" 속성이 존재하지 않습니다.</div>`;

  return `
    <div class="htag-node-group expanded">
      <div class="htag-item" style="height: auto; padding: 12px; flex-direction: column; align-items: flex-start; gap: 8px;">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span class="htag-badge" style="background-color: #FF5722; color: #FFF; font-weight: 700;">META</span>
          <button class="htag-action-btn btn-copy" title="설명 복사" data-text="${encodeURIComponent(rawDesc)}">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </div>
        <div style="font-size: 13px; font-weight: 500; color: #333; line-height: 1.5; word-break: break-all; white-space: pre-wrap;">${escapeHTML(rawDesc)}</div>
      </div>
    </div>
  `;
}

function scrollToElement(targetId) {
  if (!targetId) return;
  const targetEl = document.querySelector(`[data-hud-id="${targetId}"]`);
  
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const originalTransition = targetEl.style.transition;
    const originalBg = targetEl.style.backgroundColor;
    const originalBoxShadow = targetEl.style.boxShadow;

    targetEl.style.transition = 'all 0.3s ease-in-out';
    targetEl.style.backgroundColor = 'rgba(34, 242, 255, 0.35)';
    targetEl.style.boxShadow = '0 0 0 4px rgba(34, 242, 255, 0.5)';

    setTimeout(() => {
      targetEl.style.backgroundColor = originalBg;
      targetEl.style.boxShadow = originalBoxShadow;
      setTimeout(() => { targetEl.style.transition = originalTransition; }, 300);
    }, 1500);
  }
}

function renderNavList() {
  const listContainer = document.getElementById('nav-htag-list');
  if (!listContainer) return;

  if (currentTab === 'HTAG') {
    const hElements = document.querySelectorAll('h1, h2, h3, h4, h5');
    if (hElements.length === 0) {
      listContainer.innerHTML = `<div class="empty-msg">페이지에 H태그가 존재하지 않습니다.</div>`;
      return;
    }
    listContainer.innerHTML = `<div class="htag-tree-container">${generateHTagTreeHTML(buildHTagTree(hElements))}</div>`;
  } else if (currentTab === 'TAGGING') {
    const taggedElements = document.querySelectorAll('[data-contents]');
    if (taggedElements.length === 0) {
      listContainer.innerHTML = `<div class="empty-msg">페이지에 data-contents 태깅이 존재하지 않습니다.</div>`;
      return;
    }
    const groups = buildTaggingGroupTree(taggedElements);
    if (Object.keys(groups).length === 0) {
      listContainer.innerHTML = `<div class="empty-msg">유효한 태깅 코드(_알파벳+숫자_)가 없습니다.</div>`;
      return;
    }
    listContainer.innerHTML = `<div class="htag-tree-container">${generateTaggingGroupHTML(groups)}</div>`;
  } else if (currentTab === 'META') {
    listContainer.innerHTML = `<div class="htag-tree-container">${generateMetaHTML()}</div>`;
  }

  listContainer.querySelectorAll('.htag-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nodeGroup = btn.closest('.htag-node-group');
      if (nodeGroup) nodeGroup.classList.toggle('expanded');
    });
  });

  listContainer.querySelectorAll('.htag-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.htag-action-btn') || e.target.closest('.htag-toggle-btn')) return;
      listContainer.querySelectorAll('.htag-item').forEach(el => el.classList.remove('is-selected'));
      item.classList.add('is-selected');
      scrollToElement(item.getAttribute('data-target-id'));
    });
  });

  listContainer.querySelectorAll('.btn-locate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      scrollToElement(btn.getAttribute('data-target-id'));
    });
  });

  listContainer.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToCopy = decodeURIComponent(btn.getAttribute('data-text'));
      navigator.clipboard.writeText(textToCopy).then(() => showToast('클립보드에 복사되었습니다.'));
    });
  });
}

function showToast(msg) {
  const existing = document.querySelector('.nav-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'nav-toast';
  toast.textContent = msg;
  sidePanel.appendChild(toast);

  setTimeout(() => toast.remove(), 1500);
}

function extractAllText(element) {
  if (!element) return '';
  let text = (element.innerText || element.textContent || '').trim();
  if (text) return text.replace(/\s+/g, ' ');

  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  const texts = [];
  let node;
  while ((node = walk.nextNode())) {
    const val = node.nodeValue.trim();
    if (val) texts.push(val);
  }
  return Array.from(new Set(texts)).join(' ').replace(/\s+/g, ' ');
}

// 실시간 마우스 하단 최적화 타깃 감지 함수
function getRealTargetElement(e) {
  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  
  for (const el of elements) {
    if (el.closest('#nav-side-panel, #nav-expand-btn, #hud-meta-floating-banner, .hud-hover-badge, .hud-area-highlight')) continue;

    if (options.showTagging) {
      if (el.hasAttribute && el.hasAttribute('data-contents')) return { type: 'TAGGING', el: el };
      const taggedParent = el.closest('[data-contents]');
      if (taggedParent) return { type: 'TAGGING', el: taggedParent };
    }

    if (options.showHtag) {
      const hEl = el.closest('h1, h2, h3, h4, h5');
      if (hEl) return { type: 'HTAG', el: hEl };
    }

    if (options.showAlt) {
      if (el.tagName === 'IMG') return { type: 'ALT', el: el };
      const childImg = el.querySelector('img');
      if (childImg && el.contains(childImg)) return { type: 'ALT', el: childImg };
    }

    if (options.showAlt) {
      const btnOrLink = el.closest('button, a');
      if (btnOrLink) {
        const blindEl = btnOrLink.querySelector('.blind, .sr-only, [class*="blind"]');
        if (blindEl) return { type: 'P', el: blindEl };
      }
      const pOrBlind = el.closest('p, .blind, .sr-only, [class*="blind"]');
      if (pOrBlind) return { type: 'P', el: pOrBlind };
    }
  }

  return null;
}

function renderAllOverlayBadges() {
  removeAllHighlights();

  if (options.showTagging) {
    document.querySelectorAll('[data-contents]').forEach(el => {
      const val = el.getAttribute('data-contents');
      if (val) {
        const matches = extractUnderlineCodes(val);
        createAndAppendBadge(el, 'TAGGING', matches.length > 0 ? matches.join(', ') : val);
      }
    });
  }

  if (options.showHtag) {
    document.querySelectorAll('h1, h2, h3, h4, h5').forEach(el => {
      const text = el.textContent || el.innerText || '';
      if (text.trim() && (!options.showTagging || !el.hasAttribute('data-contents'))) {
        createAndAppendBadge(el, el.tagName.toUpperCase(), text);
      }
    });
  }

  if (options.showAlt) {
    document.querySelectorAll('img').forEach(img => {
      if (options.showTagging && (img.hasAttribute('data-contents') || img.closest('[data-contents]'))) return;
      let altVal = img.getAttribute('alt') || img.alt || '';
      const parentContainer = img.closest('.c-lazy-media, article, section, div, picture, figure, a, li, .thumb') || img.parentElement;
      if (parentContainer) {
        const blindEl = parentContainer.querySelector('.blind, .sr-only, [class*="blind"]');
        if (blindEl) {
          const blindText = extractAllText(blindEl);
          if (blindText) altVal = blindText;
        }
      }
      if (altVal.trim() || img.getBoundingClientRect().width > 20) {
        createAndAppendBadge(img, 'ALT', altVal);
      }
    });

    document.querySelectorAll('p, .blind, .sr-only').forEach(p => {
      if (p.closest('img')) return;
      const text = extractAllText(p);
      if (text.trim()) createAndAppendBadge(p, p.tagName === 'P' ? '<P>' : 'ALT', text);
    });
  }
}

function createAndAppendBadge(el, labelTag, rawText) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && !el.parentElement) return;

  let topPos = rect.top + window.scrollY;
  let leftPos = rect.left + window.scrollX;

  if (rect.width === 0 || rect.height === 0) {
    if (el.parentElement) {
      const parentRect = el.parentElement.getBoundingClientRect();
      topPos = parentRect.top + window.scrollY;
      leftPos = parentRect.left + window.scrollX;
    }
  }

  const isH = ['H1', 'H2', 'H3', 'H4', 'H5'].includes(labelTag);
  const isTagging = labelTag === 'TAGGING';
  const strokeColor = TAG_COLORS[labelTag] || '#CCCCCC';
  const safeContentText = escapeHTML((rawText || '').trim());

  if (isH && rect.width > 0) {
    const areaHighlight = document.createElement('div');
    areaHighlight.className = 'hud-area-highlight';
    areaHighlight.style.cssText = `
      position: absolute; top: ${topPos}px; left: ${leftPos}px;
      width: ${rect.width}px; height: ${rect.height}px;
      background-color: ${TAG_BG_COLORS[labelTag] || 'rgba(0, 0, 0, 0.05)'};
      border-radius: 8px; pointer-events: none; z-index: 999980;
    `;
    document.body.appendChild(areaHighlight);
  }

  const badge = document.createElement('div');
  badge.className = 'hud-hover-badge';

  const isDark = isTagging;
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const borderStyle = isDark ? '1px solid #333333' : (isH ? `1.5px solid ${strokeColor}` : '1px solid #CCCCCC');

  badge.style.cssText = `
    position: absolute; top: ${Math.max(0, topPos - 38)}px; left: ${leftPos}px;
    z-index: 999999; background: ${bgColor}; border-radius: 8px; padding: 6px 10px;
    color: ${textColor}; font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
    font-size: 12px; font-weight: 500; letter-spacing: -0.025em; pointer-events: none;
    white-space: pre-wrap; word-break: break-all; box-shadow: 0px 4px 14px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column; align-items: center; gap: 3px; line-height: 1.35;
    max-width: 380px; max-height: 250px; overflow-y: auto; text-align: left; border: ${borderStyle};
  `;

  const tagColorStyle = `color: ${strokeColor}; font-weight: 700;`;
  const textToShow = safeContentText !== '' ? safeContentText : '내용 없음';
  const dividerColor = isDark ? '#333333' : '#EEEEEE';

  badge.innerHTML = `
    <div style="${tagColorStyle}; text-align: center; width: 100%; border-bottom: 1px solid ${dividerColor}; padding-bottom: 2px;">${labelTag}</div>
    <div style="color: ${textColor}; font-weight: 500; width: 100%;">${textToShow}</div>
  `;

  document.body.appendChild(badge);
}

function showSingleBadge(el, labelTag, rawText) {
  removeAllHighlights();
  createAndAppendBadge(el, labelTag, rawText);
}

function removeAllHighlights() {
  document.querySelectorAll('.hud-hover-badge, .hud-area-highlight').forEach(el => el.remove());
}

// 렉 방지(Throttling): requestAnimationFrame 기반 핸들러
document.addEventListener('mousemove', (e) => {
  if (isGlobalBadgeVisible) return;

  if (!isTicking) {
    window.requestAnimationFrame(() => {
      if (sidePanel && sidePanel.contains(e.target)) {
        removeAllHighlights();
        currentTargetEl = null;
        isTicking = false;
        return;
      }

      const result = getRealTargetElement(e);
      if (!result) {
        removeAllHighlights();
        currentTargetEl = null;
        isTicking = false;
        return;
      }

      const { type, el } = result;

      if (currentTargetEl !== el) {
        currentTargetEl = el;

        if (type === 'TAGGING') {
          const taggingVal = el.getAttribute('data-contents');
          const matches = extractUnderlineCodes(taggingVal);
          showSingleBadge(el, 'TAGGING', matches.length > 0 ? matches.join(', ') : taggingVal);
        } else if (type === 'HTAG') {
          showSingleBadge(el, el.tagName.toUpperCase(), el.textContent || el.innerText || '');
        } else if (type === 'ALT') {
          let altVal = el.getAttribute('alt') || el.alt || '';
          if (!altVal.trim()) {
            const container = el.closest('.c-lazy-media, article, section, div, picture, figure, a, li, .thumb') || el.parentElement;
            if (container) {
              const blindEl = container.querySelector('.blind, .sr-only, [class*="blind"]');
              if (blindEl) altVal = extractAllText(blindEl);
            }
          }
          showSingleBadge(el, 'ALT', altVal);
        } else if (type === 'P') {
          showSingleBadge(el, el.tagName === 'P' ? '<P>' : 'ALT', extractAllText(el));
        }
      }

      isTicking = false;
    });

    isTicking = true;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidePanel);
} else {
  createSidePanel();
}