// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RBAC {

    address public superAdmin;

    constructor() {
        superAdmin = msg.sender;
    }

    enum UserStatus {
        Active,
        Suspended,
        Revoked
    }

    struct Role {
        string name;
        bool   exists;
        bool   isActive;
    }

    struct Permission {
        string name;
        bool   exists;
        bool   isActive;
    }

    struct User {
        uint256    roleId;
        UserStatus status;
    }

    mapping(uint256 => Role)                         public roles;
    mapping(uint256 => Permission)                   public permissions;
    mapping(uint256 => mapping(uint256 => bool))     public rolePermissions;
    mapping(address => User)                         public users;

    uint256 public roleCount;
    uint256 public permissionCount;

    event RoleCreated(uint256 roleId, string name);
    event PermissionCreated(uint256 permissionId, string name);
    event PermissionAssigned(uint256 roleId, uint256 permissionId);
    event RoleAssigned(address user, uint256 roleId);
    event UserSuspended(address user);
    event UserActivated(address user);
    event UserRevoked(address user);
    event AccessGranted(address user, uint256 roleId, uint256 permissionId);
    event AccessDenied(address user, uint256 roleId, uint256 permissionId);

    event RoleDeactivated(uint256 roleId, string name);
    event RoleReactivated(uint256 roleId, string name);
    event PermissionDeactivated(uint256 permissionId, string name);
    event PermissionReactivated(uint256 permissionId, string name);

    modifier onlyAdmin() {
        require(msg.sender == superAdmin, "Not admin");
        _;
    }

    modifier roleExists(uint256 roleId) {
        require(roles[roleId].exists, "Role does not exist");
        _;
    }

    modifier permissionExists(uint256 permId) {
        require(permissions[permId].exists, "Permission does not exist");
        _;
    }

    modifier roleIsActive(uint256 roleId) {
        require(roles[roleId].isActive, "Role is deactivated");
        _;
    }

    modifier permissionIsActive(uint256 permId) {
        require(permissions[permId].isActive, "Permission is deactivated");
        _;
    }

    function createRole(string memory name) public onlyAdmin {
        roleCount++;
        roles[roleCount] = Role({
            name:     name,
            exists:   true,
            isActive: true
        });
        emit RoleCreated(roleCount, name);
    }

    function deactivateRole(uint256 roleId)
        public
        onlyAdmin
        roleExists(roleId)
    {
        require(roles[roleId].isActive, "Role is already deactivated");
        roles[roleId].isActive = false;
        emit RoleDeactivated(roleId, roles[roleId].name);
    }

    function reactivateRole(uint256 roleId)
        public
        onlyAdmin
        roleExists(roleId)
    {
        require(!roles[roleId].isActive, "Role is already active");
        roles[roleId].isActive = true;
        emit RoleReactivated(roleId, roles[roleId].name);
    }

    function createPermission(string memory name) public onlyAdmin {
        permissionCount++;
        permissions[permissionCount] = Permission({
            name:     name,
            exists:   true,
            isActive: true
        });
        emit PermissionCreated(permissionCount, name);
    }

    function deactivatePermission(uint256 permId)
        public
        onlyAdmin
        permissionExists(permId)
    {
        require(permissions[permId].isActive, "Permission is already deactivated");
        permissions[permId].isActive = false;
        emit PermissionDeactivated(permId, permissions[permId].name);
    }

    function reactivatePermission(uint256 permId)
        public
        onlyAdmin
        permissionExists(permId)
    {
        require(!permissions[permId].isActive, "Permission is already active");
        permissions[permId].isActive = true;
        emit PermissionReactivated(permId, permissions[permId].name);
    }

    function assignPermissionToRole(
        uint256 roleId,
        uint256 permissionId
    )
        public
        onlyAdmin
        roleExists(roleId)
        permissionExists(permissionId)
    {
        rolePermissions[roleId][permissionId] = true;
        emit PermissionAssigned(roleId, permissionId);
    }

    function assignMultiplePermissionsToRole(
        uint256 roleId,
        uint256[] calldata permissionIds
    )
        public
        onlyAdmin
        roleExists(roleId)
    {
        require(permissionIds.length > 0,   "No permissions provided");
        require(permissionIds.length <= 50, "Max 50 permissions per batch");

        for (uint256 i = 0; i < permissionIds.length; i++) {
            uint256 permId = permissionIds[i];
            require(permissions[permId].exists, "Permission does not exist");
            rolePermissions[roleId][permId] = true;
            emit PermissionAssigned(roleId, permId);
        }
    }

    function assignRole(address user, uint256 roleId)
        public
        onlyAdmin
        roleExists(roleId)
        roleIsActive(roleId)
    {
        users[user] = User({
            roleId: roleId,
            status: UserStatus.Active
        });
        emit RoleAssigned(user, roleId);
    }

    function suspendUser(address user) public onlyAdmin {
        require(users[user].roleId != 0, "User not registered");
        users[user].status = UserStatus.Suspended;
        emit UserSuspended(user);
    }

    function activateUser(address user) public onlyAdmin {
        require(users[user].roleId != 0, "User not registered");
        users[user].status = UserStatus.Active;
        emit UserActivated(user);
    }

    function revokeUser(address user) public onlyAdmin {
        require(users[user].roleId != 0, "User not registered");
        users[user].status = UserStatus.Revoked;
        emit UserRevoked(user);
    }

    function checkAccess(
        address user,
        uint256 permissionId
    )
        public
        view
        permissionExists(permissionId)
        returns (bool)
    {
        User memory u = users[user];

        if (u.status != UserStatus.Active) {
            return false;
        }

        if (!roles[u.roleId].isActive) {
            return false;
        }

        if (!permissions[permissionId].isActive) {
            return false;
        }

        return rolePermissions[u.roleId][permissionId];
    }
}