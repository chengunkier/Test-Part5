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

  test('login succeeds with correct credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'login' }).click()
    await page.getByRole('textbox').first().fill('mluukkai')
    await page.getByRole('textbox').last().fill('salainen')
    await page.getByRole('button', { name: 'login' }).click()

    await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()
  })

  test('login fails with wrong credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'login' }).click()
    await page.getByRole('textbox').first().fill('mluukkai')
    await page.getByRole('textbox').last().fill('wrongpassword')
    await page.getByRole('button', { name: 'login' }).click()

    await expect(page.getByText('wrong username or password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'logout' })).not.toBeVisible()
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByRole('link', { name: 'login' }).click()
      await page.getByRole('textbox').first().fill('mluukkai')
      await page.getByRole('textbox').last().fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()
      await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()
    })

    test('a logged in user can create a blog', async ({ page }) => {
      await page.getByRole('link', { name: 'new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Test Blog Title')
      await inputs.nth(1).fill('Test Author')
      await inputs.nth(2).fill('https://testblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByText('a new blog Test Blog Title by Test Author added')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Test Blog Title by Test Author' })).toBeVisible()
    })

    test('a logged in user can like a blog', async ({ page }) => {
      await page.getByRole('link', { name: 'new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog to like')
      await inputs.nth(1).fill('Like Author')
      await inputs.nth(2).fill('https://likeblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByRole('link', { name: 'Blog to like by Like Author' })).toBeVisible()

      await page.getByRole('link', { name: 'Blog to like by Like Author' }).click()

      await expect(page.getByText('likes 0')).toBeVisible()

      await page.getByRole('button', { name: 'like' }).click()

      await expect(page.getByText('likes 1')).toBeVisible()
    })

    test('a logged in user can delete a blog', async ({ page }) => {
      await page.getByRole('link', { name: 'new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog to delete')
      await inputs.nth(1).fill('Delete Author')
      await inputs.nth(2).fill('https://deleteblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByRole('link', { name: 'Blog to delete by Delete Author' })).toBeVisible()

      await page.getByRole('link', { name: 'Blog to delete by Delete Author' }).click()

      page.on('dialog', dialog => dialog.accept())

      await page.getByRole('button', { name: 'remove' }).click()

      await expect(page.getByRole('link', { name: 'Blog to delete by Delete Author' })).not.toBeVisible()
    })
  })
})