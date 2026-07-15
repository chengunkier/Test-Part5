const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
    await expect(page.getByRole('textbox').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByRole('textbox').first().fill('mluukkai')
      await page.getByRole('textbox').last().fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()

      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByRole('textbox').first().fill('mluukkai')
      await page.getByRole('textbox').last().fill('wrongpassword')
      await page.getByRole('button', { name: 'login' }).click()

      await expect(page.getByText('wrong username or password')).toBeVisible()
      await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByRole('textbox').first().fill('mluukkai')
      await page.getByRole('textbox').last().fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('a new blog can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'create new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Test Blog Title')
      await inputs.nth(1).fill('Test Author')
      await inputs.nth(2).fill('https://testblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByText('a new blog Test Blog Title by Test Author added')).toBeVisible()
      await expect(page.getByText('Test Blog Title Test Author')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      await page.getByRole('button', { name: 'create new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog to be liked')
      await inputs.nth(1).fill('Like Author')
      await inputs.nth(2).fill('https://likedblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByText('Blog to be liked Like Author')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()

      await expect(page.getByText('likes 0')).toBeVisible()

      await page.getByRole('button', { name: 'like' }).click()

      await expect(page.getByText('likes 1')).toBeVisible()
    })

    test('the user who added the blog can delete it', async ({ page }) => {
      await page.getByRole('button', { name: 'create new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog to be deleted')
      await inputs.nth(1).fill('Delete Author')
      await inputs.nth(2).fill('https://deletedblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByText('Blog to be deleted Delete Author')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()

      page.on('dialog', dialog => dialog.accept())

      await page.getByRole('button', { name: 'remove' }).click()

      await expect(page.getByText('Blog to be deleted Delete Author')).not.toBeVisible()
    })
  })
})