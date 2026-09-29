// system/utils.js — Funções utilitárias vanilla JS que substituem o jQuery
// Este arquivo é próprio do ruleset WOD5e e NÃO toca no core do Loom.
// Criei para resolver o problema de compatibilidade jQuery → Loom.
// ---------------------------------------------------------

/** 📍 Seletores CSS (equivalente a $()) */
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return context.querySelectorAll(selector);
}

/** 👁️ Manipulação de exibição (equivalente a .hide(), .show(), .toggle()) */
export function hide(element) {
  if (element) element.style.display = 'none';
}

export function show(element) {
  if (element) element.style.display = '';
}

export function toggle(element) {
  if (element) element.style.display = element.style.display === 'none' ? '' : 'none';
}

/** 📝 Valores de formulário (equivalente a .val()) */
export function val(element) {
  return element ? element.value : '';
}

export function setVal(element, value) {
  if (element) element.value = value;
}

/** 📄 Conteúdo de texto (equivalente a .text(), .html()) */
export function text(element, content) {
  if (element) element.textContent = content;
}

export function html(element, content) {
  if (element) element.innerHTML = content;
}

/** 📦 Eventos (equivalente a .on(), .off(), .trigger()) */
export function on(element, event, handler) {
  if (element) element.addEventListener(event, handler);
}

export function off(element, event, handler) {
  if (element) element.removeEventListener(event, handler);
}

export function trigger(element, event) {
  if (element) element.dispatchEvent(new Event(event));
}

/** 📊 Iteração sobre coleções (equivalente a .each()) */
export function each(collection, callback) {
  if (!collection) return;
  if (collection.length === undefined) {
    callback.call(collection, 0, collection);
  } else {
    for (let i = 0; i < collection.length; i++) {
      callback.call(collection[i], i, collection[i]);
    }
  }
}

/** ⏱️ Animações simples de fade (equivalente a .fadeIn(), .fadeOut()) */
export function fadeIn(element, duration = 250) {
  if (!element) return;
  element.style.display = 'block';
  let opacity = 0;
  const interval = duration / 10;
  const id = setInterval(() => {
    opacity += 0.1;
    element.style.opacity = opacity;
    if (opacity >= 1) {
      clearInterval(id);
      element.style.opacity = 1;
    }
  }, interval);
}

export function fadeOut(element, duration = 250) {
  if (!element) return;
  const interval = duration / 10;
  const id = setInterval(() => {
    opacity -= 0.1;
    element.style.opacity = opacity;
    if (opacity <= 0) {
      clearInterval(id);
      element.style.display = 'none';
      element.style.opacity = 0;
    }
  }, interval);
}

/** 🌐 Requisições API (equivalente a $.ajax(), $.get(), $.post()) */
export function get(url) {
  return fetch(url, { method: 'GET' })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
}

export function post(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    });
}
// ---------------------------------------------------------