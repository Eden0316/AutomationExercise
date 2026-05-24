import { test, expect } from '@playwright/test';
import { createTestUser } from '../../utils/testData.js';
import {
  goToSignupLoginPage,
  fillSignupStartForm,
  createAccountViaUI,
  createAccountAndContinueViaUI,
} from '../../utils/signupHelper.js';

test.describe('회원가입 UI - Signup 플로우', () => {
  test('UI-SU-001 Signup / Login 페이지 진입 확인', async ({ page }) => {
    await test.step('홈페이지 접속', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Automation Exercise/i);
    });

    await test.step('Signup / Login 메뉴 클릭', async () => {
      await page.getByRole('link', { name: /Signup \/ Login/i }).click();
      await expect(page).toHaveURL(/\/login/);
    });

    await test.step('Login / Signup 섹션 노출 확인', async () => {
      await expect(page.getByText('Login to your accounts')).toBeVisible();
      await expect(page.getByText('New User Signup!')).toBeVisible();
    });
  });

  test('UI-SU-002 New User Signup 영역 및 입력창 노출 확인', async ({ page }) => {
    await test.step('Signup / Login 페이지 진입', async () => {
      await goToSignupLoginPage(page);
    });

    await test.step('New User Signup 영역 확인', async () => {
      await expect(page.getByText('New User Signup!')).toBeVisible();
    });

    await test.step('회원가입 입력창 및 Signup 버튼 확인', async () => {
      const signupForm = page.locator('.signup-form');

      await expect(signupForm.getByPlaceholder('Name')).toBeVisible();
      await expect(signupForm.getByPlaceholder('Email Address')).toBeVisible();
      await expect(signupForm.getByRole('button', { name: 'Signup' })).toBeVisible();
    });
  });

  test('UI-SU-003 신규 회원가입 전체 플로우 성공', async ({ page }) => {
    const user = createTestUser();

    await test.step('신규 계정 생성 완료 화면까지 진행', async () => {
      await createAccountViaUI(page, user);
    });

    await test.step('계정 생성 완료 메시지 및 Continue 버튼 확인', async () => {
      await expect(page.getByText('Account Created!')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();
    });
  });

  test('UI-SU-004 회원가입 완료 후 Continue 클릭 시 로그인 상태 유지 확인', async ({ page }) => {
    const user = createTestUser();

    await test.step('신규 계정 생성 후 Continue 클릭', async () => {
      await createAccountAndContinueViaUI(page, user);
    });

    await test.step('로그인 상태 유지 확인', async () => {
      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    });
  });

  test('UI-SU-005 기존 이메일로 회원가입 시도 시 중복 에러 메시지 확인', async ({ page }) => {
    const user = createTestUser();

    await test.step('사전 조건: 신규 계정 생성', async () => {
      await createAccountAndContinueViaUI(page, user);
    });

    await test.step('로그아웃 후 Signup / Login 페이지 재진입', async () => {
      await page.getByRole('link', { name: 'Logout' }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('New User Signup!')).toBeVisible();
    });

    await test.step('동일 이메일로 회원가입 재시도', async () => {
      await fillSignupStartForm(page, user);
    });

    await test.step('중복 이메일 에러 메시지 확인', async () => {
      await expect(page.getByText('Email Address already exist!')).toBeVisible();
    });
  });

  test('UI-SU-006 Name 미입력 상태에서 Signup 버튼 클릭 시 진행 차단 확인', async ({ page }) => {
    const user = createTestUser();

    await test.step('Signup / Login 페이지 진입', async () => {
      await goToSignupLoginPage(page);
    });

    await test.step('Name 필드 required 속성 확인', async () => {
      const signupForm = page.locator('.signup-form');
      const nameInput = signupForm.getByPlaceholder('Name');

      await expect(nameInput).toHaveAttribute('required', '');
    });

    await test.step('Name 미입력 상태에서 Email만 입력 후 Signup 클릭', async () => {
      const signupForm = page.locator('.signup-form');

      await signupForm.getByPlaceholder('Email Address').fill(user.email);
      await signupForm.getByRole('button', { name: 'Signup' }).click();
    });

    await test.step('회원가입 상세 입력 페이지로 이동하지 않았는지 확인', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Enter Account Information')).not.toBeVisible();
      await expect(page.getByText('New User Signup!')).toBeVisible();
    });
  });
});