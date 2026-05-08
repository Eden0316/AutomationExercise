import { test, expect } from '@playwright/test';
import { createTestUser } from '../../utils/testData.js';
import { createAccountAndContinueViaUI } from '../../utils/signupHelper.js';
import { closeGoogleVignetteIfVisible } from '../../utils/uiHelper.js';

const VALID_SEARCH_KEYWORD = 'top';

async function goToProductsPage(page) {
  await page.goto('/');

  await page.getByRole('link', { name: /Products/i }).click();

  await closeGoogleVignetteIfVisible(page);

  if (!/\/products/.test(page.url())) {
    try {
      await page.getByRole('link', { name: /Products/i }).click({ timeout: 3000 });
      await closeGoogleVignetteIfVisible(page);
    } catch {
      // fallback에서 직접 이동
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
  return page.locator('.features_items .product-image-wrapper');
}

function cartRows(page) {
  return page.locator('#cart_info_table tbody tr');
}

async function getFirstProductName(page) {
  return (await productCards(page).first().locator('.productinfo p').innerText()).trim();
}

async function clickFirstProductAddToCart(page) {
  await productCards(page).first().locator('a.add-to-cart').first().click();
}

async function expectAddToCartModal(page) {
  await expect(page.getByText('Added!')).toBeVisible();
  await expect(page.getByText('Your product has been added to cart.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Cart' })).toBeVisible();
}

async function addFirstProductToCartAndViewCart(page) {
  await goToProductsPage(page);

  const productName = await getFirstProductName(page);

  await clickFirstProductAddToCart(page);
  await expectAddToCartModal(page);

  await page.getByRole('link', { name: 'View Cart' }).click();

  await expect(page).toHaveURL(/\/view_cart/);
  await expect(cartRows(page).first()).toBeVisible();

  return productName;
}

async function addFirstProductToCartAndContinueShopping(page) {
  await goToProductsPage(page);

  const productName = await getFirstProductName(page);

  await clickFirstProductAddToCart(page);
  await expectAddToCartModal(page);

  await page.getByRole('button', { name: 'Continue Shopping' }).click();

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByText('All Products')).toBeVisible();

  return productName;
}

async function removeFirstCartItem(page) {
  await expect(cartRows(page).first()).toBeVisible();

  await cartRows(page).first().locator('.cart_quantity_delete').click();
}

function parsePrice(text) {
  const normalized = text.replace(/[^\d]/g, '');
  return Number(normalized);
}

test.describe('장바구니 UI - Cart 플로우', () => {
  test('UI-CT-001 상품 장바구니 추가 후 Cart 페이지 반영 확인', async ({ page }) => {
    let productName;

    await test.step('Products 페이지에서 첫 번째 상품 Cart 추가 후 View Cart 이동', async () => {
      productName = await addFirstProductToCartAndViewCart(page);
    });

    await test.step('Cart 목록에서 추가한 상품명 및 수량 확인', async () => {
      const row = cartRows(page).filter({ hasText: productName });

      await expect(row).toBeVisible();
      await expect(row.locator('.cart_quantity button')).toHaveText('1');
    });
  });

  test('UI-CT-002 Add to Cart 클릭 시 완료 모달/안내 노출 확인', async ({ page }) => {
    await test.step('Products 페이지 진입', async () => {
      await goToProductsPage(page);
    });

    await test.step('첫 번째 상품 Add to cart 클릭', async () => {
      await clickFirstProductAddToCart(page);
    });

    await test.step('추가 완료 모달 및 버튼 확인', async () => {
      await expectAddToCartModal(page);
    });
  });

  test('UI-CT-003 Cart 페이지에서 상품명·가격·수량 정보 노출 확인', async ({ page }) => {
    let productName;

    await test.step('상품 1개 Cart 추가 후 Cart 페이지 이동', async () => {
      productName = await addFirstProductToCartAndViewCart(page);
    });

    await test.step('Cart row 내 상품명·단가·수량·총액 확인', async () => {
      const row = cartRows(page).filter({ hasText: productName });

      await expect(row.locator('.cart_description')).toContainText(productName);
      await expect(row.locator('.cart_price')).toBeVisible();
      await expect(row.locator('.cart_quantity')).toBeVisible();
      await expect(row.locator('.cart_total')).toBeVisible();

      const priceText = await row.locator('.cart_price').innerText();
      const quantityText = await row.locator('.cart_quantity button').innerText();
      const totalText = await row.locator('.cart_total').innerText();

      const price = parsePrice(priceText);
      const quantity = Number(quantityText.trim());
      const total = parsePrice(totalText);

      expect(quantity).toBe(1);
      expect(total).toBe(price * quantity);
    });
  });

  test('UI-CT-004 Cart에서 상품 제거 후 목록에서 삭제 확인', async ({ page }) => {
    let productName;

    await test.step('삭제 대상 상품 Cart 추가', async () => {
      productName = await addFirstProductToCartAndViewCart(page);
    });

    await test.step('Cart에서 상품 삭제', async () => {
      const row = cartRows(page).filter({ hasText: productName });

      await expect(row).toBeVisible();
      await row.locator('.cart_quantity_delete').click();
    });

    await test.step('삭제 대상 상품 row 미노출 확인', async () => {
      await expect(cartRows(page).filter({ hasText: productName })).toHaveCount(0);
    });
  });

  test('UI-CT-005 마지막 상품 제거 후 빈 Cart 상태 확인', async ({ page }) => {
    await test.step('상품 1개 Cart 추가 후 Cart 페이지 이동', async () => {
      await addFirstProductToCartAndViewCart(page);
    });

    await test.step('마지막 상품 삭제', async () => {
      await removeFirstCartItem(page);
    });

    await test.step('Cart 상품 row 0건 또는 빈 Cart 안내 확인', async () => {
      await expect(cartRows(page)).toHaveCount(0);

      const emptyMessage = page.getByText(/Cart is empty/i);
      const emptyVisible = await emptyMessage.isVisible().catch(() => false);

      // Automation Exercise는 환경에 따라 빈 안내 문구가 없을 수 있으므로 row 0건을 핵심 기준으로 둔다.
      expect(emptyVisible || (await cartRows(page).count()) === 0).toBeTruthy();
    });
  });

  test('UI-CT-006 비로그인 상태에서 추가한 상품이 로그인 후에도 Cart에 유지되는지 확인', async ({ page }) => {
    const user = createTestUser();
    let productName;

    await test.step('비로그인 상태에서 상품 Cart 추가', async () => {
      productName = await addFirstProductToCartAndContinueShopping(page);
    });

    await test.step('신규 계정 생성 및 로그인 상태 진입', async () => {
      await createAccountAndContinueViaUI(page, user);
      await expect(page.getByText(`Logged in as ${user.name}`)).toBeVisible();
    });

    await test.step('Cart 페이지에서 기존 상품 유지 여부 확인', async () => {
      await page.getByRole('link', { name: /Cart/i }).click();

      await expect(page).toHaveURL(/\/view_cart/);
      await expect(cartRows(page).filter({ hasText: productName })).toBeVisible();
    });
  });

  test('UI-CT-007 검색 결과 상품을 Cart에 추가 후 Cart 반영 확인', async ({ page }) => {
    let productName;

    await test.step('Products 페이지에서 검색어 입력 후 검색', async () => {
      await goToProductsPage(page);

      await page.locator('#search_product').fill(VALID_SEARCH_KEYWORD);
      await page.locator('#submit_search').click();

      await expect(page.getByText('Searched Products')).toBeVisible();
      await expect(productCards(page).first()).toBeVisible();

      productName = await getFirstProductName(page);
    });

    await test.step('검색 결과 첫 번째 상품 Cart 추가 후 View Cart 이동', async () => {
      await clickFirstProductAddToCart(page);
      await expectAddToCartModal(page);

      await page.getByRole('link', { name: 'View Cart' }).click();
      await expect(page).toHaveURL(/\/view_cart/);
    });

    await test.step('Cart에 검색 결과 상품 row 존재 확인', async () => {
      await expect(cartRows(page).filter({ hasText: productName })).toBeVisible();
    });
  });

  test('UI-CT-008 Add to Cart 모달에서 Continue Shopping 클릭 시 상품 목록 복귀 확인', async ({ page }) => {
    await test.step('Products 페이지에서 Add to cart 모달 노출', async () => {
      await goToProductsPage(page);
      await clickFirstProductAddToCart(page);
      await expectAddToCartModal(page);
    });

    await test.step('Continue Shopping 클릭 후 Products 목록 확인', async () => {
      await page.getByRole('button', { name: 'Continue Shopping' }).click();

      await expect(page).toHaveURL(/\/products/);
      await expect(page.getByText('All Products')).toBeVisible();
      await expect(productCards(page).first()).toBeVisible();
    });
  });

  test('UI-CT-009 Add to Cart 모달에서 View Cart 클릭 시 Cart 페이지 이동 확인', async ({ page }) => {
    await test.step('Products 페이지에서 Add to cart 모달 노출', async () => {
      await goToProductsPage(page);
      await clickFirstProductAddToCart(page);
      await expectAddToCartModal(page);
    });

    await test.step('View Cart 클릭 후 Cart 페이지 이동 확인', async () => {
      await page.getByRole('link', { name: 'View Cart' }).click();

      await expect(page).toHaveURL(/\/view_cart/);
      await expect(cartRows(page).first()).toBeVisible();
    });
  });

  test('UI-CT-010 Cart 추가 후 다른 페이지 이동 시 Cart 복귀 후 상품 유지 확인', async ({ page }) => {
    let productName;

    await test.step('상품 1개 Cart 추가 후 Continue Shopping', async () => {
      productName = await addFirstProductToCartAndContinueShopping(page);
    });

    await test.step('Home 페이지로 이동', async () => {
      await page.getByRole('link', { name: /Home/i }).click();
      await expect(page).toHaveURL('https://automationexercise.com/');
    });

    await test.step('Cart 페이지 재진입', async () => {
      await page.getByRole('link', { name: /Cart/i }).click();
      await expect(page).toHaveURL(/\/view_cart/);
    });

    await test.step('Cart 복귀 후 기존 상품 유지 확인', async () => {
      await expect(cartRows(page).filter({ hasText: productName })).toBeVisible();
    });
  });
});