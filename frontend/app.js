/* ═══════════════════════════════════════════════════════════════
HOSPITAL RBAC DASHBOARD — app.js (Shared across all pages)
Network : Polygon Amoy Testnet (Chain ID: 80002)
Contract: 0xc00F4d45936e0537D606Bc65cC0E8d2C052aC553
Library : ethers.js v6
Strategy: Page detection via body[data-page], localStorage
          used to persist logs and staff count across pages.
═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
// CONTRACT CONFIGURATION
// ─────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS       = "0xc00F4d45936e0537D606Bc65cC0E8d2C052aC553";
const POLYGON_AMOY_CHAIN_ID  = 80002;

const CONTRACT_ABI = [
{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
{ "anonymous": false, "name": "AccessDenied",      "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "permissionId", "type": "uint256" }] },
{ "anonymous": false, "name": "AccessGranted",     "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "permissionId", "type": "uint256" }] },
{ "anonymous": false, "name": "PermissionAssigned","type": "event", "inputs": [{ "indexed": false, "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "permissionId", "type": "uint256" }] },
{ "anonymous": false, "name": "PermissionCreated", "type": "event", "inputs": [{ "indexed": false, "internalType": "uint256", "name": "permissionId", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }] },
{ "anonymous": false, "name": "RoleAssigned",      "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "roleId", "type": "uint256" }] },
{ "anonymous": false, "name": "RoleCreated",       "type": "event", "inputs": [{ "indexed": false, "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" }] },
{ "anonymous": false, "name": "UserActivated",     "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }] },
{ "anonymous": false, "name": "UserRevoked",       "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }] },
{ "anonymous": false, "name": "UserSuspended",     "type": "event", "inputs": [{ "indexed": false, "internalType": "address", "name": "user", "type": "address" }] },
{ "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "activateUser",      "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [{ "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "internalType": "uint256", "name": "permissionId", "type": "uint256" }], "name": "assignPermissionToRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [{ "internalType": "address", "name": "user", "type": "address" }, { "internalType": "uint256", "name": "roleId", "type": "uint256" }], "name": "assignRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [{ "internalType": "address", "name": "user", "type": "address" }, { "internalType": "uint256", "name": "permissionId", "type": "uint256" }], "name": "checkAccess", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "string", "name": "name", "type": "string" }], "name": "createPermission", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [{ "internalType": "string", "name": "name", "type": "string" }], "name": "createRole",       "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [], "name": "permissionCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "permissions", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "bool", "name": "exists", "type": "bool" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "revokeUser",  "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [], "name": "roleCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "", "type": "uint256" }], "name": "rolePermissions", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "roles", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "bool", "name": "exists", "type": "bool" }], "stateMutability": "view", "type": "function" },
{ "inputs": [], "name": "superAdmin", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
{ "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "suspendUser", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "users", "outputs": [{ "internalType": "uint256", "name": "roleId", "type": "uint256" }, { "internalType": "enum RBAC.UserStatus", "name": "status", "type": "uint8" }], "stateMutability": "view", "type": "function" }
];

// ─────────────────────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────────────────────
let provider         = null;
let signer           = null;
let contract         = null;   // read + write (needs signer)
let roContract       = null;   // read-only (no signer needed)
let connectedAccount = null;

// In-memory caches (populated fresh per page load from blockchain)
let rolesCache       = [];  // [{ id: BigInt, name: string }]
let permissionsCache = [];  // [{ id: BigInt, name: string }]

// ─────────────────────────────────────────────────────────────
// PERSISTENCE HELPERS  (localStorage)
// ─────────────────────────────────────────────────────────────

/** Save a log entry to localStorage (persists across page navigations) */
function saveLog(entry) {
try {
 let logs = getStoredLogs();
 logs.unshift(entry);
 if (logs.length > 150) logs = logs.slice(0, 150); // cap at 150 entries
 localStorage.setItem('rbac_logs', JSON.stringify(logs));
} catch (e) { console.warn('Log save failed:', e); }
}

/** Read all stored log entries from localStorage */
function getStoredLogs() {
try { return JSON.parse(localStorage.getItem('rbac_logs') || '[]'); }
catch { return []; }
}

/** Clear all stored logs */
function clearStoredLogs() {
localStorage.removeItem('rbac_logs');
}

/** Get / increment the tracked staff count */
function getStaffCount()  { return parseInt(localStorage.getItem('rbac_staff_count') || '0'); }
function incStaffCount()  { const c = getStaffCount() + 1; localStorage.setItem('rbac_staff_count', c); return c; }

// ─────────────────────────────────────────────────────────────
// WALLET CONNECTION  (shared — runs on every page)
// ─────────────────────────────────────────────────────────────

/** Connect MetaMask, enforce Polygon Amoy, initialize contract instances */
async function connectWallet() {
if (!window.ethereum) {
 showToast('error', 'MetaMask Required', 'Please install MetaMask to continue.');
 return;
}
try {
 setBtnLoading('connectWalletBtn', true);
 provider = new ethers.BrowserProvider(window.ethereum);
 await provider.send('eth_requestAccounts', []);
 signer   = await provider.getSigner();
 connectedAccount = await signer.getAddress();

 // Enforce correct network
 const network = await provider.getNetwork();
 if (Number(network.chainId) !== POLYGON_AMOY_CHAIN_ID) {
   await switchToPolygonAmoy();
   provider = new ethers.BrowserProvider(window.ethereum);
   signer   = await provider.getSigner();
   connectedAccount = await signer.getAddress();
 }

 // Create contract instances
 contract   = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
 roContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

 updateWalletUI(connectedAccount);
 await loadPageData();           // load data relevant to current page
 listenToEvents();               // subscribe to contract events
 showToast('success', 'Wallet Connected', `Connected: ${shortAddr(connectedAccount)}`);

} catch (err) {
 console.error('connectWallet:', err);
 showToast('error', 'Connection Failed', parseContractError(err));
} finally {
 setBtnLoading('connectWalletBtn', false);
}
}

/** Add Polygon Amoy to MetaMask if needed, then switch to it */
async function switchToPolygonAmoy() {
try {
 await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x13882' }] });
} catch (err) {
 if (err.code === 4902) {
   await window.ethereum.request({
     method: 'wallet_addEthereumChain',
     params: [{ chainId: '0x13882', chainName: 'Polygon Amoy Testnet', rpcUrls: ['https://rpc-amoy.polygon.technology/'], nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, blockExplorerUrls: ['https://amoy.polygonscan.com/'] }]
   });
 } else { throw err; }
}
}

/** Update navbar to show connected wallet address */
function updateWalletUI(address) {
const btn  = document.getElementById('connectWalletBtn');
const box  = document.getElementById('walletAddress');
const text = document.getElementById('walletAddressText');
if (btn)  btn.style.display  = 'none';
if (box)  box.style.display  = 'flex';
if (text) text.textContent   = shortAddr(address);

// Auto-fill access check wallet field if on access page
const checkInput = document.getElementById('checkWalletInput');
if (checkInput && !checkInput.value) checkInput.value = address;
}

// React to MetaMask account/network changes
if (window.ethereum) {
window.ethereum.on('accountsChanged', (accounts) => {
 if (accounts.length === 0) { location.reload(); }
 else { connectedAccount = accounts[0]; updateWalletUI(connectedAccount); }
});
window.ethereum.on('chainChanged', () => location.reload());
}

// ─────────────────────────────────────────────────────────────
// PAGE DETECTION  — decide what to load based on current page
// ─────────────────────────────────────────────────────────────

/** Returns the current page identifier from <body data-page="..."> */
function currentPage() {
return document.body.getAttribute('data-page') || 'dashboard';
}

/** Load only the data relevant to the current page */
async function loadPageData() {
const page = currentPage();
switch (page) {
 case 'dashboard':
   await Promise.all([loadRoles(), loadPermissions(), loadSuperAdmin()]);
   renderDashboard();
   break;
 case 'roles':
   await Promise.all([loadRoles(), loadPermissions()]);
   renderRolesTable();
   populateRoleDropdowns();
   populatePermDropdowns();
   break;
 case 'policy':
   await Promise.all([loadRoles(), loadPermissions()]);
   renderRolesTable();
   renderPermsTable();
   populateRoleDropdowns();
   populatePermDropdowns();
   break;
 case 'permissions':
   // Load both — permissions for the table + roles for the Policy Management dropdowns
   await Promise.all([loadPermissions(), loadRoles()]);
   renderPermsTable();
   populateRoleDropdowns();   // fills policyRoleSelect
   populatePermDropdowns();   // fills policyPermSelect
   break;
 case 'staff':
   await loadRoles();
   populateRoleDropdowns();
   break;
 case 'access':
   await loadPermissions();
   populatePermDropdowns();
   break;
 case 'logs':
   renderLogs();   // renders from localStorage
   break;
}
}

// ─────────────────────────────────────────────────────────────
// DATA LOADING  (reads from blockchain)
// ─────────────────────────────────────────────────────────────

/** Load all roles (roles mapping is 1-indexed in the contract) */
async function loadRoles() {
if (!roContract) return;
try {
 const count = await roContract.roleCount();
 rolesCache = [];
 for (let i = 1n; i <= count; i++) {
   const r = await roContract.roles(i);
   if (r.exists) rolesCache.push({ id: i, name: r.name });
 }
 // Update count badges wherever they exist on this page
 setEl('rolesListCount',  rolesCache.length);
 setEl('rolesCountBadge', rolesCache.length);
 setEl('totalRoles',      rolesCache.length);
} catch (err) { console.error('loadRoles:', err); }
}

/** Load all permissions */
async function loadPermissions() {
if (!roContract) return;
try {
 const count = await roContract.permissionCount();
 permissionsCache = [];
 for (let i = 1n; i <= count; i++) {
   const p = await roContract.permissions(i);
   if (p.exists) permissionsCache.push({ id: i, name: p.name });
 }
 setEl('permsListCount',  permissionsCache.length);
 setEl('permsCountBadge', permissionsCache.length);
 setEl('totalPermissions', permissionsCache.length);
} catch (err) { console.error('loadPermissions:', err); }
}

/** Load and display the superAdmin address */
async function loadSuperAdmin() {
if (!roContract) return;
try {
 const admin = await roContract.superAdmin();
 const el = document.getElementById('superAdminShort');
 if (el) { el.textContent = shortAddr(admin); el.title = admin; }
} catch (err) { console.error('loadSuperAdmin:', err); }
}

/** Refresh dashboard data (button handler on dashboard page) */
async function refreshDashboard() {
if (!roContract) { showToast('warning', 'Not Connected', 'Please connect your wallet first.'); return; }
const icon = document.getElementById('refreshIcon');
if (icon) icon.classList.add('spin');
try {
 await Promise.all([loadRoles(), loadPermissions(), loadSuperAdmin()]);
 renderDashboard();
 showToast('success', 'Refreshed', 'Dashboard data updated from blockchain.');
} catch (err) { showToast('error', 'Refresh Failed', err.message); }
finally { setTimeout(() => icon && icon.classList.remove('spin'), 800); }
}

// ─────────────────────────────────────────────────────────────
// RENDER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Render dashboard stat cards and quick lists */
function renderDashboard() {
setEl('totalRoles',       rolesCache.length);
setEl('totalPermissions', permissionsCache.length);
setEl('totalStaff',       getStaffCount());

// Quick roles list
const rl = document.getElementById('dashRolesList');
if (rl) {
 rl.innerHTML = rolesCache.length === 0
   ? `<li class="empty-state"><i class="fa-solid fa-circle-info"></i> No roles yet</li>`
   : rolesCache.map(r => `<li><span class="item-num">${r.id}</span><i class="${roleIcon(r.name)}" style="color:var(--primary);font-size:.75rem"></i>${escHtml(r.name)}</li>`).join('');
}
// Quick permissions list
const pl = document.getElementById('dashPermsList');
if (pl) {
 pl.innerHTML = permissionsCache.length === 0
   ? `<li class="empty-state"><i class="fa-solid fa-circle-info"></i> No permissions yet</li>`
   : permissionsCache.map(p => `<li class="perm-item"><span class="item-num">${p.id}</span><i class="${permIcon(p.name)}" style="color:var(--success);font-size:.75rem"></i>${escHtml(p.name)}</li>`).join('');
}
}

/** Render roles data table */
function renderRolesTable() {
const tbody = document.getElementById('rolesTableBody');
if (!tbody) return;
if (rolesCache.length === 0) {
 tbody.innerHTML = `<tr><td colspan="3" class="table-empty"><i class="fa-solid fa-circle-info"></i> No roles created yet.</td></tr>`;
} else {
 tbody.innerHTML = rolesCache.map((r, i) => `
   <tr class="${i === rolesCache.length - 1 ? 'new-row' : ''}">
     <td><code style="font-size:.78rem;color:var(--text-muted)">#${r.id}</code></td>
     <td><div class="role-name-cell"><i class="${roleIcon(r.name)}"></i>${escHtml(r.name)}</div></td>
     <td><span class="status-pill status-active">Active</span></td>
   </tr>`).join('');
}
}

/** Render permissions data table */
function renderPermsTable() {
const tbody = document.getElementById('permsTableBody');
if (!tbody) return;
if (permissionsCache.length === 0) {
 tbody.innerHTML = `<tr><td colspan="3" class="table-empty"><i class="fa-solid fa-circle-info"></i> No permissions created yet.</td></tr>`;
} else {
 tbody.innerHTML = permissionsCache.map((p, i) => `
   <tr class="${i === permissionsCache.length - 1 ? 'new-row' : ''}">
     <td><code style="font-size:.78rem;color:var(--text-muted)">#${p.id}</code></td>
     <td><div class="perm-name-cell"><i class="${permIcon(p.name)}"></i>${escHtml(p.name)}</div></td>
     <td><span class="status-pill status-active">Active</span></td>
   </tr>`).join('');
}
}

// ─────────────────────────────────────────────────────────────
// POPULATE DROPDOWNS
// ─────────────────────────────────────────────────────────────

/** Fill all role <select> elements with current rolesCache */
function populateRoleDropdowns() {
['policyRoleSelect', 'staffRoleSelect'].forEach(id => {
 const sel = document.getElementById(id);
 if (!sel) return;
 const val = sel.value;
 sel.innerHTML = `<option value="">— Select a Role —</option>` +
   rolesCache.map(r => `<option value="${r.id}">${escHtml(r.name)}</option>`).join('');
 if (val) sel.value = val;
});
}

/** Fill all permission <select> elements with current permissionsCache */
function populatePermDropdowns() {
['policyPermSelect', 'checkPermSelect'].forEach(id => {
 const sel = document.getElementById(id);
 if (!sel) return;
 const val = sel.value;
 sel.innerHTML = `<option value="">— Select a Permission —</option>` +
   permissionsCache.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
 if (val) sel.value = val;
});
}

// ─────────────────────────────────────────────────────────────
// ROLE MANAGEMENT  (roles.html)
// ─────────────────────────────────────────────────────────────

async function createRole() {
if (!contract) return requireWallet();
const name = document.getElementById('roleNameInput').value.trim();
if (!name) { showToast('warning', 'Input Required', 'Please enter a role name.'); return; }
try {
 setBtnLoading('createRoleBtn', true);
 showToast('info', 'Transaction Pending', `Creating role "${name}"...`);
 const tx = await contract.createRole(name);
 showToast('info', 'Awaiting Confirmation', `Tx: ${shortAddr(tx.hash)}`);
 await tx.wait();
 document.getElementById('roleNameInput').value = '';
 await loadRoles();
 renderRolesTable();
 populateRoleDropdowns();
 showToast('success', 'Role Created', `"${name}" added to the blockchain.`);
 addLog('role', `Role Created: <strong>${escHtml(name)}</strong>`);
} catch (err) {
 console.error('createRole:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('createRoleBtn', false); }
}

// ─────────────────────────────────────────────────────────────
// PERMISSION MANAGEMENT  (permissions.html)
// ─────────────────────────────────────────────────────────────

async function createPermission() {
if (!contract) return requireWallet();
const name = document.getElementById('permNameInput').value.trim();
if (!name) { showToast('warning', 'Input Required', 'Please enter a permission name.'); return; }
try {
 setBtnLoading('createPermBtn', true);
 showToast('info', 'Transaction Pending', `Creating permission "${name}"...`);
 const tx = await contract.createPermission(name);
 showToast('info', 'Awaiting Confirmation', `Tx: ${shortAddr(tx.hash)}`);
 await tx.wait();
 document.getElementById('permNameInput').value = '';
 await loadPermissions();
 renderPermsTable();
 showToast('success', 'Permission Created', `"${name}" added to the blockchain.`);
 addLog('permission', `Permission Created: <strong>${escHtml(name)}</strong>`);
} catch (err) {
 console.error('createPermission:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('createPermBtn', false); }
}

// ─────────────────────────────────────────────────────────────
// POLICY MANAGEMENT  (roles.html — sub-section)
// ─────────────────────────────────────────────────────────────

/** Show a live preview of the role→permission policy being built */
function updatePolicyPreview() {
const roleId  = document.getElementById('policyRoleSelect')?.value;
const permId  = document.getElementById('policyPermSelect')?.value;
const preview = document.getElementById('policyPreview');
if (!preview) return;
if (roleId && permId) {
 const role = rolesCache.find(r => r.id.toString() === roleId);
 const perm = permissionsCache.find(p => p.id.toString() === permId);
 if (role && perm) {
   setEl('previewRole', role.name);
   setEl('previewPerm', perm.name);
   preview.style.display = 'block';
 }
} else { preview.style.display = 'none'; }
}

async function assignPermissionToRole() {
if (!contract) return requireWallet();
const roleId = document.getElementById('policyRoleSelect').value;
const permId = document.getElementById('policyPermSelect').value;
if (!roleId || !permId) { showToast('warning', 'Selection Required', 'Please select both a role and a permission.'); return; }
const roleName = rolesCache.find(r => r.id.toString() === roleId)?.name || roleId;
const permName = permissionsCache.find(p => p.id.toString() === permId)?.name || permId;
try {
 setBtnLoading('assignPermBtn', true);
 showToast('info', 'Transaction Pending', `Assigning "${permName}" → "${roleName}"...`);
 const tx = await contract.assignPermissionToRole(BigInt(roleId), BigInt(permId));
 showToast('info', 'Awaiting Confirmation', `Tx: ${shortAddr(tx.hash)}`);
 await tx.wait();
 document.getElementById('policyRoleSelect').value = '';
 document.getElementById('policyPermSelect').value = '';
 const preview = document.getElementById('policyPreview');
 if (preview) preview.style.display = 'none';
 showToast('success', 'Policy Assigned', `"${permName}" assigned to "${roleName}".`);
 addLog('permission', `Policy: <strong>${escHtml(permName)}</strong> → <strong>${escHtml(roleName)}</strong>`);
} catch (err) {
 console.error('assignPermissionToRole:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('assignPermBtn', false); }
}

// ─────────────────────────────────────────────────────────────
// STAFF MANAGEMENT  (staff.html)
// ─────────────────────────────────────────────────────────────

async function assignRole() {
if (!contract) return requireWallet();
const addr   = document.getElementById('staffWalletInput').value.trim();
const roleId = document.getElementById('staffRoleSelect').value;
if (!isValidAddress(addr)) { showToast('warning', 'Invalid Address', 'Please enter a valid wallet address.'); return; }
if (!roleId) { showToast('warning', 'Role Required', 'Please select a role to assign.'); return; }
const roleName = rolesCache.find(r => r.id.toString() === roleId)?.name || roleId;
try {
 setBtnLoading('assignRoleBtn', true);
 showToast('info', 'Transaction Pending', `Assigning "${roleName}" to ${shortAddr(addr)}...`);
 const tx = await contract.assignRole(addr, BigInt(roleId));
 showToast('info', 'Awaiting Confirmation', `Tx: ${shortAddr(tx.hash)}`);
 await tx.wait();
 incStaffCount();
 document.getElementById('staffWalletInput').value = '';
 document.getElementById('staffRoleSelect').value  = '';
 showToast('success', 'Role Assigned', `"${roleName}" assigned to ${shortAddr(addr)}.`);
 addLog('staff', `Role Assigned: <strong>${escHtml(roleName)}</strong> → ${shortAddr(addr)}`, addr);
} catch (err) {
 console.error('assignRole:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('assignRoleBtn', false); }
}

async function suspendUser() {
if (!contract) return requireWallet();
const addr = document.getElementById('suspendWalletInput').value.trim();
if (!isValidAddress(addr)) { showToast('warning', 'Invalid Address', 'Enter a valid wallet address.'); return; }
try {
 setBtnLoading('suspendBtn', true);
 showToast('info', 'Transaction Pending', `Suspending ${shortAddr(addr)}...`);
 const tx = await contract.suspendUser(addr);
 await tx.wait();
 showToast('warning', 'User Suspended', `${shortAddr(addr)} has been suspended.`);
 addLog('suspend', `Staff Suspended: ${shortAddr(addr)}`, addr);
} catch (err) {
 console.error('suspendUser:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('suspendBtn', false); }
}

async function activateUser() {
if (!contract) return requireWallet();
const addr = document.getElementById('suspendWalletInput').value.trim();
if (!isValidAddress(addr)) { showToast('warning', 'Invalid Address', 'Enter a valid wallet address.'); return; }
try {
 setBtnLoading('activateBtn', true);
 showToast('info', 'Transaction Pending', `Activating ${shortAddr(addr)}...`);
 const tx = await contract.activateUser(addr);
 await tx.wait();
 document.getElementById('suspendWalletInput').value = '';
 showToast('success', 'User Activated', `${shortAddr(addr)} has been re-activated.`);
 addLog('activate', `Staff Activated: ${shortAddr(addr)}`, addr);
} catch (err) {
 console.error('activateUser:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('activateBtn', false); }
}

async function revokeUser() {
if (!contract) return requireWallet();
const addr = document.getElementById('revokeWalletInput').value.trim();
if (!isValidAddress(addr)) { showToast('warning', 'Invalid Address', 'Enter a valid wallet address.'); return; }
if (!confirm(`⚠️ Permanently revoke access for\n${addr}?\n\nThis cannot be undone.`)) return;
try {
 setBtnLoading('revokeBtn', true);
 showToast('info', 'Transaction Pending', `Revoking ${shortAddr(addr)}...`);
 const tx = await contract.revokeUser(addr);
 await tx.wait();
 document.getElementById('revokeWalletInput').value = '';
 showToast('error', 'Access Revoked', `${shortAddr(addr)} permanently revoked.`);
 addLog('revoke', `Staff Revoked: ${shortAddr(addr)}`, addr);
} catch (err) {
 console.error('revokeUser:', err);
 showToast('error', 'Transaction Failed', parseContractError(err));
} finally { setBtnLoading('revokeBtn', false); }
}

// ─────────────────────────────────────────────────────────────
// ACCESS VERIFICATION  (access.html)
// ─────────────────────────────────────────────────────────────

function autofillWallet() {
if (!connectedAccount) { showToast('warning', 'Not Connected', 'Connect your wallet first.'); return; }
const input = document.getElementById('checkWalletInput');
if (input) { input.value = connectedAccount; showToast('success', 'Auto-Filled', 'Connected wallet address filled in.'); }
}

async function checkAccess() {
if (!roContract) return requireWallet();
const addr   = document.getElementById('checkWalletInput').value.trim();
const permId = document.getElementById('checkPermSelect').value;
if (!isValidAddress(addr)) { showToast('warning', 'Invalid Address', 'Enter a valid wallet address.'); return; }
if (!permId) { showToast('warning', 'Permission Required', 'Select a permission to check.'); return; }
const permName = permissionsCache.find(p => p.id.toString() === permId)?.name || permId;

// Hide all result panels
hide('accessResultIdle'); hide('accessResultGranted'); hide('accessResultDenied');

try {
 setBtnLoading('checkAccessBtn', true);
 showToast('info', 'Checking Access', `Querying blockchain for ${shortAddr(addr)}...`);
 const hasAccess = await roContract.checkAccess(addr, BigInt(permId));

 if (hasAccess) {
   setEl('grantedMsg', `${shortAddr(addr)} has "${permName}" permission.`);
   const det = document.getElementById('grantedDetails');
   if (det) det.innerHTML = `Address: ${addr}<br>Permission: ${escHtml(permName)} (ID: ${permId})`;
   show('accessResultGranted', 'flex');
   showToast('success', 'Access Granted', `${shortAddr(addr)} has this permission.`);
   addLog('access-ok', `Access Granted: ${shortAddr(addr)} → <strong>${escHtml(permName)}</strong>`, addr);
 } else {
   setEl('deniedMsg', `${shortAddr(addr)} lacks "${permName}" permission.`);
   const det = document.getElementById('deniedDetails');
   if (det) det.innerHTML = `Address: ${addr}<br>Permission: ${escHtml(permName)} (ID: ${permId})`;
   show('accessResultDenied', 'flex');
   showToast('error', 'Access Denied', `${shortAddr(addr)} does not have this permission.`);
   addLog('access-no', `Access Denied: ${shortAddr(addr)} → <strong>${escHtml(permName)}</strong>`, addr);
 }
} catch (err) {
 console.error('checkAccess:', err);
 show('accessResultIdle', 'flex');
 showToast('error', 'Check Failed', parseContractError(err));
} finally { setBtnLoading('checkAccessBtn', false); }
}

// ─────────────────────────────────────────────────────────────
// BLOCKCHAIN EVENT LISTENERS  (listen on every page)
// ─────────────────────────────────────────────────────────────

function listenToEvents() {
if (!contract) return;

contract.on('RoleCreated',       (roleId, name)           => addLog('role',        `Role Created: <strong>${escHtml(name)}</strong> (ID: ${roleId})`));
contract.on('PermissionCreated', (permissionId, name)     => addLog('permission',  `Permission Created: <strong>${escHtml(name)}</strong> (ID: ${permissionId})`));
contract.on('PermissionAssigned',(roleId, permissionId)   => {
 const rName = rolesCache.find(r => r.id === roleId)?.name        || `Role #${roleId}`;
 const pName = permissionsCache.find(p => p.id === permissionId)?.name || `Perm #${permissionId}`;
 addLog('permission', `Policy: <strong>${escHtml(pName)}</strong> → <strong>${escHtml(rName)}</strong>`);
});
contract.on('RoleAssigned',  (user, roleId)  => {
 const rName = rolesCache.find(r => r.id === roleId)?.name || `Role #${roleId}`;
 incStaffCount();
 addLog('staff',    `Role Assigned: <strong>${escHtml(rName)}</strong> → ${shortAddr(user)}`, user);
});
contract.on('UserSuspended', (user)          => addLog('suspend',   `Staff Suspended: ${shortAddr(user)}`, user));
contract.on('UserRevoked',   (user)          => addLog('revoke',    `Staff Revoked: ${shortAddr(user)}`, user));
contract.on('UserActivated', (user)          => addLog('activate',  `Staff Activated: ${shortAddr(user)}`, user));
contract.on('AccessGranted', (user, _, pId)  => {
 const pName = permissionsCache.find(p => p.id === pId)?.name || `Perm #${pId}`;
 addLog('access-ok', `Access Granted: ${shortAddr(user)} → <strong>${escHtml(pName)}</strong>`, user);
});
contract.on('AccessDenied',  (user, _, pId)  => {
 const pName = permissionsCache.find(p => p.id === pId)?.name || `Perm #${pId}`;
 addLog('access-no', `Access Denied: ${shortAddr(user)} → <strong>${escHtml(pName)}</strong>`, user);
});
}

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOG  (logs.html)
// ─────────────────────────────────────────────────────────────

/**
* Add a log entry. Saves to localStorage so it's visible on logs.html
* even after navigating from another page.
*/
function addLog(type, message, addr = null) {
const entry = { type, message, addr, time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
saveLog(entry);
// If currently on logs page, re-render immediately
if (currentPage() === 'logs') renderLogs();
}

/** Render timeline from localStorage */
function renderLogs() {
const timeline  = document.getElementById('timeline');
const emptyEl   = document.getElementById('logsEmpty');
if (!timeline) return;

const entries = getStoredLogs();

if (entries.length === 0) {
 if (emptyEl) emptyEl.style.display = 'flex';
 timeline.innerHTML = '';
 return;
}
if (emptyEl) emptyEl.style.display = 'none';

timeline.innerHTML = entries.map(e => `
 <div class="timeline-item" data-category="${logCategory(e.type)}">
   <div class="timeline-icon ${logIconClass(e.type)}"><i class="${logIconName(e.type)}"></i></div>
   <div class="timeline-body">
     <div class="timeline-title">${e.message}</div>
     ${e.addr ? `<div class="timeline-detail">${e.addr}</div>` : ''}
   </div>
   <div class="timeline-time">${e.time}<br><span style="font-size:.62rem;opacity:.6">${e.date}</span></div>
 </div>`).join('');

// Re-apply active filter
const active = document.querySelector('.log-filter.active');
if (active) {
 const m = active.getAttribute('onclick')?.match(/'([^']+)'/);
 if (m) applyLogFilter(m[1]);
}
}

function filterLogs(category, btn) {
document.querySelectorAll('.log-filter').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
applyLogFilter(category);
}

function applyLogFilter(category) {
document.querySelectorAll('.timeline-item').forEach(item => {
 item.classList.toggle('hidden', category !== 'all' && item.dataset.category !== category);
});
}

function clearLogs() {
clearStoredLogs();
const tl = document.getElementById('timeline');
if (tl) tl.innerHTML = '';
const em = document.getElementById('logsEmpty');
if (em) em.style.display = 'flex';
showToast('success', 'Logs Cleared', 'All activity log entries have been cleared.');
}

// ─────────────────────────────────────────────────────────────
// LOG HELPERS
// ─────────────────────────────────────────────────────────────
function logCategory(type) {
return { role:'role', permission:'permission', staff:'staff', suspend:'staff', revoke:'staff', activate:'staff', 'access-ok':'access', 'access-no':'access' }[type] || 'all';
}
function logIconClass(type) {
return { role:'log-role', permission:'log-permission', staff:'log-staff', suspend:'log-suspend', revoke:'log-revoke', activate:'log-activate', 'access-ok':'log-access-ok', 'access-no':'log-access-no' }[type] || 'log-role';
}
function logIconName(type) {
return { role:'fa-solid fa-user-tag', permission:'fa-solid fa-key', staff:'fa-solid fa-user-plus', suspend:'fa-solid fa-pause-circle', revoke:'fa-solid fa-user-xmark', activate:'fa-solid fa-play-circle', 'access-ok':'fa-solid fa-circle-check', 'access-no':'fa-solid fa-circle-xmark' }[type] || 'fa-solid fa-circle-dot';
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(type, title, msg) {
const toast = document.getElementById('toast');
if (!toast) return;
toast.className = 'toast';
if (type !== 'info') toast.classList.add(type);
const icons = { info:'fa-solid fa-circle-info', success:'fa-solid fa-circle-check', error:'fa-solid fa-circle-xmark', warning:'fa-solid fa-triangle-exclamation' };
const ti = document.getElementById('toastIcon');
if (ti) ti.innerHTML = `<i class="${icons[type]||icons.info}"></i>`;
setEl('toastTitle', title);
setEl('toastMsg',   msg);
toast.classList.add('show');
if (toastTimer) clearTimeout(toastTimer);
toastTimer = setTimeout(hideToast, 4200);
}
function hideToast() {
const t = document.getElementById('toast');
if (t) t.classList.remove('show');
}

// ─────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────
function requireWallet() { showToast('warning', 'Wallet Required', 'Please connect your MetaMask wallet first.'); }
function fillInput(id, value) { const el = document.getElementById(id); if (el) { el.value = value; el.focus(); } }
function toggleMobileMenu() { document.getElementById('navLinks')?.classList.toggle('mobile-open'); }
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function show(id, display = 'flex') { const el = document.getElementById(id); if (el) el.style.display = display; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function setBtnLoading(btnId, loading) {
const btn = document.getElementById(btnId);
if (!btn) return;
btn.disabled = loading;
const loader = btn.querySelector('.btn-loader');
const icon   = btn.querySelector('i');
if (loader) loader.classList.toggle('show', loading);
if (icon)   icon.style.opacity = loading ? '0.4' : '';
}
function shortAddr(a) { if (!a || a.length < 10) return a; return `${a.slice(0,6)}...${a.slice(-4)}`; }
function isValidAddress(a) { return /^0x[0-9a-fA-F]{40}$/.test(a); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function roleIcon(n) {
n = (n||'').toLowerCase();
if (n.includes('doctor'))       return 'fa-solid fa-user-doctor';
if (n.includes('nurse'))        return 'fa-solid fa-user-nurse';
if (n.includes('pharmacist'))   return 'fa-solid fa-pills';
if (n.includes('lab'))          return 'fa-solid fa-flask';
if (n.includes('admin'))        return 'fa-solid fa-hospital-user';
if (n.includes('receptionist')) return 'fa-solid fa-phone';
return 'fa-solid fa-user-tag';
}
function permIcon(n) {
n = (n||'').toLowerCase();
if (n.includes('view'))    return 'fa-solid fa-eye';
if (n.includes('edit'))    return 'fa-solid fa-pen-to-square';
if (n.includes('upload'))  return 'fa-solid fa-upload';
if (n.includes('lab'))     return 'fa-solid fa-microscope';
if (n.includes('prescri')) return 'fa-solid fa-prescription';
if (n.includes('bill'))    return 'fa-solid fa-file-invoice-dollar';
return 'fa-solid fa-key';
}
function parseContractError(err) {
if (err.reason)  return err.reason;
if (err.message) {
 if (err.message.includes('user rejected'))        return 'Transaction rejected by user.';
 if (err.message.includes('insufficient funds'))   return 'Insufficient MATIC for gas fees.';
 if (err.message.includes('revert'))               return err.message.split('revert')[1]?.trim() || err.message;
 return err.message.slice(0, 120);
}
return 'Unknown error. Check console for details.';
}

// ─────────────────────────────────────────────────────────────
// NAVBAR: SCROLL EFFECT + ACTIVE LINK BY PAGE
// ─────────────────────────────────────────────────────────────

window.addEventListener('scroll', () => {
document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/** Highlight the active nav link using the current page filename */
function setActiveNavLink() {
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
 const href = link.getAttribute('href') || '';
 link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
});
}

// Close mobile nav when any link is clicked
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
document.getElementById('navLinks')?.classList.remove('mobile-open');
}));

// ─────────────────────────────────────────────────────────────
// INIT  — runs on every page load
// ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
// 1. Highlight correct nav link
setActiveNavLink();

// 2. Logs page: always render from localStorage immediately (no wallet needed)
if (currentPage() === 'logs') renderLogs();

// 3. Try silent auto-reconnect (no MetaMask popup)
if (!window.ethereum) return;
try {
 const accounts = await window.ethereum.request({ method: 'eth_accounts' });
 if (accounts.length === 0) return;

 provider = new ethers.BrowserProvider(window.ethereum);
 signer   = await provider.getSigner();
 connectedAccount = await signer.getAddress();

 const network = await provider.getNetwork();
 if (Number(network.chainId) !== POLYGON_AMOY_CHAIN_ID) return; // wrong network, don't proceed silently

 contract   = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
 roContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

 updateWalletUI(connectedAccount);
 await loadPageData();
 listenToEvents();
 showToast('success', 'Auto-Connected', `Reconnected: ${shortAddr(connectedAccount)}`);
} catch (err) {
 console.log('Auto-connect skipped:', err.message);
}
});