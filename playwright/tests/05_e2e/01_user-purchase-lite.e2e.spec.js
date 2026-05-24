import { test, expect } from '@playwright/test';
import { createTestUser } from '../../utils/testData.js';
import { createAccountAndContinueViaUI } from '../../utils/signupHelper.js';
import { closeGoogleVignetteIfVisible } from '../../utils/uiHelper.js';

const SEARCH_KEYWORD = 'top';

const SEL = {
  productsLink: /Products/i,
  cartLink: /Cart/i,
  signupLoginLink: /Signup \/ Login/i,

  searchInput: '#search_product',
  searchButton: '#submit_search',

  productCards: '.features_items .product-image-wrapper',
  cartRows: '#cart_info_table tbody tr',

  addToCartButton: 'a.add-to-cart',
  cartQuantityButton: '.cart_quantity button',
  cartDescription: '.cart_description',
};

async function deleteAccountByApi(request, user) {
  if (!user?.email || !user?.password) {
    return {
      skipped: true,
      reason: 'cleanup skipped: user email/password is empty',
    };
  }

  try {
    const response = await request.delete('/api/deleteAccount', {
      form: {
        email: user.email,
        password: user.password,
      },
    });

    return {
      skipped: false,
      ok: response.ok(),
      status: response.status(),
      bodyText: await response.text(),
    };
  } catch (error) {
    return {
      skipped: false,
      ok: false,
      error: String(error),
    };
  }
}

async function goToProductsPage(page) {
  await page.goto('/');

  await page.getByRole('link', { name: SEL.productsLink }).click();
  await closeGoogleVignetteIfVisible(page);

  // Google Vignette 등 외부 레이어로 인해 /products 이동이 막힌 경우 재시도
  if (!/\/products/.test(page.url())) {
    try {
      await page.getByRole('link', { name: SEL.productsLink }).click({ timeout: 3000 });
      await closeGoogleVignetteIfVisible(page);
    } catch {
      // 재클릭 실패 시 직접 이동 fallback 사용
    }
  }

  if (!/\/products/.test(page.url())) {
    await page.goto('/products');
    await closeGoogleVignetteIfVisible(page);
  }

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByText('All Products')).toBeVisible();
}

function productCards(page) {
  return page.locator(SEL.productCards);
}

function cartRows(page) {
  return page.locator(SEL.cartRows);
}

async function searchProduct(page, keyword) {
  await page.locator(SEL.searchInput).fill(keyword);
  await page.locator(SEL.searchButton).click();

  await closeGoogleVignetteIfVisible(page);

  await expect(page.getByText('Searched Products')).toBeVisible();
  await expect(productCards(page).first()).toBeVisible();
}

async function getFirstProductName(page) {
  return (await productCards(page).first().locator('.productinfo p').innerText()).trim();
}

async function addFirstSearchResultToCartAndViewCart(page) {
  const productName = await getFirstProductName(page);

  await productCards(page).first().locator(SEL.addToCartButton).first().click();

  await expect(page.getByText('Added!')).toBeVisible();
  await expect(page.getByText('Your product has been added to cart.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Cart' })).toBeVisible();

  await page.getByRole('link', { name: 'View Cart' }).click();

  await expect(page).toHaveURL(/\/view_cart/);
  await expect(cartRows(page).first()).toBeVisible();

  return productName;
}

test.describe('E2E - User Purchase Lite', () => {
  let user;
  let accountDeletedByUi = false;

  test.afterEach(async ({ request }, testInfo) => {
    // UI에서 계정 삭제까지 완료된 경우 API cleanup 불필요
    if (!user || accountDeletedByUi) {
      return;
    }

    const cleanupResult = await deleteAccountByApi(request, user);

    if (cleanupResult.skipped) {
      testInfo.annotations.push({
        type: 'cleanup',
        description: cleanupResult.reason,
      });
      return;
    }

    // cleanup 실패가 본 테스트 실패 원인을 덮지 않도록 annotation으로만 남김
    if (!cleanupResult.ok) {
      testInfo.annotations.push({
        type: 'cleanup-warning',
        description: `API cleanup failed: ${JSON.stringify(cleanupResult)}`,
      });
    }
  });

  test('UI-E2E-001 사용자 핵심 흐름 검증 - 회원가입부터 계정 삭제까지', async ({ page }) => {
    user = createTestUser();

    let productName;

    await test.step('1. 신규 사용자 회원가입 및 로그인 상태 확인', async () => {
      await createAccountAndContinueViaUI(page, user);

      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Delete Account' })).toBeVisible();
    });

    await test.step('2. Products 페이지 진입 후 상품 검색', async () => {
      await goToProductsPage(page);
      await searchProduct(page, SEARCH_KEYWORD);
    });

    await test.step('3. 검색 결과 첫 번째 상품 장바구니 추가 후 View Cart 이동', async () => {
      productName = await addFirstSearchResultToCartAndViewCart(page);
    });

    await test.step('4. Cart row 상품명 및 수량 반영 확인', async () => {
      const row = cartRows(page).filter({ hasText: productName });

      await expect(row).toBeVisible();
      await expect(row.locator(SEL.cartDescription)).toContainText(productName);
      await expect(row.locator(SEL.cartQuantityButton)).toHaveText('1');
    });

    await test.step('5. 계정 삭제', async () => {
      await page.getByRole('link', { name: 'Delete Account' }).click();

      await expect(page).toHaveURL(/\/delete_account/);
      await expect(page.getByText('Account Deleted!')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();

      accountDeletedByUi = true;
    });

    await test.step('6. 삭제 후 비로그인 상태 복귀 확인', async () => {
      await page.getByRole('link', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: SEL.signupLoginLink })).toBeVisible();
      await expect(page.getByText(`Logged in as ${user.name}`)).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Delete Account' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).not.toBeVisible();
    });
  });
});