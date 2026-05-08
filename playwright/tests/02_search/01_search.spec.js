import { test, expect } from '@playwright/test';
import { closeGoogleVignetteIfVisible } from '../../utils/uiHelper.js';

const VALID_SEARCH_KEYWORD = 'top';
const INVALID_SEARCH_KEYWORD = 'zzzz_non_exist_9999';

async function goToProductsPage(page) {
  await page.goto('/');

  await page.getByRole('link', { name: /Products/i }).click();

  // 광고가 뜬 경우 Close 처리
  await closeGoogleVignetteIfVisible(page);

  // 광고 Close 후에도 아직 products로 이동하지 않았다면 Products 메뉴 재클릭
  if (!/\/products/.test(page.url())) {
    try {
      await page.getByRole('link', { name: /Products/i }).click({ timeout: 3000 });
      await closeGoogleVignetteIfVisible(page);
    } catch {
      // 메뉴 재클릭 실패 시 아래 fallback에서 처리
    }
  }

  // Google vignette hash 상태에 머물러 있으면 직접 Products 페이지로 이동
  if (!/\/products/.test(page.url())) {
    await page.goto('/products');
    await closeGoogleVignetteIfVisible(page);
  }

  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByText('All Products')).toBeVisible();
}

async function searchProduct(page, keyword) {
  await page.locator('#search_product').fill(keyword);
  await page.locator('#submit_search').click();

  await expect(page.getByText('Searched Products')).toBeVisible();
}

function productCards(page) {
  return page.locator('.features_items .product-image-wrapper');
}

function productNames(page) {
  return page.locator('.features_items .productinfo p');
}

test.describe('상품 검색 UI - Search 플로우', () => {
  test('UI-SR-001 Products 페이지 진입 확인', async ({ page }) => {
    await test.step('홈페이지에서 Products 페이지로 이동', async () => {
      await goToProductsPage(page);
    });

    await test.step('Products 페이지 URL 및 헤더 확인', async () => {
      await expect(page).toHaveURL(/\/products/);
      await expect(page.getByText('All Products')).toBeVisible();
    });
  });

  test('UI-SR-002 검색 입력창 및 검색 버튼 노출 확인', async ({ page }) => {
    await test.step('Products 페이지 진입', async () => {
      await goToProductsPage(page);
    });

    await test.step('검색 입력창 visible 확인', async () => {
      await expect(page.locator('#search_product')).toBeVisible();
      await expect(page.locator('#search_product')).toHaveAttribute('placeholder', 'Search Product');
    });

    await test.step('검색 버튼 visible 확인', async () => {
      await expect(page.locator('#submit_search')).toBeVisible();
    });
  });

  test('UI-SR-003 유효 검색어로 검색 실행 후 결과 노출 확인', async ({ page }) => {
    await test.step('Products 페이지 진입', async () => {
      await goToProductsPage(page);
    });

    await test.step(`검색어 "${VALID_SEARCH_KEYWORD}" 입력 후 검색 실행`, async () => {
      await searchProduct(page, VALID_SEARCH_KEYWORD);
    });

    await test.step('검색 결과 헤더 및 상품 카드 노출 확인', async () => {
      await expect(page.getByText('Searched Products')).toBeVisible();
      await expect(productCards(page).first()).toBeVisible();

      const count = await productCards(page).count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('검색 결과 상품명/가격 기본 정보 노출 확인', async () => {
      await expect(productNames(page).first()).toBeVisible();
      await expect(page.locator('.features_items .productinfo h2').first()).toBeVisible();
    });
  });

  test('UI-SR-004 검색 결과 상품명이 검색어와 연관성 있는지 확인', async ({ page }) => {
    await test.step('Products 페이지에서 유효 검색어 검색', async () => {
      await goToProductsPage(page);
      await searchProduct(page, VALID_SEARCH_KEYWORD);
    });

    await test.step('검색 결과 상품명 텍스트 수집', async () => {
      const names = await productNames(page).allTextContents();

      expect(names.length).toBeGreaterThan(0);

      const normalizedNames = names.map((name) => name.toLowerCase().trim());
      const hasRelatedProduct = normalizedNames.some((name) =>
        name.includes(VALID_SEARCH_KEYWORD.toLowerCase())
      );

      expect(hasRelatedProduct).toBeTruthy();
    });
  });

  test('UI-SR-005 관련 없는 키워드로 검색 시 빈 결과 화면 확인', async ({ page }) => {
    await test.step('Products 페이지 진입', async () => {
      await goToProductsPage(page);
    });

    await test.step(`관련 없는 검색어 "${INVALID_SEARCH_KEYWORD}" 입력 후 검색 실행`, async () => {
      await searchProduct(page, INVALID_SEARCH_KEYWORD);
    });

    await test.step('검색 결과 헤더는 노출되고 상품 카드는 0건인지 확인', async () => {
      await expect(page.getByText('Searched Products')).toBeVisible();

      const count = await productCards(page).count();
      expect(count).toBe(0);
    });
  });

  test('UI-SR-006 검색 결과 화면에서 새로고침 후 상태 유지 확인', async ({ page }) => {
    await test.step('Products 페이지에서 유효 검색어 검색', async () => {
      await goToProductsPage(page);
      await searchProduct(page, VALID_SEARCH_KEYWORD);

      await expect(productCards(page).first()).toBeVisible();
    });

    await test.step('검색 결과 화면 새로고침', async () => {
      await page.reload();
    });

    await test.step('새로고침 후 Products/Search 화면 상태 확인', async () => {
      await expect(page).toHaveURL(/\/products/);
      await expect(page.locator('#search_product')).toBeVisible();

      const searchedHeader = page.getByText('Searched Products');
      const allProductsHeader = page.getByText('All Products');

      const searchedVisible = await searchedHeader.isVisible().catch(() => false);
      const allProductsVisible = await allProductsHeader.isVisible().catch(() => false);

      expect(searchedVisible || allProductsVisible).toBeTruthy();
    });
  });

  test('UI-SR-007 검색어 미입력 상태에서 검색 버튼 클릭 시 동작 확인', async ({ page }) => {
    await test.step('Products 페이지 진입', async () => {
      await goToProductsPage(page);
    });

    await test.step('검색어 공백 상태에서 검색 버튼 클릭', async () => {
      await page.locator('#search_product').fill('');
      await page.locator('#submit_search').click();
    });

    await test.step('오류 없이 Products/Search 영역 유지 확인', async () => {
      await expect(page).toHaveURL(/\/products/);
      await expect(page.locator('#search_product')).toBeVisible();

      const searchedHeader = page.getByText('Searched Products');
      const allProductsHeader = page.getByText('All Products');

      const searchedVisible = await searchedHeader.isVisible().catch(() => false);
      const allProductsVisible = await allProductsHeader.isVisible().catch(() => false);

      expect(searchedVisible || allProductsVisible).toBeTruthy();
    });
  });
});