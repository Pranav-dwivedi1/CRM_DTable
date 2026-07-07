const request = require('supertest');
const app = require('../src/app');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const { setupTestDB, generateTestToken } = require('./testHelper');

setupTestDB();

describe('Multi-Tenant Data Isolation Tests', () => {
  let companyA, companyB, adminA, adminB, tokenA, tokenB, leadA;

  beforeEach(async () => {
    // Company A setup
    companyA = await Company.create({ name: 'Company Alpha' });
    adminA = await User.create({
      companyId: companyA._id,
      name: 'Alpha Admin',
      email: 'admin@alpha.com',
      password: 'password123',
      role: 'masterAdmin'
    });
    tokenA = generateTestToken(adminA);

    // Company B setup
    companyB = await Company.create({ name: 'Company Beta' });
    adminB = await User.create({
      companyId: companyB._id,
      name: 'Beta Admin',
      email: 'admin@beta.com',
      password: 'password123',
      role: 'masterAdmin'
    });
    tokenB = generateTestToken(adminB);

    // Lead under Company A
    leadA = await Lead.create({
      companyId: companyA._id,
      name: 'Alpha Client Lead',
      source: 'Website',
      status: 'New',
      assignedTo: adminA._id,
      createdBy: adminA._id
    });
  });

  test('User B should not be able to list User A leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // User B's list should be empty since they have no leads, and cannot leak from A
    expect(res.body.data.length).toBe(0);
  });

  test('User B should be blocked from reading User A lead by ID directly (403/404)', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    // Since the companyId scoping plugin filters the queries, Lead.findById(leadA._id)
    // executes with filter { _id: leadA._id, companyId: companyB._id } which returns null (not found).
    // The controller then returns 404. This is the desired secure behavior!
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
