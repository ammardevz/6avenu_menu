document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    const navItems = document.querySelectorAll('nav li');
    const logoName = document.querySelector('.logo h1');
    const menuContainer = document.querySelector('.menu-container');

    function fetchWithTimeout(url, options, timeout = 8000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
    });

    if (hamburger && nav && navItems.length) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');

            // Animate nav items
            navItems.forEach((item, index) => {
                if (item.style.animation) {
                    item.style.animation = '';
                } else {
                    item.style.animation = `navItemFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
        });
    }
});
