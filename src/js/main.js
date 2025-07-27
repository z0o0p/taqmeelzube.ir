let carouselCurrentCard = 0;

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

function initializeCarousel() {
    const passionCard = document.getElementById("passion-card");
    const expertiseCard = document.getElementById("expertise-card");
    const interestsCard = document.getElementById("interests-card");

    passionCard.style.display = 'flex';
    expertiseCard.style.display = 'none';
    interestsCard.style.display = 'none';
}

function changeCarouselCurrentSlide(offset) {
    const passionCard = document.getElementById("passion-card");
    const expertiseCard = document.getElementById("expertise-card");
    const interestsCard = document.getElementById("interests-card");
    const passionDot = document.getElementById("passion-dot");
    const expertiseDot = document.getElementById("expertise-dot");
    const interestsDot = document.getElementById("interests-dot");

    carouselCurrentCard = (carouselCurrentCard + offset + 3) % 3;

    passionCard.style.display = 'none';
    expertiseCard.style.display = 'none';
    interestsCard.style.display = 'none';
    passionDot.classList.remove('active');
    expertiseDot.classList.remove('active');
    interestsDot.classList.remove('active');

    if (carouselCurrentCard === 0) {
        passionCard.style.display = 'flex';
        passionDot.classList.add('active');
    } else if (carouselCurrentCard === 1) {
        expertiseCard.style.display = 'flex';
        expertiseDot.classList.add('active');
    } else if (carouselCurrentCard === 2) {
        interestsCard.style.display = 'flex';
        interestsDot.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeHeroEffect();
    initializeGame();
    initializeCarousel()
    document.getElementById("copyright-year").textContent = new Date().getFullYear();
});
