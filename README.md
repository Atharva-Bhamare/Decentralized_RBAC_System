# Decentralized Role-Based Access Control (RBAC) System for Hospitals

## Overview

This project implements a Decentralized Role-Based Access Control (RBAC) system for hospitals using Blockchain (Layer-2) technology. It ensures secure, transparent, and tamper-proof access management for sensitive hospital data such as patient records, prescriptions, and lab reports.

Unlike traditional centralized systems, this solution leverages smart contracts to enforce access control policies and maintain immutable audit logs, ensuring trust and accountability.

---

## Problem Statement

Traditional hospital systems rely on centralized access control mechanisms that:

* Are vulnerable to unauthorized access and insider threats
* Lack transparency and auditability
* Do not guarantee data integrity

This creates significant risks when handling sensitive healthcare data.

---

## Solution

This project introduces a blockchain-based RBAC system where:

* Roles and permissions are managed on-chain
* Access decisions are verified via smart contracts
* All activities are recorded as immutable blockchain events

---

## Core Features

* Role-Based Access Control (RBAC)
* Role management (Doctor, Nurse, Pharmacist, etc.)
* Permission management (View Records, Edit Records, etc.)
* Role to Permission mapping
* User to Role assignment
* User suspension and revocation
* Access verification using smart contract logic
* Blockchain-based audit logs
* Web3 wallet authentication (MetaMask)
* Frontend dashboard interface

---

## System Architecture

```text
Frontend (HTML/CSS/JS + ethers.js)
        ↓
MetaMask Wallet (Authentication)
        ↓
RBAC Smart Contract (Solidity)
        ↓
Polygon Amoy (Layer-2 Blockchain)
```

---

## Tech Stack

| Layer           | Technology             |
| --------------- | ---------------------- |
| Blockchain      | Solidity               |
| Framework       | Hardhat                |
| Network         | Polygon Amoy (Layer-2) |
| Frontend        | HTML, CSS, JavaScript  |
| Web3 Library    | ethers.js              |
| Wallet          | MetaMask               |
| Testing         | Mocha + Chai           |
| Version Control | Git + GitHub           |

---

## Smart Contract Functionality

### Role and Permission Management

* `createRole()`
* `createPermission()`
* `assignPermissionToRole()`

### User Management

* `assignRole()`
* `suspendUser()`
* `revokeUser()`

### Access Control

* `checkAccess()`

---

## Workflow

1. Admin creates roles (Doctor, Nurse, etc.)
2. Admin defines permissions
3. Permissions are assigned to roles
4. Users are assigned roles
5. User requests access
6. Smart contract verifies access
7. Access is granted or denied

---

## Testing

Smart contract testing was performed using Hardhat with Mocha and Chai.

Test cases include:

* Role creation
* Permission creation
* Role-permission mapping
* User-role assignment
* Access control validation
* Suspension and revocation scenarios

Run tests using:

```bash
npx hardhat test
```

---

## Deployment

The smart contract is deployed on the Polygon Amoy testnet.

Deployment command:

```bash
npx hardhat run scripts/deploy.js --network amoy
```

---

## Authentication

Authentication is handled using MetaMask wallet integration:

* Wallet address acts as user identity
* Transactions are signed securely
* No traditional username/password required

---

## Audit Logging

All actions are recorded as blockchain events:

* RoleCreated
* PermissionCreated
* RoleAssigned
* AccessGranted
* AccessDenied
* UserSuspended
* UserRevoked

This ensures full transparency and traceability.

---

## Advantages

* Decentralized and secure access control
* Immutable audit logs
* Transparent and tamper-proof system
* Scalable using Layer-2 blockchain
* Eliminates single point of failure

---

## Future Scope

* Zero-Knowledge Proof based authentication
* Multi-role support for users
* Time-based access control
* Integration with hospital databases
* IPFS-based storage for medical records
* Mobile application support

---

## Demo Flow

1. Connect wallet via MetaMask
2. Admin creates roles and permissions
3. Assign permissions to roles
4. Assign roles to users
5. User checks access
6. System returns access decision

---

## License

This project is for academic and research purposes.
