// Самоперевірка кроків (прогрес у localStorage) і таймер тренувального туру.
(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* приватний режим */ } },
  };

  document.querySelectorAll(".check").forEach((box) => {
    const mod = box.dataset.module;
    const inputs = [...box.querySelectorAll("input")];
    const bar = document.querySelector(`[data-bar="${mod}"]`);
    const update = () => {
      const done = inputs.filter((i) => i.checked).length;
      if (bar) bar.style.width = (100 * done / inputs.length) + "%";
    };
    inputs.forEach((i) => {
      i.checked = store.get("polar-" + i.dataset.key) === "1";
      i.addEventListener("change", () => { store.set("polar-" + i.dataset.key, i.checked ? "1" : "0"); update(); });
    });
    update();
  });

  const clock = document.getElementById("clock");
  if (!clock) return;
  let total = 240 * 60, left = total, timer = null;
  const fmt = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  const draw = () => { clock.textContent = fmt(left); clock.classList.toggle("done", left === 0); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-min]").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel");
    stop(); total = left = +b.dataset.min * 60; draw();
  }));
  document.getElementById("tstart").addEventListener("click", () => {
    if (timer || left === 0) return;
    timer = setInterval(() => { left = Math.max(0, left - 1); draw(); if (!left) stop(); }, 1000);
  });
  document.getElementById("tpause").addEventListener("click", stop);
  document.getElementById("treset").addEventListener("click", () => { stop(); left = total; draw(); });
  document.querySelector('[data-min="240"]').classList.add("sel");
  draw();
})();

// Здача роботи: формує лист учителю (mailto) з даними учня та результатом самоперевірки.
document.querySelectorAll(".sub-form").forEach((f) => {
  const msg = f.parentElement.querySelector(".sub-msg");
  try { const saved = JSON.parse(localStorage.getItem("polar-student") || "{}"); ["name", "school", "to"].forEach((k) => { if (saved[k]) f.elements[k].value = saved[k]; }); } catch (e) { /* без збереження */ }
  const letter = () => {
    const v = Object.fromEntries(new FormData(f));
    try { localStorage.setItem("polar-student", JSON.stringify({ name: v.name, school: v.school, to: v.to })); } catch (e) { /* приватний режим */ }
    const boxes = [...document.querySelectorAll(`.check[data-module="${f.dataset.module}"] input`)];
    const done = boxes.filter((b) => b.checked).length;
    const pts = boxes.filter((b) => b.checked).reduce((a, b) => a + (parseInt(b.parentElement.querySelector('.pts')?.textContent) || 0), 0);
    const subject = `Полярна олімпіада — ${f.dataset.title} — ${v.name}`;
    const body = [
      "Доброго дня!",
      "",
      `Надсилаю розв'язок модуля «${f.dataset.title}».`,
      `Учень: ${v.name}`,
      `Клас, школа: ${v.school}`,
      v.time ? `Витрачений час: ${v.time} хв` : null,
      `Самоперевірка: виконано ${done} з ${boxes.length} пунктів критеріїв (≈${pts} з 100 балів)`,
      v.note ? `Коментар: ${v.note}` : null,
      "",
      "Файли розв'язку — у вкладенні.",
    ].filter((x) => x !== null).join("\n");
    return { to: v.to, subject, body };
  };
  const enc = encodeURIComponent;
  const hint = "Прикріпіть файли розв'язку (значок скріпки) і натисніть «Надіслати».";
  // Gmail у новій вкладці — працює без поштової програми на комп'ютері
  f.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const l = letter();
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${enc(l.to)}&su=${enc(l.subject)}&body=${enc(l.body)}`, "_blank", "noopener");
    msg.textContent = "Gmail відкрито в новій вкладці з готовим листом. " + hint;
  });
  f.querySelector("[data-act=mailto]").addEventListener("click", () => {
    if (!f.reportValidity()) return;
    const l = letter();
    location.href = `mailto:${enc(l.to)}?subject=${enc(l.subject)}&body=${enc(l.body)}`;
    msg.textContent = "Якщо поштова програма не відкрилася — скористайтеся кнопкою «Надіслати через Gmail» або «Скопіювати лист».";
  });
  f.querySelector("[data-act=copy]").addEventListener("click", async () => {
    if (!f.reportValidity()) return;
    const l = letter();
    const text = `Кому: ${l.to}\nТема: ${l.subject}\n\n${l.body}`;
    try { await navigator.clipboard.writeText(text); msg.textContent = "Лист скопійовано. Вставте його в будь-яку пошту (Ctrl+V). " + hint; }
    catch (e) { msg.textContent = text; }
  });
});
