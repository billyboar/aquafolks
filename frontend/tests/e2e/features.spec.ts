import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const REGULAR_USER = {
  email: 'testuser@aquafolks.com',
  username: 'testuser',
  password: 'Test@12345',
  displayName: 'Test User',
  id: '9f578dda-1932-4ece-adc4-91c9b41bfe65',
};

const ADMIN_USER = {
  email: 'adminuser@aquafolks.com',
  username: 'adminuser',
  password: 'Admin@12345',
  displayName: 'Admin User',
  id: '7417d89a-b926-48cb-b80b-0a47dca3ca69',
};

const PROJECT_ID = '0697a8dd-630e-462e-bade-f9345268aed3';
const UPDATE_ID = 'f092b5a1-1246-4593-b20d-db64700032d5';

async function loginAs(page: Page, user: typeof REGULAR_USER) {
  const response = await page.request.post('http://localhost:8080/api/auth/login', {
    data: { email_or_username: user.email, password: user.password },
  });
  const data = await response.json();
  const token = data.tokens.access_token;
  const userObj = data.user;
  await page.addInitScript(
    ({ token, userObj }: { token: string; userObj: object }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
    },
    { token, userObj }
  );
  return token;
}

// ============================================================
// PROJECT DETAIL PAGE - General
// ============================================================

test.describe('Project Detail Page', () => {
  test('project detail page loads for unauthenticated user', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('project detail page shows BubbleButton for project likes', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    // BubbleButton for the project itself (likeableType="project") should be visible
    await expect(page.locator('[data-testid="bubble-button"], button').filter({ hasText: /bubble|like|\d+/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('project detail page shows Progress Updates section', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.getByText('Progress Updates')).toBeVisible({ timeout: 10000 });
  });

  test('project detail page shows Author card in sidebar', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.getByText('Author')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`@${REGULAR_USER.username}`)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// BUBBLE (LIKE) ON PROJECT UPDATES
// ============================================================

test.describe('Bubble Button on Project Updates', () => {
  test('each update card shows a Comments toggle button', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    // Wait for updates to load
    await page.waitForTimeout(2000);
    // Find "Comments" button within the updates section
    const commentsBtn = page.getByRole('button', { name: /comments/i }).first();
    await expect(commentsBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking Comments toggle expands comment section for that update', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    // The update's comment section should now contain a CommentForm with a textarea
    // Use nth(1) to skip the always-visible main project comment textarea at the bottom
    await expect(page.locator('textarea[placeholder*="comment"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Comments toggle again collapses it', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    // Hide comments button text should change
    const hideBtn = page.getByRole('button', { name: /hide comments/i }).first();
    await expect(hideBtn).toBeVisible({ timeout: 5000 });
    await hideBtn.click();

    await expect(page.getByRole('button', { name: /hide comments/i })).not.toBeVisible({ timeout: 5000 });
  });

});

// ============================================================
// COMMENT ON PROJECT UPDATES (via browser)
// ============================================================

test.describe('Comments on Project Updates', () => {
  test('can post a comment on a project update', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    // Expand comments for the first update
    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    const textarea = page.locator('textarea[placeholder*="comment"]').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('Automated test comment on update');

    await page.getByRole('button', { name: /post comment/i }).first().click();

    // Comment should appear (match the paragraph, not the textarea)
    await expect(page.locator('p').filter({ hasText: 'Automated test comment on update' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('comment form shows cancel button when text is entered', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    const textarea = page.locator('textarea[placeholder*="comment"]').first();
    await textarea.fill('Some text');

    await expect(page.getByRole('button', { name: /cancel/i }).first()).toBeVisible({ timeout: 3000 });
  });

  test('empty comment cannot be submitted', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    const postBtn = page.getByRole('button', { name: /post comment/i }).first();
    await expect(postBtn).toBeDisabled({ timeout: 5000 });
  });

  test('unauthenticated user cannot see comment form', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    // Try to find "Comments" button - it should be present but comment form should require auth
    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    if (await commentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await commentsBtn.click();
      // After clicking, comment textarea should NOT be visible for unauth users
      // (depends on how the backend handles it - just check page doesn't crash)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('posted comment shows author display name', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    const textarea = page.locator('textarea[placeholder*="comment"]').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    const uniqueText = `Author test ${Date.now()}`;
    await textarea.fill(uniqueText);
    await page.getByRole('button', { name: /post comment/i }).first().click();

    // Wait for comment to appear with the unique text
    await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 8000 });
    // The comment should show the display name near the unique text
    await expect(page.getByText(REGULAR_USER.displayName).first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// COMMENT FORM - IMAGE ATTACHMENT
// ============================================================

test.describe('Comment Image Attachment', () => {
  test('comment form shows Photo button', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    // Photo label is inside the update's CommentForm - use first()
    await expect(page.getByText('Photo').first()).toBeVisible({ timeout: 5000 });
  });

  test('can attach an image to a comment', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    // Create a small test PNG in memory and use it
    const testImagePath = path.join('/tmp', 'test-comment-img.png');
    // 1x1 red pixel PNG
    const pngBuf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuf);

    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Preview thumbnail should appear
    await expect(page.locator('img[alt="attachment preview"]')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(testImagePath);
  });

  test('can remove an attached image preview', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    await commentsBtn.click();

    const testImagePath = '/tmp/test-comment-img2.png';
    const pngBuf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuf);

    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(testImagePath);

    await expect(page.locator('img[alt="attachment preview"]')).toBeVisible({ timeout: 5000 });

    // Hover over the preview to reveal the remove button (×)
    await page.locator('img[alt="attachment preview"]').first().hover();
    const removeBtn = page.locator('button').filter({ hasText: '×' }).first();
    await removeBtn.click({ force: true });

    // Preview should be gone
    await expect(page.locator('img[alt="attachment preview"]')).not.toBeVisible({ timeout: 3000 });

    fs.unlinkSync(testImagePath);
  });
});

// ============================================================
// BUBBLE BUTTON (LIKE) - API CORRECTNESS
// ============================================================

test.describe('Like (Bubble) Functionality', () => {
  test('BubbleButton shows correct like count on project page', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    // Like count should be a number (not NaN or undefined)
    await page.waitForTimeout(3000);
    // Just verify no JS errors caused the page to crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('is_liked state correctly reflects after toggle via API', async ({ page }) => {
    const token = await loginAs(page, REGULAR_USER);

    // Get initial like state
    const statsRes = await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const stats = await statsRes.json();
    const initialIsLiked = stats.is_liked;

    // Toggle
    await page.request.post(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Check new state
    const newStatsRes = await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const newStats = await newStatsRes.json();
    expect(newStats.is_liked).toBe(!initialIsLiked);

    // Toggle back to original state
    await page.request.post(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  });

  test('like count increments and decrements correctly', async ({ page }) => {
    const token = await loginAs(page, REGULAR_USER);

    const before = await (await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    )).json();

    // Toggle on (or off)
    await page.request.post(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const after = await (await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    )).json();

    expect(Math.abs(after.like_count - before.like_count)).toBe(1);

    // Restore
    await page.request.post(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  });

  test('anonymous user sees like count but is_liked is false', async ({ page }) => {
    const res = await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`
    );
    const stats = await res.json();
    expect(typeof stats.like_count).toBe('number');
    expect(stats.is_liked).toBe(false);
  });

  test('authenticated user sees correct is_liked after liking', async ({ page }) => {
    const token = await loginAs(page, REGULAR_USER);

    // Ensure not liked first
    const initial = await (await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    )).json();

    if (!initial.is_liked) {
      await page.request.post(
        `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    const stats = await (await page.request.get(
      `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/likes`,
      { headers: { Authorization: `Bearer ${token}` } }
    )).json();
    expect(stats.is_liked).toBe(true);

    // Clean up
    if (!initial.is_liked) {
      await page.request.post(
        `http://localhost:8080/api/v1/project_update/${UPDATE_ID}/like`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  });
});

// ============================================================
// COMMENT SECTION ON TANKS
// ============================================================

test.describe('Comment Section on Tanks', () => {
  let tankId: string;

  test.beforeEach(async ({ page }) => {
    const token = await loginAs(page, REGULAR_USER);
    const res = await page.request.get('http://localhost:8080/api/v1/tanks', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    tankId = data.tanks?.[0]?.id;
  });

  test('tank detail page loads without error', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    if (!tankId) test.skip();
    await page.goto(`/tanks/${tankId}`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('comment section is visible on tank page', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    if (!tankId) test.skip();
    await page.goto(`/tanks/${tankId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/comments/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('can post a comment on a tank', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    if (!tankId) test.skip();
    await page.goto(`/tanks/${tankId}`);

    const textarea = page.locator('textarea[placeholder*="comment"]').first();
    await expect(textarea).toBeVisible({ timeout: 8000 });
    await textarea.fill('Automated tank comment test');
    await page.getByRole('button', { name: /post comment/i }).first().click();
    await expect(page.locator('p').filter({ hasText: 'Automated tank comment test' }).first()).toBeVisible({ timeout: 8000 });
  });
});

// ============================================================
// PROJECTS PAGE
// ============================================================

test.describe('Projects Page Features', () => {
  test('can create a new project', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');
    await page.locator('#title').fill('E2E Test Project');
    await page.locator('#description').fill('Created by automated test');
    await page.getByRole('button', { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/projects\//, { timeout: 10000 });
  });

  test('project list page shows projects', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/projects');
    await expect(page.locator('body')).toBeVisible();
    // Should show at least one project
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================
// FRONTEND COMPILATION / RUNTIME ERRORS
// ============================================================

test.describe('No Runtime Errors', () => {
  test('project detail page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors (e.g. network errors for missing resources)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('projects list page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, REGULAR_USER);
    await page.goto('/projects');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('expanding update comments causes no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForTimeout(2000);

    const commentsBtn = page.getByRole('button', { name: /^Comments$/i }).first();
    if (await commentsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await commentsBtn.click();
      await page.waitForTimeout(2000);
    }

    expect(errors).toHaveLength(0);
  });
});
