/**
 * RBACchain Dashboard — app.js
 * SPA Router + Blockchain Integration (ethers.js v6)
 * Network: Polygon Amoy Testnet (Chain ID 80002)
 */

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════

const CONFIG = {
  CONTRACT_ADDRESS: '0xc00F4d45936e0537D606Bc65cC0E8d2C052aC553', 
  CHAIN_ID:         80002,
  CHAIN_NAME:       'Polygon Amoy',
  RPC_URL:          'https://rpc-amoy.polygon.technology/',
  BLOCK_EXPLORER:   'https://amoy.polygonscan.com',
  CURRENCY:         { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
};

const ABI = [
  'function createRole(string calldata name) external returns (uint256)',
  'function getRoleCount() external view returns (uint256)',
  'function createPermission(string calldata name) external returns (uint256)',
  'function getPermissionCount() external view returns (uint256)',
  'function assignPermissionToRole(uint256 roleId, uint256 permId) external',
  'function assignRoleToUser(address user, uint256 roleId) external',
  'function suspendUser(address user) external',
  'function revokeUser(address user) external',
  'function hasPermission(address user, uint256 permId) external view returns (bool)',
  'event RoleCreated(uint256 indexed roleId, string name, address indexed creator)',
  'event PermissionCreated(uint256 indexed permId, string name, address indexed creator)',
  'event PermissionAssigned(uint256 indexed roleId, uint256 indexed permId)',
  'event RoleAssigned(address indexed user, uint256 indexed roleId)',
  'event UserSuspended(address indexed user)',
  'event UserRevoked(address indexed user)',
];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════

const state = {
  provider:      null,
  signer:        null,
  contract:      null,
  walletAddress: null,
  connected:     false,
  txCount:       0,
  activityLog:   [],
  activeFilter:  'all',
  currentPage:   'dashboard',
};

// ══════════════════════════════════════════
// DOM HELPERS
// ══════════════════════════════════════════

const $  = id => document.getElementById(id);
const show  = el => el && el.classList.remove('hidden');
const hide  = el => el && el.classList.add('hidden');

function truncate(str, len = 10) {
  if (!str || str.length <= len) return str;
  return `${str.slice(0, 6)}…${str.slice(-4)}`;
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ══════════════════════════════════════════
// SPA ROUTER
// ══════════════════════════════════════════

function navigateTo(pageId) {
  if (state.currentPage === pageId) return;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const target = $(`page-${pageId}`);
  if (!target) return;
  target.classList.add('active');

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });

  // Update mobile drawer links
  document.querySelectorAll('.md-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });

  state.currentPage = pageId;

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile drawer
  const drawer = $('mobileDrawer');
  if (drawer && !drawer.classList.contains('hidden')) {
    hide(drawer);
    $('hamburger').classList.remove('open');
  }
}

function setupRouter() {
  // Navbar links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Mobile drawer links
  document.querySelectorAll('.md-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Quick cards (dashboard → page)
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.goto));
  });
}

// ══════════════════════════════════════════
// MOBILE HAMBURGER
// ══════════════════════════════════════════

function setupHamburger() {
  const btn    = $('hamburger');
  const drawer = $('mobileDrawer');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !drawer.classList.contains('hidden');
    open ? hide(drawer) : show(drawer);
    btn.classList.toggle('open', !open);
  });

  document.addEventListener('click', e => {
    if (!drawer.classList.contains('hidden') &&
        !drawer.contains(e.target) &&
        !btn.contains(e.target)) {
      hide(drawer);
      btn.classList.remove('open');
    }
  });
}

// ══════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════

const TOAST_ICONS = {
  success: 'fa-circle-check',
  error:   'fa-circle-xmark',
  info:    'fa-circle-info',
};

function toast(msg, type = 'info') {
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-ico"><i class="fa-solid ${TOAST_ICONS[type]}"></i></div>
    <span class="toast-msg">${msg}</span>
    <span class="toast-x" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></span>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = '0.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    setTimeout(() => el.remove(), 300);
  }, 5000);
}

// ══════════════════════════════════════════
// TX MODAL
// ══════════════════════════════════════════

function showTxModal(title, desc) {
  $('txTitle').textContent = title;
  $('txDesc').textContent  = desc;
  hide($('txHashWrap'));
  show($('txModal'));
}

function updateTxModal(hash) {
  const link = $('txHashLink');
  link.textContent = truncate(hash, 20);
  link.href = `${CONFIG.BLOCK_EXPLORER}/tx/${hash}`;
  show($('txHashWrap'));
  $('txDesc').textContent = 'Transaction submitted. Waiting for confirmation…';
}

function hideTxModal() { hide($('txModal')); }

// ══════════════════════════════════════════
// BUTTON LOADING STATE
// ══════════════════════════════════════════

function setLoading(btnId, loading) {
  const btn  = $(btnId);
  if (!btn) return;
  const spin = btn.querySelector('.btn-spin');
  const icon = btn.querySelector('i:first-child');
  btn.disabled = loading;
  if (spin) loading ? show(spin) : hide(spin);
  if (icon)  icon.style.opacity = loading ? '0' : '1';
}

// ══════════════════════════════════════════
// WALLET CONNECTION
// ══════════════════════════════════════════

async function connectWallet() {
  if (!window.ethereum) {
    toast('MetaMask not detected. Please install it first.', 'error');
    return;
  }
  $('connectBtn').disabled = true;
  $('connectLabel').textContent = 'Connecting…';

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts.length) throw new Error('No accounts found');

    await ensureNetwork();

    state.provider      = new ethers.BrowserProvider(window.ethereum);
    state.signer        = await state.provider.getSigner();
    state.walletAddress = await state.signer.getAddress();
    state.contract      = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, state.signer);
    state.connected     = true;

    updateWalletUI();
    toast(`Connected: ${truncate(state.walletAddress)}`, 'success');
    loadContractStats();
    startBlockPoller();

    window.ethereum.on('accountsChanged', accs => {
      if (!accs.length) resetWallet();
      else { state.walletAddress = accs[0]; $('walletAddr').textContent = truncate(accs[0]); }
    });
    window.ethereum.on('chainChanged', () => window.location.reload());

  } catch (err) {
    console.error(err);
    if (err.code !== 4001) toast(err.message || 'Connection failed', 'error');
    $('connectBtn').disabled = false;
    $('connectLabel').textContent = 'Connect Wallet';
  }
}

async function ensureNetwork() {
  const hex = await window.ethereum.request({ method: 'eth_chainId' });
  if (parseInt(hex, 16) === CONFIG.CHAIN_ID) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + CONFIG.CHAIN_ID.toString(16) }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x' + CONFIG.CHAIN_ID.toString(16),
          chainName: CONFIG.CHAIN_NAME,
          nativeCurrency: CONFIG.CURRENCY,
          rpcUrls: [CONFIG.RPC_URL],
          blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
        }],
      });
    } else throw e;
  }
}

function updateWalletUI() {
  hide($('connectBtn'));
  show($('walletChip'));
  $('walletAddr').textContent = truncate(state.walletAddress);

  // Dynamic avatar colour from address
  const hue = parseInt(state.walletAddress.slice(2, 6), 16) % 360;
  $('walletAvatar').style.background =
    `linear-gradient(135deg, hsl(${hue},65%,55%), hsl(${(hue + 80) % 360},65%,60%))`;

  // Auto-fill access control wallet field
  if ($('checkAddr')) $('checkAddr').value = state.walletAddress;
}

function resetWallet() {
  state.connected = false;
  state.walletAddress = null;
  show($('connectBtn'));
  hide($('walletChip'));
  $('connectBtn').disabled = false;
  $('connectLabel').textContent = 'Connect Wallet';
}

// ══════════════════════════════════════════
// BLOCK POLLER
// ══════════════════════════════════════════

function startBlockPoller() {
  if (!state.provider) return;
  state.provider.on('block', n => { $('blockNumber').textContent = n.toLocaleString(); });
}

// ══════════════════════════════════════════
// CONTRACT STATS
// ══════════════════════════════════════════

async function loadContractStats() {
  if (!state.contract) return;
  try {
    const [roles, perms] = await Promise.all([
      state.contract.getRoleCount(),
      state.contract.getPermissionCount(),
    ]);
    $('totalRoles').textContent = roles.toString();
    $('totalPerms').textContent = perms.toString();
  } catch (e) {
    console.warn('Stats unavailable (contract may not be deployed):', e.shortMessage || e.message);
  }
}

function bumpTxCount() {
  state.txCount++;
  $('txCount').textContent = state.txCount;
}

// ══════════════════════════════════════════
// GENERIC TX WRAPPER
// ══════════════════════════════════════════

async function sendTx(txFn, title, onDone) {
  if (!state.connected) {
    toast('Connect your wallet first.', 'error');
    return null;
  }
  showTxModal(title, 'Confirm in MetaMask…');
  try {
    const tx = await txFn();
    updateTxModal(tx.hash);
    const receipt = await tx.wait();
    hideTxModal();
    bumpTxCount();
    if (onDone) onDone(receipt);
    return receipt;
  } catch (err) {
    hideTxModal();
    if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
      toast('Transaction cancelled.', 'info');
    } else {
      toast(`Error: ${err.reason || err.shortMessage || err.message}`, 'error');
    }
    return null;
  }
}

// ══════════════════════════════════════════
// ACTIVITY FEED
// ══════════════════════════════════════════

const FEED_META = {
  role:       { icon: 'fa-shield-virus',  cls: 'fe-role',    label: 'Role Created',       fkey: 'role' },
  perm:       { icon: 'fa-key',           cls: 'fe-perm',    label: 'Permission Created',  fkey: 'permission' },
  assign:     { icon: 'fa-link',          cls: 'fe-assign',  label: 'Permission Assigned', fkey: 'permission' },
  roleAssign: { icon: 'fa-user-shield',   cls: 'fe-assign',  label: 'Role Assigned',       fkey: 'role' },
  suspend:    { icon: 'fa-circle-pause',  cls: 'fe-suspend', label: 'User Suspended',      fkey: 'user' },
  revoke:     { icon: 'fa-ban',           cls: 'fe-revoke',  label: 'User Revoked',        fkey: 'user' },
  granted:    { icon: 'fa-circle-check',  cls: 'fe-granted', label: 'Access Granted',      fkey: 'access' },
  denied:     { icon: 'fa-circle-xmark',  cls: 'fe-denied',  label: 'Access Denied',       fkey: 'access' },
};

function addLog(type, detail, addr = '') {
  const meta  = FEED_META[type] || FEED_META.role;
  const entry = { type, meta, detail, addr, time: timestamp() };
  state.activityLog.unshift(entry);
  prependFeedEntry(entry);
  hide($('feedEmpty'));
}

function prependFeedEntry(entry) {
  if (state.activeFilter !== 'all' && entry.meta.fkey !== state.activeFilter) return;
  const feed = $('activityFeed');
  const el = makeFeedEl(entry);
  if (feed.firstChild) feed.insertBefore(el, feed.firstChild);
  else feed.appendChild(el);
}

function makeFeedEl(entry) {
  const el = document.createElement('div');
  el.className = `feed-entry ${entry.meta.cls}`;
  el.dataset.fkey = entry.meta.fkey;
  el.innerHTML = `
    <div class="fe-icon"><i class="fa-solid ${entry.meta.icon}"></i></div>
    <div class="fe-body">
      <div class="fe-title">${entry.meta.label}</div>
      <div class="fe-detail">${entry.detail}${entry.addr ? ' · ' + truncate(entry.addr) : ''}</div>
    </div>
    <div class="fe-time">${entry.time}</div>
  `;
  return el;
}

function rebuildFeed() {
  const feed = $('activityFeed');
  feed.querySelectorAll('.feed-entry').forEach(e => e.remove());
  const filtered = state.activeFilter === 'all'
    ? state.activityLog
    : state.activityLog.filter(e => e.meta.fkey === state.activeFilter);
  if (!filtered.length) { show($('feedEmpty')); return; }
  hide($('feedEmpty'));
  filtered.forEach(e => feed.appendChild(makeFeedEl(e)));
}

function setupFilters() {
  document.querySelectorAll('.fpill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fpill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      rebuildFeed();
    });
  });

  $('clearLogs').addEventListener('click', () => {
    state.activityLog = [];
    $('activityFeed').querySelectorAll('.feed-entry').forEach(e => e.remove());
    show($('feedEmpty'));
  });
}

// ══════════════════════════════════════════
// ADMIN ACTIONS
// ══════════════════════════════════════════

// Create Role
async function handleCreateRole() {
  const name = $('roleName').value.trim().toUpperCase();
  if (!name) { toast('Enter a role name.', 'error'); return; }
  setLoading('createRoleBtn', true);
  await sendTx(
    () => state.contract.createRole(name),
    'Creating Role',
    () => {
      toast(`Role "${name}" created!`, 'success');
      addLog('role', `Role "${name}" created`, state.walletAddress);
      $('roleName').value = '';
      loadContractStats();
    }
  );
  setLoading('createRoleBtn', false);
}

// Create Permission
async function handleCreatePermission() {
  const name = $('permName').value.trim().toUpperCase();
  if (!name) { toast('Enter a permission name.', 'error'); return; }
  setLoading('createPermBtn', true);
  await sendTx(
    () => state.contract.createPermission(name),
    'Creating Permission',
    () => {
      toast(`Permission "${name}" created!`, 'success');
      addLog('perm', `Permission "${name}" created`, state.walletAddress);
      $('permName').value = '';
      loadContractStats();
    }
  );
  setLoading('createPermBtn', false);
}

// Assign Permission to Role
async function handleAssignPermission() {
  const rid = $('assignRoleId').value;
  const pid = $('assignPermId').value;
  if (rid === '' || pid === '') { toast('Enter both Role ID and Permission ID.', 'error'); return; }
  setLoading('assignPermBtn', true);
  await sendTx(
    () => state.contract.assignPermissionToRole(rid, pid),
    'Assigning Permission',
    () => {
      toast(`Perm #${pid} assigned to Role #${rid}`, 'success');
      addLog('assign', `Perm #${pid} → Role #${rid}`, state.walletAddress);
      $('assignRoleId').value = '';
      $('assignPermId').value = '';
    }
  );
  setLoading('assignPermBtn', false);
}

// Assign Role to User
async function handleAssignRole() {
  const addr = $('roleUserAddr').value.trim();
  const rid  = $('roleId').value;
  if (!addr || rid === '') { toast('Enter wallet address and role ID.', 'error'); return; }
  if (!ethers.isAddress(addr)) { toast('Invalid wallet address.', 'error'); return; }
  setLoading('assignRoleBtn', true);
  await sendTx(
    () => state.contract.assignRoleToUser(addr, rid),
    'Assigning Role to User',
    () => {
      toast(`Role #${rid} assigned to ${truncate(addr)}`, 'success');
      addLog('roleAssign', `Role #${rid} assigned`, addr);
      $('roleUserAddr').value = '';
      $('roleId').value = '';
    }
  );
  setLoading('assignRoleBtn', false);
}

// Suspend User
async function handleSuspend() {
  const addr = $('suspendAddr').value.trim();
  if (!addr) { toast('Enter a wallet address.', 'error'); return; }
  if (!ethers.isAddress(addr)) { toast('Invalid wallet address.', 'error'); return; }
  setLoading('suspendBtn', true);
  await sendTx(
    () => state.contract.suspendUser(addr),
    'Suspending User',
    () => {
      toast(`${truncate(addr)} suspended.`, 'success');
      addLog('suspend', 'User access suspended', addr);
      $('suspendAddr').value = '';
    }
  );
  setLoading('suspendBtn', false);
}

// Revoke User
async function handleRevoke() {
  const addr = $('revokeAddr').value.trim();
  if (!addr) { toast('Enter a wallet address.', 'error'); return; }
  if (!ethers.isAddress(addr)) { toast('Invalid wallet address.', 'error'); return; }
  setLoading('revokeBtn', true);
  await sendTx(
    () => state.contract.revokeUser(addr),
    'Revoking User',
    () => {
      toast(`${truncate(addr)} revoked.`, 'success');
      addLog('revoke', 'All access revoked permanently', addr);
      $('revokeAddr').value = '';
    }
  );
  setLoading('revokeBtn', false);
}

// Check Access
async function handleCheckAccess() {
  const addr = $('checkAddr').value.trim();
  const pid  = $('checkPermId').value;
  const panel = $('accessResult');

  if (!addr || pid === '') { toast('Enter wallet address and permission ID.', 'error'); return; }
  if (!ethers.isAddress(addr)) { toast('Invalid wallet address.', 'error'); return; }

  // Loading state
  panel.innerHTML = `
    <div class="arc-placeholder">
      <div class="arc-shield" style="background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.2)">
        <i class="fa-solid fa-circle-notch fa-spin" style="color:var(--violet-l)"></i>
      </div>
      <h3>Querying on-chain…</h3>
      <p>Reading permission state from Polygon Amoy</p>
    </div>
  `;

  try {
    let has;
    if (state.connected) {
      has = await state.contract.hasPermission(addr, pid);
    } else {
      const rp = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
      const rc = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, rp);
      has = await rc.hasPermission(addr, pid);
    }

    if (has) {
      panel.innerHTML = `
        <div class="result-badge rb-granted">
          <div class="rb-icon"><i class="fa-solid fa-shield-check"></i></div>
          <div class="rb-label">Access Granted</div>
          <div class="rb-meta">Permission #${pid}<br>${truncate(addr)}</div>
        </div>
      `;
      addLog('granted', `Perm #${pid} — GRANTED`, addr);
    } else {
      panel.innerHTML = `
        <div class="result-badge rb-denied">
          <div class="rb-icon"><i class="fa-solid fa-shield-xmark"></i></div>
          <div class="rb-label">Access Denied</div>
          <div class="rb-meta">Permission #${pid}<br>${truncate(addr)}</div>
        </div>
      `;
      addLog('denied', `Perm #${pid} — DENIED`, addr);
    }
  } catch (err) {
    panel.innerHTML = `
      <div class="arc-placeholder">
        <div class="arc-shield" style="background:rgba(217,119,6,0.1);border-color:rgba(217,119,6,0.2)">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--amber-l)"></i>
        </div>
        <h3>Query Failed</h3>
        <p>Check contract address and network connection</p>
      </div>
    `;
    toast('Access check failed: ' + (err.shortMessage || err.message), 'error');
  }
}

// ══════════════════════════════════════════
// ENTER KEY SHORTCUTS
// ══════════════════════════════════════════

function setupEnterKeys() {
  [
    ['roleName',    'createRoleBtn'],
    ['permName',    'createPermBtn'],
    ['suspendAddr', 'suspendBtn'],
    ['revokeAddr',  'revokeBtn'],
    ['checkPermId', 'checkAccessBtn'],
  ].forEach(([inp, btn]) => {
    const el = $(inp);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') $(btn).click(); });
  });
}

// ══════════════════════════════════════════
// DEMO LOG ENTRIES
// ══════════════════════════════════════════

function loadDemoLogs() {
  setTimeout(() => {
    addLog('role',    'Role "ADMIN" created',            '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    addLog('perm',    'Permission "READ_ACCESS" created', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    addLog('assign',  'Perm #0 → Role #0',               '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    addLog('granted', 'Perm #0 — GRANTED',               '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2');
  }, 700);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════

function init() {
  setupRouter();
  setupHamburger();
  setupFilters();
  setupEnterKeys();

  $('connectBtn').addEventListener('click', connectWallet);
  $('createRoleBtn').addEventListener('click', handleCreateRole);
  $('createPermBtn').addEventListener('click', handleCreatePermission);
  $('assignPermBtn').addEventListener('click', handleAssignPermission);
  $('assignRoleBtn').addEventListener('click', handleAssignRole);
  $('suspendBtn').addEventListener('click', handleSuspend);
  $('revokeBtn').addEventListener('click', handleRevoke);
  $('checkAccessBtn').addEventListener('click', handleCheckAccess);

  loadDemoLogs();

  // Auto-reconnect if MetaMask already authorised
  // if (window.ethereum?.selectedAddress) connectWallet();

  console.log('%c⬡ RBACchain loaded', 'color:#a78bfa;font-size:14px;font-weight:bold');
}

document.addEventListener('DOMContentLoaded', init);