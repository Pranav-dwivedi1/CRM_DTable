const request = require("supertest");
const app = require("../src/app");
const Company = require("../src/models/Company");
const User = require("../src/models/User");
const Lead = require("../src/models/Lead");
const { setupTestDB, generateTestToken } = require("./testHelper");

setupTestDB();

jest.setTimeout(20000);

describe("Analytics and reporting API", () => {
  let company, admin, manager, employee, adminToken;

  beforeEach(async () => {
    company = await Company.create({ name: "Analytics Corp" });

    admin = await User.create({
      companyId: company._id,
      name: "Admin User",
      email: "admin@analytics.com",
      password: "password123",
      role: "masterAdmin",
    });

    manager = await User.create({
      companyId: company._id,
      name: "Manager User",
      email: "manager@analytics.com",
      password: "password123",
      role: "manager",
    });

    employee = await User.create({
      companyId: company._id,
      name: "Employee User",
      email: "employee@analytics.com",
      password: "password123",
      role: "employee",
      managerId: manager._id,
    });

    await Lead.create({
      companyId: company._id,
      name: "Demo Lead",
      source: "Website",
      status: "New",
      assignedTo: employee._id,
      createdBy: admin._id,
      estimatedValue: 1000,
    });

    adminToken = generateTestToken(admin);
  });

  test("master admin can retrieve overview metrics", async () => {
    const res = await request(app)
      .get("/api/dashboard/overview")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalLeads).toBeGreaterThan(0);
    expect(res.body.data.metrics.totalRevenue).toBeGreaterThanOrEqual(0);
  });

  test("manager can retrieve analytics breakdowns", async () => {
    const managerToken = generateTestToken(manager);
    const res = await request(app)
      .get("/api/dashboard/analytics")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.breakdowns.leadsByStatus).toBeDefined();
  });
});
