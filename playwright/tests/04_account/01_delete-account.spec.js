import { test, expect } from '@playwright/test';
import { createTestUser } from '../../utils/testData.js';
import { createAccountAndContinueViaUI } from '../../utils/signupHelper.js';

async function prepareLoggedInUser(page) {
  const user = createTestUser();

  await createAccountAndContinueViaUI(page, user);

  await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Delete Account' })).toBeVisible();

  return user;
}

async function deleteCurrentAccount(page) {
  await page.getByRole('link', { name: 'Delete Account' }).click();

  await expect(page).toHaveURL(/\/delete_account/);
  await expect(page.getByText('Account Deleted!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();
}

test.describe('계정 삭제 UI - Delete Account 플로우', () => {
  test('UI-DA-001 로그인 상태에서 Delete Account 메뉴 노출 확인', async ({ page }) => {
    const user = await prepareLoggedInUser(page);

    await test.step('로그인 상태 확인', async () => {
      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    });

    await test.step('Delete Account 메뉴 노출 확인', async () => {
      await expect(page.getByRole('link', { name: 'Delete Account' })).toBeVisible();
    });

    await test.step('테스트 데이터 정리: 생성 계정 삭제', async () => {
      await deleteCurrentAccount(page);
    });
  });

  test('UI-DA-002 로그인 상태에서 계정 삭제 성공 확인', async ({ page }) => {
    await test.step('사전 조건: 신규 계정 생성 및 로그인', async () => {
      await prepareLoggedInUser(page);
    });

    await test.step('Delete Account 클릭 및 삭제 완료 화면 확인', async () => {
      await deleteCurrentAccount(page);
    });

    await test.step('삭제 완료 메시지 확인', async () => {
      await expect(page.getByText('Account Deleted!')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();
    });
  });

  test('UI-DA-003 계정 삭제 후 비로그인 상태 복귀 확인', async ({ page }) => {
    const user = await prepareLoggedInUser(page);

    await test.step('계정 삭제 완료 화면까지 진행', async () => {
      await deleteCurrentAccount(page);
    });

    await test.step('Continue 클릭', async () => {
      await page.getByRole('link', { name: 'Continue' }).click();
    });

    await test.step('비로그인 상태 복귀 확인', async () => {
      await expect(page.getByRole('link', { name: /Signup \/ Login/i })).toBeVisible();
      await expect(page.getByText(`Logged in as ${user.name}`)).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Delete Account' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).not.toBeVisible();
    });
  });
});