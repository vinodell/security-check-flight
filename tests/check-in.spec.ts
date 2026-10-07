import { mkdir, readFile } from 'node:fs/promises'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { EXPECTED_BOOKING, FLIGHT } from '../src/domain/checkIn'
import { formatDate } from '../src/domain/formatDate'

const passengerName = `${EXPECTED_BOOKING.lastName} ${EXPECTED_BOOKING.firstName} ${EXPECTED_BOOKING.middleName}`
const downloadJokeText = 'А нахуя ты скачиваешь, если он перед тобой лежит?'

async function fillPassenger(page: Page) {
  await page.getByLabel('Фамилия', { exact: true }).fill(EXPECTED_BOOKING.lastName)
  await page.getByLabel('Имя', { exact: true }).fill(EXPECTED_BOOKING.firstName)
  await page.getByLabel('Отчество', { exact: true }).fill(EXPECTED_BOOKING.middleName)
  await page.getByLabel('Дата рождения', { exact: true }).fill(EXPECTED_BOOKING.birthDate)
}

async function fillFlight(page: Page) {
  await page.getByLabel('Номер рейса', { exact: true }).fill(EXPECTED_BOOKING.flightNumber)
  await page.getByLabel('Код брони', { exact: true }).fill(EXPECTED_BOOKING.bookingCode)
  await page.getByLabel('Дата вылета', { exact: true }).fill(EXPECTED_BOOKING.departureDate)
}

async function proceedToDocument(page: Page) {
  await fillPassenger(page)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await fillFlight(page)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
}

async function expectSecurityGate(page: Page) {
  const dialog = page.locator('.security-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('data-phase', 'gate')
  await expect(dialog.locator('.security-gate-code')).toHaveText(FLIGHT.gate)
  await expect(dialog.locator('.security-ticket-half--left')).toBeVisible()
  await expect(dialog.locator('.security-ticket-half--right')).toBeVisible()
  return dialog
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

async function expectDownloadJoke(page: Page) {
  const dialog = page.locator('.download-joke-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: downloadJokeText, exact: true })).toBeVisible()
  const image = dialog.getByRole('img', { name: 'Зачем скачивать билет?', exact: true })
  await expect(image).toHaveAttribute('src', /why\.webp$/)
  await expect.poll(() => image.evaluate((element) => {
    const picture = element as HTMLImageElement
    return picture.complete && picture.naturalWidth > 0
  })).toBe(true)
  await expect.poll(() => dialog.locator('.download-joke-content').evaluate((element) => {
    const transform = element.ownerDocument.defaultView?.getComputedStyle(element).transform
    if (!transform || transform === 'none') return true
    const matrix = new DOMMatrixReadOnly(transform)
    return Math.abs(matrix.m42) < 0.1 && Math.abs(matrix.a - 1) < 0.01
  }), { message: 'Шутка завершила анимацию появления перед проверкой размеров' }).toBe(true)
  await expectWithinViewport(page, dialog)
  await expectWithinViewport(page, image)
  await expectWithinViewport(page, dialog.getByRole('button', { name: 'Ладно, понял', exact: true }))
  await expectWithinViewport(page, dialog.getByRole('button', { name: 'Всё равно скачать', exact: true }))
  const dimensions = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
    contentWidth: element.scrollWidth,
    contentHeight: element.scrollHeight,
  }))
  expect(dimensions.contentWidth, 'Шутка не требует горизонтальной прокрутки').toBeLessThanOrEqual(dimensions.width + 1)
  expect(dimensions.contentHeight, 'Шутка не требует вертикальной прокрутки').toBeLessThanOrEqual(dimensions.height + 1)
  await expectNoPageOverflow(page)
  return dialog
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
  for (const value of [passengerName, formatDate(EXPECTED_BOOKING.birthDate), EXPECTED_BOOKING.flightNumber, EXPECTED_BOOKING.bookingCode, formatDate(EXPECTED_BOOKING.departureDate), EXPECTED_BOOKING.passportLastFour]) {
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
  await page.getByLabel('Фамилия', { exact: true }).fill(`  ${EXPECTED_BOOKING.lastName.toLocaleLowerCase('ru-RU')} `)
  await page.getByLabel('Имя', { exact: true }).fill(EXPECTED_BOOKING.firstName.toLocaleUpperCase('ru-RU'))
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await fillFlight(page)
  await page.getByLabel('Код брони', { exact: true }).fill('OTHER1')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Данные не совпадают с квитанцией', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Документ$/ })).toBeDisabled()

  await page.getByLabel('Код брони', { exact: true }).fill(` ${EXPECTED_BOOKING.bookingCode.toLowerCase()} `)
  await page.getByLabel('Номер рейса', { exact: true }).fill(` ${EXPECTED_BOOKING.flightNumber.toLowerCase().replace(/\s/g, '')} `)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
  const passport = page.getByLabel('Последние 4 цифры паспорта', { exact: true })
  await passport.fill('0000')
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  await expect(passport).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).not.toBeVisible()

  await passport.fill(EXPECTED_BOOKING.passportLastFour)
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  const securityDialog = await expectSecurityGate(page)
  await page.keyboard.press('Escape')
  await expect(securityDialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
  await expect(page.getByText(passengerName, { exact: true })).toBeVisible()
  await expect(page.getByText(FLIGHT.seat, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Скачать посадочный талон', exact: true }).click()
  const downloadJoke = await expectDownloadJoke(page)
  const downloadPromise = page.waitForEvent('download')
  await downloadJoke.getByRole('button', { name: 'Всё равно скачать', exact: true }).click()
  const download = await downloadPromise
  await expect(downloadJoke).not.toBeVisible()
  expect(download.suggestedFilename()).toBe(`${FLIGHT.airline}-${EXPECTED_BOOKING.bookingCode}.svg`)
  const downloadedPath = testInfo.outputPath(download.suggestedFilename())
  await download.saveAs(downloadedPath)
  const svg = await readFile(downloadedPath, 'utf8')
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(svg).toContain(passengerName)
  expect(svg).toContain(`Бронь ${EXPECTED_BOOKING.bookingCode}`)
  await expect(page.getByRole('status')).toHaveText('Талон сохранён в формате SVG')

  await page.getByRole('button', { name: 'Пройти ещё раз' }).click()
  await expect(page.getByRole('heading', { name: 'Давайте знакомиться.' })).toBeVisible()
  for (const label of ['Фамилия', 'Имя', 'Отчество', 'Дата рождения']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('')
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('aria-invalid', 'false')
  }
  await expect(page.getByRole('button', { name: /Рейс$/ })).toBeDisabled()
})

test('скачивание сначала показывает шутку; закрытие не скачивает билет и возвращает фокус', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await proceedToDocument(page)
  await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill(EXPECTED_BOOKING.passportLastFour)
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  const securityDialog = await expectSecurityGate(page)
  await securityDialog.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(securityDialog).not.toBeVisible()

  let downloadCount = 0
  page.on('download', () => { downloadCount += 1 })
  const downloadButton = page.getByRole('button', { name: 'Скачать посадочный талон', exact: true })
  await downloadButton.click()
  const joke = await expectDownloadJoke(page)
  expect(downloadCount, 'Открытие шутки не скачивает билет').toBe(0)
  await expect(page.getByRole('status')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(joke).not.toBeVisible()
  await expect(downloadButton).toBeFocused()

  await downloadButton.click()
  await expectDownloadJoke(page)
  await joke.getByRole('button', { name: 'Ладно, понял', exact: true }).click()
  await expect(joke).not.toBeVisible()
  await expect(downloadButton).toBeFocused()

  await downloadButton.click()
  await expectDownloadJoke(page)
  await joke.getByRole('button', { name: 'Закрыть шутку', exact: true }).click()
  await expect(joke).not.toBeVisible()
  await expect(downloadButton).toBeFocused()

  await downloadButton.click()
  await expectDownloadJoke(page)
  await page.mouse.click(1, 1)
  await expect(joke).not.toBeVisible()
  await expect(downloadButton).toBeFocused()
  expect(downloadCount, 'Закрытие любым способом не скачивает билет').toBe(0)

  await downloadButton.click()
  await expectDownloadJoke(page)
  const downloadPromise = page.waitForEvent('download')
  await joke.getByRole('button', { name: 'Всё равно скачать', exact: true }).click()
  await downloadPromise
  await expect(joke).not.toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Талон сохранён в формате SVG')
  const repeatDownload = page.getByRole('button', { name: 'Скачать ещё раз', exact: true })
  await expect(repeatDownload).toBeFocused()
  await repeatDownload.click()
  await expectDownloadJoke(page)
  expect(downloadCount, 'Повторное открытие шутки не скачивает ещё один билет').toBe(1)
  await joke.getByRole('button', { name: 'Ладно, понял', exact: true }).click()
  await expect(joke).not.toBeVisible()
  await expect(repeatDownload).toBeFocused()
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

  await page.getByLabel('Фамилия', { exact: true }).fill(EXPECTED_BOOKING.lastName)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Найдём ваш рейс.' })).toBeVisible()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveValue(EXPECTED_BOOKING.bookingCode)
  await page.getByLabel('Код брони', { exact: true }).fill('OTHER1')
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByLabel('Код брони', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /Документ$/ })).toBeDisabled()
  await page.getByLabel('Код брони', { exact: true }).fill(EXPECTED_BOOKING.bookingCode)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Последняя проверка.' })).toBeVisible()
})

test('успешная регистрация запускает сирены, разрыв билета и приближение к выходу', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await proceedToDocument(page)
  await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill(EXPECTED_BOOKING.passportLastFour)
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()

  const dialog = page.locator('.security-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('data-phase', 'arriving')
  await expect(dialog.locator('.security-siren--red')).toBeVisible()
  await expect(dialog.locator('.security-siren--blue')).toBeVisible()
  const ticketSurfaces = dialog.locator('.security-ticket-surface')
  await expect(ticketSurfaces).toHaveCount(2)
  for (const surface of await ticketSurfaces.all()) {
    await expect(surface).toHaveCSS('background-image', /ticket\.jpg/)
  }
  await expect(dialog).toHaveAttribute('data-phase', 'torn')
  await expectSecurityGate(page)
  await expect(dialog.getByRole('img', { name: `Билет AVA разорван пополам. GATE ${FLIGHT.gate}.`, exact: true })).toBeVisible()
  await expect.poll(() => dialog.locator('.security-ticket-camera').evaluate((element) => {
    const transform = element.ownerDocument.defaultView?.getComputedStyle(element).transform
    return transform ? new DOMMatrixReadOnly(transform).a : 1
  })).toBeGreaterThan(1.5)
  await expectWithinViewport(page, dialog)
  await expectNoPageOverflow(page)
  await dialog.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
  const replay = page.getByRole('button', { name: 'Повторить security check', exact: true })
  await replay.click()
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('data-phase', 'arriving')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(replay).toBeFocused()
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
    await expect(page.getByRole('link', { name: `${FLIGHT.airline} — главная` })).toBeVisible()
    await expect(page.locator('.footer-motto')).toHaveText(FLIGHT.motto)
    await expect(page.locator('.footer-motto')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel('Фамилия', { exact: true })).toBeVisible()
    await expect(page.locator('.globe-origin strong')).toHaveText('LED')
    await expect(page.locator('.globe-destination strong')).toHaveText('HND')
    await expect(page.locator('.globe-stage')).toHaveAttribute('aria-label', /LED.*(?:HND|Токио)/)
    await expect(page.locator('.flight-strip .strip-route')).toContainText(FLIGHT.displayDestination)
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
    await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill(EXPECTED_BOOKING.passportLastFour)
    await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
    const securityDialog = await expectSecurityGate(page)
    await expectWithinViewport(page, securityDialog)
    await expectWithinViewport(page, securityDialog.locator('.security-gate-code'))
    await expectWithinViewport(page, securityDialog.getByRole('button', { name: 'Продолжить', exact: true }))
    const securityDimensions = await securityDialog.evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
      contentWidth: element.scrollWidth,
      contentHeight: element.scrollHeight,
    }))
    expect(securityDimensions.contentWidth).toBeLessThanOrEqual(securityDimensions.width + 1)
    expect(securityDimensions.contentHeight).toBeLessThanOrEqual(securityDimensions.height + 1)
    await expectNoPageOverflow(page)
    await page.screenshot({ path: `artifacts/AVA-security-${width}x${height}.png`, animations: 'disabled' })
    await securityDialog.getByRole('button', { name: 'Продолжить', exact: true }).click()
    await expect(securityDialog).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
    for (const element of [
      page.locator('.check-in-card'),
      page.locator('.boarding-pass'),
      page.getByRole('button', { name: 'Скачать посадочный талон', exact: true }),
      page.getByRole('button', { name: 'Повторить security check', exact: true }),
      page.getByRole('button', { name: 'Пройти ещё раз' }),
      page.locator('.site-footer'),
    ]) {
      await expectWithinViewport(page, element)
    }
    await expectNoPageOverflow(page)
    const downloadButton = page.getByRole('button', { name: 'Скачать посадочный талон', exact: true })
    await downloadButton.click()
    const joke = await expectDownloadJoke(page)
    await expect.poll(() => joke.evaluate((element) => (
      element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length
    ))).toBe(0)
    await page.screenshot({ path: `artifacts/AVA-download-joke-${width}x${height}.png`, animations: 'disabled' })
    await joke.getByRole('button', { name: 'Ладно, понял', exact: true }).click()
    await expect(joke).not.toBeVisible()
    await expect(downloadButton).toBeFocused()
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
  await page.getByLabel('Последние 4 цифры паспорта', { exact: true }).fill(EXPECTED_BOOKING.passportLastFour)
  await page.getByRole('button', { name: 'Получить посадочный талон' }).click()
  const securityDialog = await expectSecurityGate(page)
  await securityDialog.getByRole('button', { name: 'Закрыть проверку безопасности', exact: true }).click()
  await expect(securityDialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вы на борту.' })).toBeVisible()
  await expectNoPageOverflow(page)
})

async function expectPhoneEntryGate(page: Page) {
  const dialog = page.locator('.desktop-required-dialog')
  await expect(dialog).toBeVisible()
  await page.evaluate(async () => { await document.fonts.ready })
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Phone viewport is unavailable')
  // Mobile rotation and the entrance transition settle on browser frames after
  // setViewportSize/showModal, so assert their finished layout before measuring.
  await expect.poll(() => dialog.evaluate((element, expectedViewport) => {
    const view = element.ownerDocument.defaultView
    const content = element.querySelector('.desktop-required-content')
    if (!view || !content) return false
    const transform = view.getComputedStyle(content).transform
    const entranceY = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
    const bounds = element.getBoundingClientRect()
    return view.innerWidth === expectedViewport.width
      && view.innerHeight === expectedViewport.height
      && Math.abs(entranceY) < 0.1
      && bounds.x >= -1 && bounds.y >= -1
      && bounds.right <= expectedViewport.width + 1
      && bounds.bottom <= expectedViewport.height + 1
  }, viewport), { message: 'Модалка завершила появление и перестроилась под поворот телефона' }).toBe(true)
  await expectWithinViewport(page, dialog)
  await expect(dialog.getByRole('heading', { name: 'Проверка только на компьютере.' })).toBeVisible()
  const image = dialog.getByRole('img', { name: 'Сотрудник службы безопасности' })
  await expect(image).toHaveAttribute('src', /security\.jpg$/)
  await expect.poll(() => image.evaluate((element) => {
    const picture = element as HTMLImageElement
    return picture.complete && picture.naturalWidth > 0
  })).toBe(true)
  await expectWithinViewport(page, image)
  await expectWithinViewport(page, dialog.getByRole('button', { name: /Скопировать ссылку|Ссылка скопирована/ }))
  await expect.poll(() => page.getByLabel('Фамилия', { exact: true }).evaluate((element) => (
    element.closest('[inert]') !== null
  ))).toBe(true)
  await expect(page.getByLabel('Фамилия', { exact: true })).toHaveValue('')
  await expect(page.locator('.globe-stage canvas')).toHaveCount(0)
  const dimensions = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
    contentWidth: element.scrollWidth,
    contentHeight: element.scrollHeight,
  }))
  expect(dimensions.contentWidth, 'Телефонная модалка не требует горизонтальной прокрутки').toBeLessThanOrEqual(dimensions.width + 1)
  expect(dimensions.contentHeight, 'Телефонная модалка не требует вертикальной прокрутки').toBeLessThanOrEqual(dimensions.height + 1)
  await expectNoPageOverflow(page)
  return dialog
}

test('телефон Android: security.jpg, блокировка регистрации и копирование ссылки сохраняются при повороте', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const dialog = await expectPhoneEntryGate(page)
    await expect(dialog.locator('.security-siren--red')).toBeVisible()
    await expect(dialog.locator('.security-siren--blue')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
    await page.mouse.click(1, 1)
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Tab')
    await expect.poll(() => dialog.evaluate((element) => (
      element.contains(element.ownerDocument.activeElement)
    ))).toBe(true)

    await dialog.getByRole('button', { name: 'Скопировать ссылку', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Ссылка скопирована', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url())

    await page.setViewportSize({ width: 844, height: 390 })
    await expectPhoneEntryGate(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
    await expect(page.locator('.security-dialog:not(.desktop-required-dialog)')).toHaveCount(0)
  } finally {
    await context.close()
  }
})

test('телефон iPhone: reduced motion оставляет статичную проверку в обоих положениях экрана', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 844, height: 390 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const dialog = await expectPhoneEntryGate(page)
    await expect(dialog.locator('.security-siren--red')).toBeVisible()
    await expect(dialog.locator('.security-siren--blue')).toBeVisible()
    await expect.poll(() => dialog.evaluate((element) => (
      element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length
    ))).toBe(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()

    await page.setViewportSize({ width: 375, height: 667 })
    await expectPhoneEntryGate(page)
    await expect(dialog).toBeVisible()
    await expect.poll(() => dialog.evaluate((element) => (
      element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length
    ))).toBe(0)
  } finally {
    await context.close()
  }
})

test('телефон с десктопным User-Agent всё равно требует компьютер', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 375, height: 667 },
    screen: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgentData', { value: { mobile: false }, configurable: true })
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => (
      !/iPhone|Android.*Mobile/.test(navigator.userAgent)
      && window.matchMedia('(pointer: coarse) and (hover: none)').matches
      && Math.min(window.screen.width, window.screen.height) <= 640
    ))).toBe(true)
    await expectPhoneEntryGate(page)
    await page.setViewportSize({ width: 844, height: 390 })
    await expectPhoneEntryGate(page)
  } finally {
    await context.close()
  }
})
