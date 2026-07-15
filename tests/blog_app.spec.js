const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    // empty the database
    await request.post('http://localhost:3003/api/testing/reset')

    // create a user for the backend
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
      // log in before each test in this block
      await page.getByRole('textbox').first().fill('mluukkai')
      await page.getByRole('textbox').last().fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()

      // confirm we are logged in
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('a new blog can be created', async ({ page }) => {
      // click create new blog button
      await page.getByRole('button', { name: 'create new blog' }).click()

      // fill in the form
      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Test Blog Title')
      await inputs.nth(1).fill('Test Author')
      await inputs.nth(2).fill('https://testblog.com')

      // click create button
      await page.getByRole('button', { name: 'create' }).click()

      // success notification should appear
      await expect(page.getByText('a new blog Test Blog Title by Test Author added')).toBeVisible()

      // new blog should appear in the list
      await expect(page.getByText('Test Blog Title Test Author')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      // first create a blog to like
      await page.getByRole('button', { name: 'create new blog' }).click()

      const inputs = page.getByRole('textbox')
      await inputs.nth(0).fill('Blog to be liked')
      await inputs.nth(1).fill('Like Author')
      await inputs.nth(2).fill('https://likedblog.com')

      await page.getByRole('button', { name: 'create' }).click()

      // wait for blog to appear in list
      await expect(page.getByText('Blog to be liked Like Author')).toBeVisible()

      // click view button to expand the blog
      await page.getByRole('button', { name: 'view' }).click()

      // confirm likes starts at 0
      await expect(page.getByText('likes 0')).toBeVisible()

      // click the like button
      await page.getByRole('button', { name: 'like' }).click()

      // likes should now be 1
      await expect(page.getByText('likes 1')).toBeVisible()
    })
  })
})