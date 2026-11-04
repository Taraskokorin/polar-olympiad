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
