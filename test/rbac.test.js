const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RBAC Smart Contract", function () {

  let RBAC;
  let rbac;
  let admin;
  let user1;
  let user2;

  beforeEach(async function () {

    [admin, user1, user2] = await ethers.getSigners();

    RBAC = await ethers.getContractFactory("RBAC");

    rbac = await RBAC.deploy();

    await rbac.waitForDeployment();

  });


  // ---------------------------
  // ROLE CREATION TEST
  // ---------------------------

  it("Admin should create roles", async function () {

    await rbac.createRole("Employee");
    await rbac.createRole("Manager");

    const role1 = await rbac.roles(1);
    const role2 = await rbac.roles(2);

    expect(role1.name).to.equal("Employee");
    expect(role2.name).to.equal("Manager");

  });


  // ---------------------------
  // PERMISSION CREATION TEST
  // ---------------------------

  it("Admin should create permissions", async function () {

    await rbac.createPermission("READ_REPORT");
    await rbac.createPermission("WRITE_REPORT");

    const perm1 = await rbac.permissions(1);
    const perm2 = await rbac.permissions(2);

    expect(perm1.name).to.equal("READ_REPORT");
    expect(perm2.name).to.equal("WRITE_REPORT");

  });


  // ---------------------------
  // ROLE → PERMISSION MAPPING
  // ---------------------------

  it("Admin assigns permission to role", async function () {

    await rbac.createRole("Employee");

    await rbac.createPermission("READ");

    await rbac.assignPermissionToRole(1, 1);

    const allowed = await rbac.rolePermissions(1, 1);

    expect(allowed).to.equal(true);

  });


  // ---------------------------
  // USER ROLE ASSIGNMENT
  // ---------------------------

  it("Admin assigns role to user", async function () {

    await rbac.createRole("Employee");

    await rbac.assignRole(user1.address, 1);

    const user = await rbac.users(user1.address);

    expect(user.roleId).to.equal(1);

  });


  // ---------------------------
  // ACCESS CONTROL TEST
  // ---------------------------

  it("User should be granted access when permission exists", async function () {

    await rbac.createRole("Employee");

    await rbac.createPermission("READ");

    await rbac.assignPermissionToRole(1, 1);

    await rbac.assignRole(user1.address, 1);

    const access = await rbac.checkAccess(user1.address, 1);

    expect(access).to.equal(true);

  });


  // ---------------------------
  // ACCESS DENIED TEST
  // ---------------------------

  it("User should be denied access without permission", async function () {

    await rbac.createRole("Employee");

    await rbac.createPermission("WRITE");

    await rbac.assignRole(user1.address, 1);

    const access = await rbac.checkAccess(user1.address, 1);

    expect(access).to.equal(false);

  });


  // ---------------------------
  // SUSPENSION TEST
  // ---------------------------

  it("Suspended user should not get access", async function () {

    await rbac.createRole("Employee");

    await rbac.createPermission("READ");

    await rbac.assignPermissionToRole(1, 1);

    await rbac.assignRole(user1.address, 1);

    await rbac.suspendUser(user1.address);

    const access = await rbac.checkAccess(user1.address, 1);

    expect(access).to.equal(false);

  });


  // ---------------------------
  // REVOCATION TEST
  // ---------------------------

  it("Revoked user should not get access", async function () {

    await rbac.createRole("Employee");

    await rbac.createPermission("READ");

    await rbac.assignPermissionToRole(1, 1);

    await rbac.assignRole(user1.address, 1);

    await rbac.revokeUser(user1.address);

    const access = await rbac.checkAccess(user1.address, 1);

    expect(access).to.equal(false);

  });

});