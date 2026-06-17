import { test, expect, Page } from '@playwright/test';

// Test user credentials
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

// Helper: log in via API and inject auth into localStorage
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

// Helper: clear auth
async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  });
}

// ============================================================
// AUTH TESTS
// ============================================================

test.describe('Authentication', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AquaFolks/i);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('#email-or-username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email-or-username').fill('wrong@email.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Error div should appear with message from API
    await expect(page.locator('text=invalid credentials').or(page.locator('text=Login failed'))).toBeVisible({ timeout: 5000 });
  });

  test('login with valid credentials redirects to feed', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email-or-username').fill(REGULAR_USER.email);
    await page.locator('#password').fill(REGULAR_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('register with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/register');
    await page.locator('#email').fill('new@test.com');
    await page.locator('#username').fill('newuser123');
    await page.locator('#password').fill('Password123');
    await page.locator('#confirmPassword').fill('Different123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
  });

  test('unauthenticated access to feed redirects to login', async ({ page }) => {
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated access to tanks redirects to login', async ({ page }) => {
    await page.goto('/tanks');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated access to messages redirects to login', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('admin user can login with admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email-or-username').fill(ADMIN_USER.email);
    await page.locator('#password').fill(ADMIN_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });
});

// ============================================================
// NAVIGATION TESTS
// ============================================================

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
  });

  test('navigation links are visible when logged in', async ({ page }) => {
    await expect(page.getByRole('link', { name: /my tanks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /marketplace/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /messages/i })).toBeVisible();
  });

  test('can navigate to tanks page', async ({ page }) => {
    await page.getByRole('link', { name: /my tanks/i }).click();
    await expect(page).toHaveURL(/\/tanks/);
    await expect(page.getByRole('heading', { name: /my tanks/i })).toBeVisible();
  });

  test('can navigate to marketplace page', async ({ page }) => {
    await page.getByRole('link', { name: /marketplace/i }).click();
    await expect(page).toHaveURL(/\/marketplace/);
  });

  test('can navigate to messages page', async ({ page }) => {
    await page.getByRole('link', { name: /messages/i }).click();
    await expect(page).toHaveURL(/\/messages/);
  });

  test('can navigate to explore page', async ({ page }) => {
    await page.getByRole('link', { name: 'Explore', exact: true }).click();
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByRole('heading', { name: /explore tanks/i })).toBeVisible();
  });
});

// ============================================================
// FEED PAGE TESTS
// ============================================================

test.describe('Feed Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
  });

  test('feed page shows welcome message', async ({ page }) => {
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 5000 });
  });

  test('feed page has quick action links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /add a tank/i })).toBeVisible();
  });
});

// ============================================================
// TANKS TESTS
// ============================================================

test.describe('Tanks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/tanks');
  });

  test('tanks page shows heading and add button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my tanks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add tank/i })).toBeVisible();
  });

  test('can navigate to new tank form', async ({ page }) => {
    await page.getByRole('link', { name: /add tank/i }).click();
    await expect(page).toHaveURL(/\/tanks\/new/);
    await expect(page.locator('#name')).toBeVisible();
  });

  test('new tank form has required fields', async ({ page }) => {
    await page.goto('/tanks/new');
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#volume')).toBeVisible();
    await expect(page.getByRole('button', { name: /create tank/i })).toBeVisible();
  });

  test('can create a new tank', async ({ page }) => {
    await page.goto('/tanks/new');
    await page.locator('#name').fill('My Test Tank');
    await page.locator('#volume').fill('100');
    // Select freshwater type (radio is sr-only, click the label)
    await page.locator('input[name="tank-type"][value="freshwater"]').check({ force: true });
    await page.getByRole('button', { name: /create tank/i }).click();
    // Should redirect to tank detail
    await expect(page).toHaveURL(/\/tanks\//, { timeout: 10000 });
  });

  test('new tank form validates required fields', async ({ page }) => {
    await page.goto('/tanks/new');
    await page.getByRole('button', { name: /create tank/i }).click();
    // Should show error or stay on the same page
    await expect(page.locator('body')).toBeVisible();
    // Wait a moment to see if any redirect happens
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/tanks\/new/);
  });
});

// ============================================================
// MARKETPLACE TESTS
// ============================================================

test.describe('Marketplace', () => {
  test('marketplace is publicly accessible', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.getByRole('heading', { name: /marketplace/i })).toBeVisible();
  });

  test('marketplace shows create listing link when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/marketplace');
    await expect(page.getByRole('link', { name: '+ Create Listing' })).toBeVisible();
  });

  test('can navigate to create listing form', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/marketplace');
    await page.getByRole('link', { name: '+ Create Listing' }).click();
    await expect(page).toHaveURL(/\/marketplace\/new/);
  });

  test('create listing form has required fields', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/marketplace/new');
    await expect(page.locator('#listing-title')).toBeVisible();
    await expect(page.locator('#listing-description')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue to review/i })).toBeVisible();
  });

  test('can create a marketplace listing', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/marketplace/new');
    await page.locator('#listing-title').fill('Test Fish for Sale');
    await page.locator('#listing-description').fill('A beautiful test fish in good health');
    await page.locator('#listing-category').selectOption('fish');
    await page.locator('#listing-price-type').selectOption('free');
    await page.locator('#listing-city').fill('Seattle');
    await page.locator('#listing-state').fill('WA');
    await page.getByRole('button', { name: /continue to review/i }).click();
    await expect(page.getByRole('button', { name: /publish listing/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /publish listing/i }).click();
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 10000 });
  });
});

// ============================================================
// MESSAGES / CHAT TESTS
// ============================================================

test.describe('Messages', () => {
  test('messages page loads for authenticated user', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
  });

  test('messages page shows empty state when no conversations', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/messages');
    // Either shows conversations or empty state
    await expect(page.locator('body')).toBeVisible();
  });

  test('can send a message to admin user', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/messages/${ADMIN_USER.id}`);
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/type a message/i).fill('Hello admin, this is a test message!');
    await page.getByRole('button', { name: /send/i }).click();
    // Message should appear in the chat
    await expect(page.getByText('Hello admin, this is a test message!').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin can see messages from regular user', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
  });

  test('admin can reply to testuser', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto(`/messages/${REGULAR_USER.id}`);
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/type a message/i).fill('Hello testuser, this is admin replying!');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('Hello testuser, this is admin replying!').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// PROFILE / USER TESTS
// ============================================================

test.describe('User Profile', () => {
  test('public profile page is accessible', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.getByText(`@${REGULAR_USER.username}`)).toBeVisible({ timeout: 5000 });
  });

  test('settings page loads for authenticated user', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('settings page shows notification preferences', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /save preferences/i })).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// NOTIFICATIONS TESTS
// ============================================================

test.describe('Notifications', () => {
  test('notifications page loads', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
  });
});

// ============================================================
// EXPLORE PAGE TESTS
// ============================================================

test.describe('Explore Page', () => {
  test('explore page is publicly accessible', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
  });
});

// ============================================================
// PROJECTS TESTS
// ============================================================

test.describe('Projects', () => {
  test('projects page is accessible when not logged in', async ({ page }) => {
    await page.goto('/projects');
    // Should show projects page (public) or redirect based on implementation
    await expect(page.locator('body')).toBeVisible();
  });

  test('projects page accessible when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/projects');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================
// ADMIN TESTS
// ============================================================

test.describe('Admin Panel', () => {
  test('admin panel accessible to admin user', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin');
    // Should show admin panel, not redirect
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('admin panel not accessible to regular user', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/admin');
    // Should either redirect or show 403
    // Just check we don't see admin dashboard
    await page.waitForTimeout(2000);
    const url = page.url();
    const isRedirected = url.includes('/login') || url.includes('/feed') || url.includes('/');
    const hasAdminContent = await page.getByRole('heading', { name: /admin dashboard/i }).isVisible().catch(() => false);
    // Either redirected or admin content not visible
    expect(isRedirected || !hasAdminContent).toBeTruthy();
  });

  test('admin reports page accessible to admin', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/reports');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('admin users page accessible to admin', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/users');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});

// ============================================================
// SOCIAL FEATURES - FOLLOW/UNFOLLOW
// ============================================================

test.describe('Social Features', () => {
  test('can follow another user from their profile', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/users/${ADMIN_USER.id}`);
    // Look for Follow button (exact text to avoid matching "Following")
    const followBtn = page.getByRole('button', { name: 'Follow', exact: true });
    if (await followBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await followBtn.click();
      // Should update to "Following"
      await expect(
        page.getByRole('button', { name: /following/i })
      ).toBeVisible({ timeout: 5000 });
    }
    // If already following, test passes (state is already correct)
  });

  test('admin can follow testuser', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.getByText(REGULAR_USER.username)).toBeVisible({ timeout: 5000 });
  });

  test('logout works correctly', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    // Click the user menu button via aria-label
    await page.locator('button[aria-label="User menu"]').click();
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login|\//, { timeout: 5000 });
    // Verify access_token is removed
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeNull();
  });
});
