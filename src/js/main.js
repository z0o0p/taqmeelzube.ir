function initializeHeroEffect() {
    const hero = document.querySelector('.hero');
    const nameElement = document.querySelector('.name-gradient');

    if (hero && nameElement) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            nameElement.style.backgroundPosition = `${x}% ${y}%`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeHeroEffect();
    initializeGame();
    document.getElementById("copyright-year").textContent = new Date().getFullYear();
});
