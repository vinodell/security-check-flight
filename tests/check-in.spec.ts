import { mkdir, readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

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

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.locator('html').evaluate((element) => ({
    viewport: element.clientWidth,
    content: Math.max(element.scrollWidth, element.ownerDocument.body.scrollWidth),
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
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
  expect(download.suggestedFilename()).toBe('Aero-SKY204.svg')
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

for (const width of [375, 768, 1440, 1920]) {
  test(`адаптивная страница и 3D на ширине ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 1000 ? 900 : 1100 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Фамилия', { exact: true })).toBeVisible()
    const canvas = page.locator('.globe-stage canvas')
    await expect(canvas).toBeVisible()
    await expect.poll(() => canvas.evaluate((element) => Number(element.getAttribute('width')) > 0 && Number(element.getAttribute('height')) > 0)).toBe(true)
    await page.locator('body').evaluate(async (element) => { await element.ownerDocument.fonts.ready })
    // Let the initial demand-rendered camera movement settle before saving the visual artifact.
    await canvas.evaluate(async (element) => {
      const view = element.ownerDocument.defaultView
      if (!view) throw new Error('Browser window is unavailable')
      await new Promise<void>((resolve) => {
        let frames = 0
        const tick = () => {
          frames += 1
          if (frames >= 45) resolve()
          else view.requestAnimationFrame(tick)
        }
        view.requestAnimationFrame(tick)
      })
    })
    await expectNoHorizontalOverflow(page)
    await mkdir('artifacts', { recursive: true })
    await page.screenshot({ path: `artifacts/aero-${width}.png`, fullPage: true, animations: 'disabled' })

    await page.getByRole('button', { name: 'Как играть' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    if (bounds) {
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    }
    await expectNoHorizontalOverflow(page)
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
  await expectNoHorizontalOverflow(page)
})
