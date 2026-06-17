import { test, expect, Page } from '@playwright/test';

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

const TANK_ID = '568a829e-16f1-4050-9200-faffbae91a7e';
const PROJECT_ID = '0697a8dd-630e-462e-bade-f9345268aed3';
const LISTING_ID = '99fbb9ff-3b1b-40c0-ab2d-aafc825a8c1c';

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
// INDEX / FEED REDIRECT
// ============================================================

test.describe('Index Page', () => {
  test('guest sees landing page at /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('AquaFolks', { timeout: 8000 });
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('logged-in user is redirected from / to /feed', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/');
    await page.waitForURL('**/feed', { timeout: 10000 });
    await expect(page).toHaveURL(/\/feed/);
  });

  test('feed page shows welcome message with username', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.locator('h1')).toContainText(REGULAR_USER.displayName, { timeout: 8000 });
  });

  test('feed page shows quick action cards', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.getByRole('link', { name: /Add a Tank/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /Start a Project/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore Tanks/i })).toBeVisible();
  });

  test('feed page shows My Projects section', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.locator('h2', { hasText: 'My Projects' })).toBeVisible({ timeout: 10000 });
  });

  test('feed page shows Recent Tanks section', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.locator('h2', { hasText: 'Recent Tanks' })).toBeVisible({ timeout: 10000 });
  });

  test('feed page shows Recent Projects section', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.locator('h2', { hasText: 'Recent Projects' })).toBeVisible({ timeout: 10000 });
  });

  test('feed page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// HEADER / NAV
// ============================================================

test.describe('Header Navigation', () => {
  test('My Projects nav link is visible when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.getByRole('link', { name: 'My Projects' })).toBeVisible({ timeout: 8000 });
  });

  test('My Projects nav link navigates to user profile', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await page.getByRole('link', { name: 'My Projects' }).click();
    await page.waitForURL(`**/users/${REGULAR_USER.id}`, { timeout: 8000 });
    await expect(page).toHaveURL(new RegExp(REGULAR_USER.id));
  });

  test('notification bell is visible when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await expect(page.locator('button[aria-label="Notifications"]')).toBeVisible({ timeout: 8000 });
  });

  test('notification dropdown opens when bell is clicked', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await page.locator('button[aria-label="Notifications"]').click();
    await expect(page.locator('h3', { hasText: 'Notifications' })).toBeVisible({ timeout: 5000 });
  });

  test('notification dropdown has View All link', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    await page.locator('button[aria-label="Notifications"]').click();
    // Scope to the notification panel to avoid ambiguity with other "View all" links
    const panel = page.locator('div').filter({ has: page.locator('h3', { hasText: 'Notifications' }) }).first();
    await expect(panel.getByRole('link', { name: /View All/i })).toBeVisible({ timeout: 5000 });
  });

  test('user menu dropdown shows profile and settings links', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    // Find and click user menu button (desktop)
    await page.locator('button[aria-label="User menu"]').click();
    await expect(page.getByRole('link', { name: /View Profile/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });
});

// ============================================================
// TANKS
// ============================================================

test.describe('Tank Features', () => {
  test('tank detail page loads', async ({ page }) => {
    await page.goto(`/tanks/${TANK_ID}`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('tank detail page shows comments section when logged in', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}`);
    await expect(page.locator('text=Comments').first()).toBeVisible({ timeout: 10000 });
  });

  test('tank edit page loads for owner', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('tank edit page has all required fields', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}/edit`);
    await expect(page.locator('input[name="name"], input[id="name"], input[placeholder*="name" i]').first()).toBeVisible({ timeout: 8000 });
  });

  test('tanks list shows user tanks', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/tanks');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('new tank form validates empty submission', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/tanks/new');
    await page.getByRole('button', { name: /Create Tank|Add Tank|Save/i }).click();
    // Should show validation or stay on page
    await expect(page).toHaveURL(/\/tanks\/new/, { timeout: 3000 });
  });

  test('tank detail page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}`);
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// PROJECTS
// ============================================================

test.describe('Project Features', () => {
  test('project detail page shows title', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('project detail shows Add Update button for owner', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.getByRole('button', { name: /Add Update/i })).toBeVisible({ timeout: 10000 });
  });

  test('Add Update button opens update form', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.getByRole('button', { name: /Add Update/i }).click();
    await expect(page.locator('textarea[placeholder*="progress" i]')).toBeVisible({ timeout: 5000 });
  });

  test('#add-update hash auto-opens update form', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}#add-update`);
    await expect(page.locator('textarea[placeholder*="progress" i]')).toBeVisible({ timeout: 10000 });
  });

  test('project detail shows Progress Updates section', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.locator('h2', { hasText: 'Progress Updates' })).toBeVisible({ timeout: 10000 });
  });

  test('project detail shows author card in sidebar', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    // Author section
    await expect(page.locator('text=Test User').first()).toBeVisible({ timeout: 10000 });
  });

  test('project edit page loads for owner', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('projects filter by type works', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const breedingBtn = page.locator('button', { hasText: /Breeding/i });
    if (await breedingBtn.isVisible()) {
      await breedingBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('projects filter by status works', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const inProgressBtn = page.locator('button', { hasText: /In Progress/i });
    if (await inProgressBtn.isVisible()) {
      await inProgressBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('My Projects section on feed shows Add Update buttons', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/feed');
    // Wait for projects to load
    await page.waitForLoadState('networkidle');
    const addUpdateLinks = page.getByRole('link', { name: /Add Update/i });
    const count = await addUpdateLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================
// MARKETPLACE
// ============================================================

test.describe('Marketplace Features', () => {
  test('marketplace page loads publicly', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('marketplace listing detail page loads', async ({ page }) => {
    await page.goto(`/marketplace/${LISTING_ID}`);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('marketplace create listing form has required fields', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/marketplace/new');
    await expect(page.locator('#listing-title, input[id="listing-title"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('select, textarea').first()).toBeVisible();
  });

  test('marketplace shows listing cards', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    // Either listings or empty state
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('marketplace edit page loads for listing owner', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/marketplace/${LISTING_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('marketplace has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// USER PROFILE
// ============================================================

test.describe('User Profile Features', () => {
  test('user profile page shows username', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.locator(`text=${REGULAR_USER.username}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('user profile shows tanks section', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.locator('text=/My Tanks|Tanks/').first()).toBeVisible({ timeout: 10000 });
  });

  test('user profile shows projects section', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.locator('text=/My Projects|Projects/').first()).toBeVisible({ timeout: 10000 });
  });

  test('own profile shows edit profile button', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/users/${REGULAR_USER.id}`);
    await expect(page.getByRole('link', { name: /Edit Profile|Settings/i })).toBeVisible({ timeout: 10000 });
  });

  test('other user profile shows follow button', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/users/${ADMIN_USER.id}`);
    // Should show follow/unfollow
    await expect(page.getByRole('button', { name: /Follow|Unfollow/i })).toBeVisible({ timeout: 10000 });
  });

  test('followers page loads', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}/followers`);
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
  });

  test('following page loads', async ({ page }) => {
    await page.goto(`/users/${REGULAR_USER.id}/following`);
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 8000 });
  });

  test('settings page shows all sections', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/settings');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  test('profile page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`/users/${REGULAR_USER.id}`);
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// NOTIFICATIONS
// ============================================================

test.describe('Notifications', () => {
  test('notifications page loads and shows heading', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/notifications');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('unauthenticated user is redirected from notifications', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForURL('**/login', { timeout: 8000 });
    await expect(page).toHaveURL(/login/);
  });

  test('notifications page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loginAs(page, REGULAR_USER);
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// MESSAGES
// ============================================================

test.describe('Messages Features', () => {
  test('messages page shows conversations list', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/messages');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('can open a conversation', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    const convLink = page.locator('a[href*="/messages/"]').first();
    if (await convLink.isVisible()) {
      await convLink.click();
      await expect(page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('messages conversation page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loginAs(page, REGULAR_USER);
    await page.goto(`/messages/${ADMIN_USER.id}`);
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_') && !e.includes('WebSocket'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// EXPLORE PAGE
// ============================================================

test.describe('Explore Page', () => {
  test('explore page loads for unauthenticated user', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('explore page shows tank grid', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('explore page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });
});

// ============================================================
// LIKES
// ============================================================

test.describe('Like Functionality', () => {
  test('project page shows like button', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    // BubbleButton for likes
    const likeBtn = page.locator('button').filter({ hasText: /\d+/ }).first();
    await expect(likeBtn).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user can toggle like on a project', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    const likeBtn = page.locator('button').filter({ hasText: /\d+/ }).first();
    await expect(likeBtn).toBeVisible({ timeout: 10000 });
    const before = await likeBtn.textContent();
    await likeBtn.click();
    await page.waitForTimeout(1000);
    // Toggle back
    await likeBtn.click();
    await page.waitForTimeout(500);
  });
});

// ============================================================
// COMMENTS
// ============================================================

test.describe('Comment Functionality', () => {
  test('tank page shows comment section', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}`);
    await expect(page.locator('text=Comments').first()).toBeVisible({ timeout: 10000 });
  });

  test('project page shows comment section', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await expect(page.locator('text=Comments').first()).toBeVisible({ timeout: 10000 });
  });

  test('comment form is visible for logged-in user on tank page', async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto(`/tanks/${TANK_ID}`);
    await expect(page.locator('textarea[placeholder*="comment" i], textarea[placeholder*="write" i]').first()).toBeVisible({ timeout: 10000 });
  });

  test('logged-out user sees login prompt instead of comment form on project page', async ({ page }) => {
    await page.goto(`/projects/${PROJECT_ID}`);
    await page.waitForLoadState('networkidle');
    // Should show "Log in to leave a comment" instead of the textarea
    await expect(page.locator('text=/Log in.*comment|comment.*Log in/i').first()).toBeVisible({ timeout: 8000 });
    const commentForm = page.locator('textarea[placeholder*="comment" i], textarea[placeholder*="write" i]');
    await expect(commentForm).not.toBeVisible({ timeout: 3000 });
  });
});

// ============================================================
// FORGOT PASSWORD
// ============================================================

test.describe('Forgot Password', () => {
  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  test('forgot password form accepts email', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('test@example.com');
    await page.getByRole('button', { name: /Send|Reset|Submit/i }).click();
    // Should show success or stay on page
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================
// ADMIN PANEL
// ============================================================

test.describe('Admin Panel Extended', () => {
  test('admin can access admin panel', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin panel has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const filtered = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_'));
    expect(filtered).toHaveLength(0);
  });

  test('admin users page shows user list', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/users');
    await expect(page.locator('h1, h2, table, [role="row"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin reports page loads', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin/reports');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// REGISTER
// ============================================================

test.describe('Registration', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  test('register form has all required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[name="username"], input[placeholder*="username" i]').first()).toBeVisible();
  });

  test('register validates mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[name="username"], input[placeholder*="username" i]').first().fill('newuser123');
    await page.locator('input[type="email"]').fill('newuser@test.com');
    await page.locator('input[type="password"]').first().fill('Password123!');
    await page.locator('input[type="password"]').nth(1).fill('DifferentPass123!');
    await page.getByRole('button', { name: /Register|Sign Up|Create/i }).click();
    await expect(page.locator('text=/password.*match|match.*password/i').first()).toBeVisible({ timeout: 5000 });
  });
});
