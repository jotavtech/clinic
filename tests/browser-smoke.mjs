import { chromium } from "playwright";
import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
const baseURL = process.env.BASE_URL || "http://127.0.0.1:4173";
const artifacts = process.env.ARTIFACT_DIR || "/tmp/clinic-remodel-artifacts";
mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium")
      ? "/usr/bin/chromium"
      : chromium.executablePath()),
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  timezoneId: "America/Sao_Paulo",
  reducedMotion: "reduce",
});
await page.clock.install({ time: new Date("2026-11-09T15:00:00Z") });
const settings = {
  brandName: "Clínica Executivas",
  tagline: "Cuidado, presença e bem-estar",
  heroTitle: "Seu momento de pausa começa aqui.",
  heroDescription:
    "Desacelere. Encontre o equilíbrio em uma experiência de cuidado pensada para você.",
  heroImageUrl: "",
  aboutTitle: "Um espaço para se sentir bem.",
  aboutDescription:
    "Acreditamos que cuidar de si é uma escolha que transforma o dia. Um ambiente acolhedor, atenção aos detalhes e tempo para você se reconectar com o que importa.",
  aboutImageUrl: "",
  address: "",
  phone: "",
  email: "",
  weekdayStart: "08:30",
  weekdayEnd: "21:00",
  weekendStart: "09:00",
  weekendEnd: "20:00",
  weekendsOpen: true,
};
let services = [],
  loggedIn = false,
  bookingFailure = true,
  galleryFailure = true;
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/*", async (route) => {
  const url = new URL(route.request().url()),
    path = url.pathname,
    method = route.request().method();
  if (url.origin !== new URL(baseURL).origin) return route.abort();
  if (!path.startsWith("/api/")) return route.continue();
  const reply = (status, data) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  const body = () => route.request().postDataJSON();
  if (path === "/api/check-auth")
    return reply(loggedIn ? 200 : 401, { isAuthenticated: loggedIn });
  if (path === "/api/login") {
    if (body().password === "wrong")
      return reply(401, { message: "Credenciais inválidas" });
    loggedIn = true;
    return reply(200, { success: true });
  }
  if (path === "/api/logout") {
    loggedIn = false;
    return reply(200, { success: true });
  }
  if (path === "/api/site-settings") {
    if (method === "PUT") Object.assign(settings, body());
    return reply(200, { settings });
  }
  if (path === "/api/services/manage")
    return reply(loggedIn ? 200 : 401, { services });
  if (path === "/api/services") {
    if (method === "POST") {
      const service = { ...body(), id: services.length + 1 };
      services.push(service);
      return reply(201, { service });
    }
    return reply(200, { services: services.filter((s) => s.active) });
  }
  if (path.startsWith("/api/services/")) {
    const id = Number(path.split("/").at(-1));
    if (method === "DELETE") {
      services = services.filter((s) => s.id !== id);
      return reply(200, { success: true });
    }
    const service = { ...body(), id };
    services = services.map((s) => (s.id === id ? service : s));
    return reply(200, { service });
  }
  if (path === "/api/massagistas")
    return galleryFailure
      ? reply(503, { message: "Indisponível" })
      : reply(200, { massagistas: [] });
  if (path === "/api/appointments") {
    if (method === "GET") return reply(200, { appointments: [] });
    if (bookingFailure)
      return reply(503, { message: "Tente novamente em instantes." });
    return reply(201, { appointment: { id: 1, referralCode: "TESTE123" } });
  }
  return reply(404, { message: "Rota desconhecida" });
});
async function go(path = "/") {
  await page.goto(baseURL + path);
}
async function noOverflow(label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    label,
  );
}
try {
  await go();
  await page.getByText("Novas experiências em breve.").waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Confirmar Agendamento" })
      .isDisabled(),
    true,
  );
  await page
    .getByText("Erro ao carregar profissionais. Tente novamente.")
    .waitFor();
  galleryFailure = false;
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await page.getByText("Nossa equipe, em breve por aqui.").waitFor();
  await noOverflow("Desktop home overflow");
  await go("/login");
  await page.getByLabel("Usuário", { exact: true }).fill("tester");
  await page.getByLabel("Senha", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByText("Credenciais inválidas").first().waitFor();
  await page.getByLabel("Senha", { exact: true }).fill("right");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.getByText("Seu catálogo começa aqui.").waitFor();
  await page.getByRole("button", { name: "Novo serviço", exact: true }).click();
  await page.getByLabel("Nome do serviço").fill("Massagem relaxante");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Um cuidado acolhedor para desacelerar e renovar suas energias.");
  await page.getByLabel("Preço (R$)", { exact: true }).fill("150");
  await page.getByLabel("Duração (minutos)").fill("90");
  await page
    .getByRole("button", { name: "Salvar serviço", exact: true })
    .click();
  await page.getByText("Rascunho", { exact: true }).waitFor();
  await go();
  await page.getByText("Novas experiências em breve.").waitFor();
  assert.equal(
    await page.getByRole("heading", { name: "Massagem relaxante" }).count(),
    0,
  );
  await go("/admin");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Publicar no site").check();
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await page.getByText("Publicado", { exact: true }).waitFor();
  await page.screenshot({ path: `${artifacts}/admin-services.png` });
  await go();
  await page.getByRole("heading", { name: "Massagem relaxante" }).waitFor();
  await page.screenshot({ path: `${artifacts}/home-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Fechar menu" })
      .getAttribute("aria-expanded"),
    "true",
  );
  await page.getByRole("link", { name: "Contato", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar Agendamento" }).click();
  await page
    .getByText("Informe um telefone com DDD e 10 ou 11 dígitos.")
    .waitFor();
  await page.getByRole("link", { name: "Agendar este cuidado" }).click();
  assert.equal(await page.getByLabel("Serviço Desejado").inputValue(), "1");
  await page.getByLabel("Nome Completo").fill("Cliente Teste");
  await page.getByLabel("Telefone/WhatsApp").fill("(83) 99999-1234");
  await page.getByLabel("Data", { exact: true }).fill("2026-12-05");
  assert.equal(
    await page
      .getByLabel("Horário", { exact: true })
      .locator('option[value="08:30"]')
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByLabel("Horário", { exact: true })
      .locator('option[value="19:00"]')
      .count(),
    0,
  ); // 90 min cannot finish before closing
  await page.getByLabel("Horário", { exact: true }).selectOption("09:00");
  await page.getByRole("button", { name: "Confirmar Agendamento" }).click();
  await page.getByText("Tente novamente em instantes.").first().waitFor();
  assert.equal(
    await page.getByLabel("Nome Completo").inputValue(),
    "Cliente Teste",
  );
  bookingFailure = false;
  await page.getByRole("button", { name: "Confirmar Agendamento" }).click();
  await page
    .getByRole("dialog")
    .getByText("TESTE123", { exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByLabel("Nome Completo").inputValue(), "");
  assert.equal(await page.getByLabel("Serviço Desejado").inputValue(), "");
  assert.equal(
    await page.getByLabel("Horário", { exact: true }).inputValue(),
    "",
  );
  await noOverflow("Mobile booking overflow");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${artifacts}/home-mobile.png`,
    fullPage: true,
  });
  await go("/admin");
  await page
    .getByRole("heading", { name: "Serviços & experiências" })
    .waitFor();
  await noOverflow("Mobile admin overflow");
  await page.screenshot({ path: `${artifacts}/admin-mobile.png` });
  await page.getByRole("tab", { name: "Conteúdo do site" }).click();
  await page
    .getByLabel("Título principal")
    .fill("Uma pausa para cuidar de você.");
  await page.getByLabel("WhatsApp (país + DDD + número)").fill("5583999990000");
  await page.getByLabel("Atender aos sábados e domingos").uncheck();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await page
    .getByText("Conteúdo atualizado", { exact: true })
    .first()
    .waitFor();
  await go();
  await page
    .getByRole("heading", { name: "Uma pausa para cuidar de você." })
    .waitFor();
  assert.ok(
    (
      await page
        .getByRole("link", { name: "Contato via WhatsApp" })
        .getAttribute("href")
    ).includes("5583999990000"),
  );
  await page.getByLabel("Serviço Desejado").selectOption("1");
  await page.getByLabel("Data", { exact: true }).fill("2026-12-05");
  await page
    .getByText("Sem horários para esta data. Escolha outro dia.")
    .waitFor();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(`Home overflow ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/admin");
  await page.getByRole("tab", { name: "Conteúdo do site" }).click();
  await page.getByLabel("Título principal").waitFor();
  await page.screenshot({ path: `${artifacts}/admin-content.png` });
  await page.getByRole("tab", { name: "Serviços", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Arquivar", exact: true }).click();
  await page.getByText("Seu catálogo começa aqui.").waitFor();
  await go();
  await page.getByText("Novas experiências em breve.").waitFor();
  await go("/admin");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.waitForURL("**/login");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: empty catalogue, no seeded offers, admin draft/create/publish/archive, live site content/hours, dynamic booking, authoritative duration UI, failure/retry/reset, login/logout, gallery retry and responsive widths 320–1440. No uncaught JS errors.",
  );
} finally {
  await browser.close();
}
