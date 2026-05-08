import { test, expect } from '@playwright/test';
import { createTestUser } from '../../utils/testData.js';
import {
  goToSignupLoginPage,
  createAccountAndContinueViaUI,
} from '../../utils/signupHelper.js';

async function fillLoginForm(page, email, password) {
  const loginForm = page.locator('.login-form');

  await loginForm.getByPlaceholder('Email Address').fill(email);
  await loginForm.getByPlaceholder('Password').fill(password);
  await loginForm.getByRole('button', { name: 'Login' }).click();
}

async function prepareLoggedOutUser(page) {
  const user = createTestUser();

  await createAccountAndContinueViaUI(page, user);
  await page.getByRole('link', { name: 'Logout' }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Login to your account')).toBeVisible();

  return user;
}

test.describe('로그인/인증 UI - Login 플로우', () => {
  test('UI-LG-001 Login to your account 섹션 및 입력 폼 노출 확인', async ({ page }) => {
    await test.step('Signup / Login 페이지 진입', async () => {
      await goToSignupLoginPage(page);
    });

    await test.step('Login to your account 영역 확인', async () => {
      await expect(page.getByText('Login to your account')).toBeVisible();
    });

    await test.step('로그인 입력창 및 Login 버튼 확인', async () => {
      const loginForm = page.locator('.login-form');

      await expect(loginForm.getByPlaceholder('Email Address')).toBeVisible();
      await expect(loginForm.getByPlaceholder('Password')).toBeVisible();
      await expect(loginForm.getByRole('button', { name: 'Login' })).toBeVisible();
    });
  });

  test('UI-LG-002 올바른 자격증명으로 로그인 성공 확인', async ({ page }) => {
    const user = await prepareLoggedOutUser(page);

    await test.step('정상 이메일/비밀번호로 로그인 시도', async () => {
      await fillLoginForm(page, user.email, user.password);
    });

    await test.step('로그인 성공 상태 확인', async () => {
      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    });
  });

  test('UI-LG-003 잘못된 비밀번호 입력 시 에러 메시지 확인', async ({ page }) => {
    const user = await prepareLoggedOutUser(page);

    await test.step('정상 이메일 + 잘못된 비밀번호로 로그인 시도', async () => {
      await fillLoginForm(page, user.email, 'WrongPass!9');
    });

    await test.step('로그인 실패 에러 메시지 확인', async () => {
      await expect(page.getByText('Your email or password is incorrect!')).toBeVisible();
      await expect(page.getByText('Login to your account')).toBeVisible();
    });
  });

  test('UI-LG-004 미등록 이메일 입력 시 에러 메시지 확인', async ({ page }) => {
    const user = createTestUser();
    const invalidEmail = `notexist_${Date.now()}@mail.com`;

    await test.step('Signup / Login 페이지 진입', async () => {
      await goToSignupLoginPage(page);
    });

    await test.step('미등록 이메일 + 임의 비밀번호로 로그인 시도', async () => {
      await fillLoginForm(page, invalidEmail, user.password);
    });

    await test.step('로그인 실패 에러 메시지 확인', async () => {
      await expect(page.getByText('Your email or password is incorrect!')).toBeVisible();
      await expect(page.getByText('Login to your account')).toBeVisible();
    });
  });

  test('UI-LG-005 로그인 상태에서 로그아웃 후 로그인 페이지 복귀 확인', async ({ page }) => {
    const user = await prepareLoggedOutUser(page);

    await test.step('정상 로그인', async () => {
      await fillLoginForm(page, user.email, user.password);
      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
    });

    await test.step('Logout 클릭', async () => {
      await page.getByRole('link', { name: 'Logout' }).click();
    });

    await test.step('로그아웃 후 로그인 페이지 복귀 확인', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Login to your account')).toBeVisible();
      await expect(page.getByText(`Logged in as ${user.name}`)).not.toBeVisible();
    });
  });

  test('UI-LG-006 이메일·비밀번호 모두 비워 두고 로그인 시도 시 처리 확인', async ({ page }) => {
    await test.step('Signup / Login 페이지 진입', async () => {
      await goToSignupLoginPage(page);
    });

    await test.step('로그인 Email 필드 required 속성 확인', async () => {
      const loginForm = page.locator('.login-form');
      await expect(loginForm.getByPlaceholder('Email Address')).toHaveAttribute('required', '');
    });

    await test.step('로그인 Password 필드 required 속성 확인', async () => {
      const loginForm = page.locator('.login-form');
      await expect(loginForm.getByPlaceholder('Password')).toHaveAttribute('required', '');
    });

    await test.step('이메일·비밀번호 공백 상태에서 Login 클릭', async () => {
      const loginForm = page.locator('.login-form');
      await loginForm.getByRole('button', { name: 'Login' }).click();
    });

    await test.step('로그인 페이지 유지 확인', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Login to your account')).toBeVisible();
      await expect(page.getByText('Your email or password is incorrect!')).not.toBeVisible();
    });
  });
});