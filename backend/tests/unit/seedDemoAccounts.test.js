const User = require('../../src/models/User');
const { seedDemoAccounts, DEMO_ACCOUNTS } = require('../../src/scripts/seedDemoAccounts');

describe('seedDemoAccounts script', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should seed 3 demo accounts on empty database', async () => {
    const results = await seedDemoAccounts();

    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'CREATED')).toBe(true);

    const users = await User.find({}).select('+password');
    expect(users).toHaveLength(3);

    for (const demoDef of DEMO_ACCOUNTS) {
      const dbUser = users.find(u => u.email === demoDef.email);
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe(demoDef.role);
      expect(dbUser.isActive).toBe(true);
      expect(dbUser.isVerified).toBe(true);

      const isPasswordMatch = await dbUser.correctPassword(demoDef.password, dbUser.password);
      expect(isPasswordMatch).toBe(true);
    }
  });

  it('should be idempotent and update existing demo accounts without errors', async () => {
    // First run: creates
    await seedDemoAccounts();

    // Modify one user's name
    await User.updateOne({ email: 'admin@demo.com' }, { $set: { name: 'Old Admin Name' } });

    // Second run: updates
    const results = await seedDemoAccounts();
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'UPDATED')).toBe(true);

    const admin = await User.findOne({ email: 'admin@demo.com' }).select('+password');
    expect(admin.name).toBe('Demo Admin');
    const isPasswordMatch = await admin.correctPassword('Admin@123456', admin.password);
    expect(isPasswordMatch).toBe(true);
  });
});
