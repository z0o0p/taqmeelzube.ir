function initializeNavigation() {
  const links = [...document.querySelectorAll('.site-nav-link')];
  let navResetTimer;
  const reactToItem = (item, reset = true, state = 'navigation') => {
    const rect = item.getBoundingClientRect();
    window.clearTimeout(navResetTimer);
    requestPortraitExpression(state, {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    if (reset) navResetTimer = window.setTimeout(() => requestPortraitExpression('idle'), 1100);
  };
  links.forEach(link => {
    link.addEventListener('click', () => reactToItem(link));
    link.addEventListener('mouseenter', () => reactToItem(link, false));
    link.addEventListener('mouseleave', () => requestPortraitExpression('idle'));
    link.addEventListener('focus', () => reactToItem(link, false));
    link.addEventListener('blur', () => requestPortraitExpression('idle'));
  });
  const surprise = document.querySelector('.surprise-trigger');
  surprise?.addEventListener('mouseenter', () => reactToItem(surprise, false, 'excited'));
  surprise?.addEventListener('mouseleave', () => requestPortraitExpression('idle'));
  surprise?.addEventListener('focus', () => reactToItem(surprise, false, 'excited'));
  surprise?.addEventListener('blur', () => requestPortraitExpression('idle'));
}

function initializeHeroGradient() {
  const hero = document.querySelector('.hero');
  const name = document.querySelector('.name-gradient');
  if (!hero || !name) return;
  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    name.style.backgroundPosition = `${x}% ${y}%`;
  });
}

function initializeGameDialog() {
  const dialog = document.getElementById('game-dialog');
  const closeButton = dialog?.querySelector('.dialog-close');
  const triggers = document.querySelectorAll('.surprise-trigger');
  if (!dialog || !closeButton) return;

  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    requestPortraitExpression(gameState.aiThinking ? 'thinking' : 'curious');
    dialog.showModal();
  }));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener('close', () => requestPortraitExpression('idle'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('copyright-year').textContent = new Date().getFullYear();
  initializeNavigation();
  initializeHeroGradient();
  initializeGame();
  initializeGameDialog();
  initializeCaricature();
});
