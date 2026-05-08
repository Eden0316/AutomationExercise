export async function closeGoogleVignetteIfVisible(page) {
  // Google vignette 광고는 간헐적으로 #google_vignette hash와 함께 노출된다.
  // 광고가 없으면 아무 동작 없이 통과하고, 있으면 Close를 클릭한다.

  const closeCandidates = [
    page.getByText('Close', { exact: true }),
    page.getByRole('button', { name: /^Close$/i }),
    page.locator('[aria-label="Close"]'),
    page.locator('text=Close'),
  ];

  // 1) 메인 페이지 DOM에서 Close 탐색
  for (const closeButton of closeCandidates) {
    try {
      if (await closeButton.first().isVisible({ timeout: 1000 })) {
        await closeButton.first().click({ force: true });
        await page.waitForTimeout(500);
        return true;
      }
    } catch {
      // 광고가 없거나 locator가 매칭되지 않으면 무시
    }
  }

  // 2) iframe 내부에 광고 Close가 들어간 경우 대비
  for (const frame of page.frames()) {
    const frameCloseCandidates = [
      frame.getByText('Close', { exact: true }),
      frame.getByRole('button', { name: /^Close$/i }),
      frame.locator('[aria-label="Close"]'),
      frame.locator('text=Close'),
    ];

    for (const closeButton of frameCloseCandidates) {
      try {
        if (await closeButton.first().isVisible({ timeout: 1000 })) {
          await closeButton.first().click({ force: true });
          await page.waitForTimeout(500);
          return true;
        }
      } catch {
        // iframe 내부에 없으면 무시
      }
    }
  }

  return false;
}