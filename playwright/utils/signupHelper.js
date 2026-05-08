import { expect } from '@playwright/test';

export async function goToSignupLoginPage(page) {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('New User Signup!')).toBeVisible();
}

export async function fillSignupStartForm(page, user) {
  const signupForm = page.locator('.signup-form');

  await signupForm.getByPlaceholder('Name').fill(user.name);
  await signupForm.getByPlaceholder('Email Address').fill(user.email);
  await signupForm.getByRole('button', { name: 'Signup' }).click();
}

export async function fillAccountInformation(page, user) {
  await expect(page.getByText('Enter Account Information')).toBeVisible();

  await page.locator('#id_gender1').check();
  await page.locator('#password').fill(user.password);

  await page.locator('#days').selectOption(user.birthDay);
  await page.locator('#months').selectOption({ label: user.birthMonth });
  await page.locator('#years').selectOption(user.birthYear);
}

export async function fillAddressInformation(page, user) {
  await page.locator('#first_name').fill(user.firstName);
  await page.locator('#last_name').fill(user.lastName);
  await page.locator('#company').fill(user.company);
  await page.locator('#address1').fill(user.address1);
  await page.locator('#country').selectOption(user.country);
  await page.locator('#state').fill(user.state);
  await page.locator('#city').fill(user.city);
  await page.locator('#zipcode').fill(user.zipcode);
  await page.locator('#mobile_number').fill(user.mobileNumber);
}

export async function createAccountViaUI(page, user) {
  await goToSignupLoginPage(page);
  await fillSignupStartForm(page, user);
  await fillAccountInformation(page, user);
  await fillAddressInformation(page, user);

  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Account Created!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();
}

export async function createAccountAndContinueViaUI(page, user) {
  await createAccountViaUI(page, user);

  await page.getByRole('link', { name: 'Continue' }).click();

  await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
}