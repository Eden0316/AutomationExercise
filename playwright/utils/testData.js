export function createTestUser() {
  const timestamp = Date.now();

  return {
    name: 'TestUser',
    email: `test_${timestamp}@mail.com`,
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
    company: 'QA Corp',
    address1: '123 Main St',
    country: 'India',
    state: 'Delhi',
    city: 'Delhi',
    zipcode: '110001',
    mobileNumber: '9000000001',
    birthDay: '1',
    birthMonth: 'January',
    birthYear: '2000',
  };
}