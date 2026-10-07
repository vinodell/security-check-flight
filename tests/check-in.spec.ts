import { mkdir, readFile } from 'node:fs/promises'
import { expect, test, type Locator, type Page } from '@playwright/test'

async function fillPassenger(page: Page) {
  await page.getByLabel('Фамилия', { exact: true }).fill('Волкова')
  await page.getByLabel('Имя', { exact: true }).fill('Анна')
  await page.getByLabel('Отчество', { exact: true }).fill('Сергеевна')
  await page.getByLabel('Дата рождения', { exact: true }).fill('1998-04-12')
}

async function fillFlight(page: Page) {
  await page.getByLabel('Номер рейса', { exact: true }).fill('AE 204')
  await page.getByLabel('Код брони', { exact: true }).fill('SKY204')
  await page.getByLabel('Дата вылета', { exact: true }).fill('2026-10-24')
}

async function proceedToDocument(page: Page) {
  await fillPassenger(page)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await fillFlight(page)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.locator('html').evaluate((element) => ({
    viewportWidth: element.clientWidth,
    viewportHeight: element.clientHeight,
    contentWidth: Math.max(element.scrollWidth, element.ownerDocument.body.scrollWidth),
    contentHeight: Math.max(element.scrollHeight, element.ownerDocument.body.scrollHeight),
  }))
  expect(dimensions.contentWidth, 'Страница не требует горизонтальной прокрутки').toBeLessThanOrEqual(dimensions.viewportWidth + 1)
  expect(dimensions.contentHeight, 'Страница не требует вертикальной прокрутки').toBeLessThanOrEqual(dimensions.viewportHeight + 1)
}

async function expectWithinViewport(page: Page, element: Locator) {
  await expect(element).toBeVisible()
  const bounds = await element.boundingBox()
  const viewport = page.viewportSize()
  expect(bounds).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!bounds || !viewport) throw new Error('Viewport or element bounds are unavailable')
  expect(bounds.x).toBeGreaterThanOrEqual(-1)
  expect(bounds.y).toBeGreaterThanOrEqual(-1)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1)
}

async function expectFormFits(page: Page) {
  const card = page.locator('.check-in-card')
  await expectWithinViewport(page, card)
  await expectWithinViewport(page, card.locator('.primary-button'))
  const cardBounds = await card.boundingBox()
  const submitBounds = await card.locator('.primary-button').boundingBox()
  if (!cardBounds) throw new Error('Check-in card bounds are unavailable')
  if (!submitBounds) throw new Error('Submit button bounds are unavailable')
  let fieldsBottom = 0
  for (const field of await card.locator('.form-field').all()) {
    await expectWithinViewport(page, field)
    const bounds = await field.boundingBox()
    if (!bounds) throw new Error('Form field bounds are unavailable')
    expect(bounds.x).toBeGreaterThanOrEqual(cardBounds.x - 1)
    expect(bounds.y).toBeGreaterThanOrEqual(cardBounds.y - 1)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(cardBounds.x + cardBounds.width + 1)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(cardBounds.y + cardBounds.height + 1)
    fieldsBottom = Math.max(fieldsBottom, bounds.y + bounds.height)
  }
  expect(fieldsBottom, 'Поля и ошибки не перекрывают кнопку продолжения').toBeLessThanOrEqual(submitBounds.y - 2)
  const helper = card.locator('.game-helper')
  if (await helper.isVisible()) {
    await expectWithinViewport(page, helper)
    const helperBounds = await helper.boundingBox()
    if (!helperBounds) throw new Error('Game helper bounds are unavailable')
    expect(helperBounds.x).toBeGreaterThanOrEqual(cardBounds.x - 1)
    expect(helperBounds.y).toBeGreaterThanOrEqual(cardBounds.y - 1)
    expect(helperBounds.y, 'Подсказка не перекрывает кнопку продолжения').toBeGreaterThanOrEqual(submitBounds.y + submitBounds.height + 2)
    expect(helperBounds.x + helperBounds.width).toBeLessThanOrEqual(cardBounds.x + cardBounds.width + 1)
    expect(helperBounds.y + helperBounds.height).toBeLessThanOrEqual(cardBounds.y + cardBounds.height + 1)
  }
  await expectNoPageOverflow(page)
}

test('квитанция, ошибки, единственная бронь, скачивание и повторное прохождение', async ({ page }, testInfo) => {
  await page.goto('/')
  const howToPlay = page.getByRole('button', { name: 'Как играть' })
  await howToPlay.click()
  const receipt = page.getByRole('dialog')
  await expect(receipt).toBeVisible()
  for (const value of ['Волкова Анна Сергеевна', '12.04.1998', 'AE 204', 'SKY204', '24.10.2026', '4821']) {
    await expect(receipt.getByText(value, { exact: true })).toBeVisible()
  }
  await page.keyboard.press('Escape')
  await expect(receipt).not.toBeVisible()
  await expect(howToPlay).toBeFocused()

  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Давайте знакомиться.' })).toBeVisible()
  for (const label of ['Фамилия', 'Имя', 'Отчество', 'Дата рождения']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('aria-invalid', 'true')
  }
  await expect(page.getByLabel('Фамилия', { exact: true })).toBeFocused()
  await expect(page.getByText('Введите фамилию', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Рейс$/ })).toBeDisabled()

  await fillPassenger(page)
  await page.getByLabel('Фамилия', { exact: true }).fill('  волкова ')
  await page.getByLabel('Имя', { exact: true }).fill('аННа')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await fillFlight(page)
  await page.getByLabel('Код брони', { exact: true }).fill('OTHER1')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Данные не совпадают с квитанцией', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Документ$/ })).toBeDisabled()

  await page.getByLabel('Код брони', { exact: true }).fill(' sky204 ')
  await page.getByLabel('Номер рейса', { exact: true }).fill(' ae204 ')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
  const passport = page.getByLabel('Последние 4 цифры паспорта', { exact: true })
  await passport.fill('0000')
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  await expect(passport).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).not.toBeVisible()

  await passport.fill('4821')
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
  await expect(page.getByText('Волкова Анна Сергеевна', { exact: true })).toBeVisible()
  await expect(page.getByText('14A', { exact: true })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Скачать посадочный талон', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('AVA-SKY204.svg')
  const downloadedPath = testInfo.outputPath(download.suggestedFilename())
  await download.saveAs(downloadedPath)
  const svg = await readFile(downloadedPath, 'utf8')
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(svg).toContain('Волкова Анна Сергеевна')
  expect(svg).toContain('Бронь SKY204')
  await expect(page.getByRole('status')).toHaveText('Талон сохранён в формате SVG')

  await page.getByRole('button', { name: 'Пройти ещё раз' }).click()
  await expect(page.getByRole('heading', { name: 'Давайте знакомиться.' })).toBeVisible()
  for (const label of ['Фамилия', 'Имя', 'Отчество', 'Дата рождения']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('')
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('aria-invalid', 'false')
  }
  await expect(page.getByRole('button', { name: /Рейс$/ })).toBeDisabled()
})

test('возврат назад требует повторной проверки измененных данных', async ({ page }) => {
  await page.goto('/')
  await proceedToDocument(page)
  await page.getByRole('button', { name: /Пассажир$/ }).click()
  await expect(page.getByRole('heading', { name: 'Давайте знакомиться.' })).toBeVisible()
  await page.getByLabel('Фамилия', { exact: true }).fill('Иванова')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByLabel('Фамилия', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /Рейс$/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Документ$/ })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).not.toBeVisible()

  await page.getByLabel('Фамилия', { exact: true }).fill('Волкова')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveValue('SKY204')
  await page.getByLabel('Код брони', { exact: true }).fill('OTHER1')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /Документ$/ })).toBeDisabled()
  await page.getByLabel('Код брони', { exact: true }).fill('SKY204')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
})

const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 768, height: 700 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 640 },
  { width: 844, height: 390 },
]

for (const { width, height } of viewports) {
  test(`страница, ошибки, квитанция и талон без прокрутки на ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'AVA — главная' })).toBeVisible()
    await expect(page.locator('.footer-motto')).toHaveText('AVA MARIA, AVA VICTORIA')
    await expect(page.locator('.footer-motto')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Фамилия', { exact: true })).toBeVisible()
    const canvas = page.locator('.globe-stage canvas')
    await expect(canvas).toBeVisible()
    await expect.poll(() => canvas.evaluate((element) => Number(element.getAttribute('width')) > 0 && Number(element.getAttribute('height')) > 0)).toBe(true)
    await page.locator('body').evaluate(async (element) => { await element.ownerDocument.fonts.ready })
    // Demand-rendered WebGL needs a few frames before saving the visual artifact.
    await canvas.evaluate(async (element) => {
      const view = element.ownerDocument.defaultView
      if (!view) throw new Error('Browser window is unavailable')
      await new Promise<void>((resolve) => {
        let frames = 0
        const tick = () => {
          frames += 1
          if (frames >= 8) resolve()
          else view.requestAnimationFrame(tick)
        }
        view.requestAnimationFrame(tick)
      })
    })
    for (const element of [
      page.locator('.site-header'),
      page.locator('.hero'),
      page.locator('.check-in-card'),
      page.locator('.primary-button'),
      page.locator('.site-footer'),
      canvas,
      page.getByRole('img', { name: 'Молящийся человек за глобусом' }),
    ]) {
      await expectWithinViewport(page, element)
    }
    await expectFormFits(page)
    await mkdir('artifacts', { recursive: true })
    await page.screenshot({ path: `artifacts/AVA-${width}x${height}.png`, animations: 'disabled' })

    await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
    for (const label of ['Фамилия', 'Имя', 'Отчество', 'Дата рождения']) {
      await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('aria-invalid', 'true')
    }
    await expect(page.locator('.field-error')).toHaveCount(4)
    await expectFormFits(page)

    await page.getByRole('button', { name: 'Как играть' }).click()
    const dialog = page.getByRole('dialog')
    await expectWithinViewport(page, dialog)
    await expectWithinViewport(page, dialog.locator('.receipt-paper'))
    await expectWithinViewport(page, dialog.locator('.primary-button'))
    const receiptDimensions = await dialog.evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
      contentWidth: element.scrollWidth,
      contentHeight: element.scrollHeight,
    }))
    expect(receiptDimensions.contentWidth).toBeLessThanOrEqual(receiptDimensions.width + 1)
    expect(receiptDimensions.contentHeight).toBeLessThanOrEqual(receiptDimensions.height + 1)
    await expectNoPageOverflow(page)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()

    await fillPassenger(page)
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
    await expectFormFits(page)
    await fillFlight(page)
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
    await expectFormFits(page)
    await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill('4821')
    await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
    await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
    for (const element of [
      page.locator('.check-in-card'),
      page.locator('.boarding-pass'),
      page.getByRole('button', { name: 'Скачать посадочный талон', exact: true }),
      page.getByRole('button', { name: 'Пройти ещё раз' }),
      page.locator('.site-footer'),
    ]) {
      await expectWithinViewport(page, element)
    }
    await expectNoPageOverflow(page)
  })
}

test('регистрация работает при prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const prefersReducedMotion = await page.locator('body').evaluate((element) => (
    element.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))
  expect(prefersReducedMotion).toBe(true)
  await proceedToDocument(page)
  await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill('4821')
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
  await expectNoPageOverflow(page)
})
