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

    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Another User',
        username: 'anotheruser',
        password: 'password'
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

    test('only the creator can see the delete button', async ({ page }) => {
      await page.getByRole('button', { name: 'create new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog by mluukkai')
      await inputs.nth(1).fill('Matti Author')
      await inputs.nth(2).fill('https://mattiblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      await expect(page.getByText('Blog by mluukkai Matti Author')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'remove' })).toBeVisible()

      await page.getByRole('button', { name: 'logout' }).click()

      await page.getByRole('textbox').first().fill('anotheruser')
      await page.getByRole('textbox').last().fill('password')
      await page.getByRole('button', { name: 'login' }).click()

      await expect(page.getByText('Another User logged in')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()

      await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible()
    })

    test('blogs are ordered by likes with most liked first', async ({ page }) => {
      await page.getByRole('button', { name: 'create new blog' }).click()
      let inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('First Blog')
      await inputs.nth(1).fill('Author One')
      await inputs.nth(2).fill('https://firstblog.com')
      await page.getByRole('button', { name: 'create' }).click()
      await expect(page.getByText('First Blog Author One')).toBeVisible()

      await page.getByRole('button', { name: 'create new blog' }).click()
      inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Second Blog')
      await inputs.nth(1).fill('Author Two')
      await inputs.nth(2).fill('https://secondblog.com')
      await page.getByRole('button', { name: 'create' }).click()
      await expect(page.getByText('Second Blog Author Two')).toBeVisible()

      const blogs = page.locator('[style*="border"]')

      await blogs.nth(0).getByRole('button', { name: 'view' }).click()
      await blogs.nth(0).getByRole('button', { name: 'like' }).click()
      await expect(blogs.nth(0).getByText('likes 1')).toBeVisible()
      await blogs.nth(0).getByRole('button', { name: 'like' }).click()
      await expect(blogs.nth(0).getByText('likes 2')).toBeVisible()

      await blogs.nth(1).getByRole('button', { name: 'view' }).click()
      await blogs.nth(1).getByRole('button', { name: 'like' }).click()
      await expect(blogs.nth(1).getByText('likes 1')).toBeVisible()

      const firstBlogTitle = await blogs.nth(0).textContent()
      const secondBlogTitle = await blogs.nth(1).textContent()

      expect(firstBlogTitle).toContain('First Blog')
      expect(secondBlogTitle).toContain('Second Blog')
    })
  })
})