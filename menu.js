document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    const navItems = document.querySelectorAll('nav li');
    const logoName = document.querySelector('.logo h1');
    const menuContainer = document.querySelector('.menu-container');
    const filterItems = document.querySelectorAll('.filters .filter-item');

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

    function fetchProducts() {
        return fetchWithTimeout('http://127.0.0.1:8080/products')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(products => {
                return fetchTags().then(tags => {
                    const productObjects = products.map(productData => new Product(
                        productData.id,
                        productData.name,
                        productData.price,
                        productData.tag_id  // Include tag information
                    ));
                    return { products: productObjects, tags };
                });
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                alert(`Failed to fetch products: ${error.message}`);
                return { products: [], tags: [] };
            });
    }

    function fetchTags() {
        return fetchWithTimeout('http://127.0.0.1:8080/tags')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching tags:', error);
                alert(`Failed to fetch tags: ${error.message}`);
                return [];
            });
    }

    function renderMenuItems(products) {
        menuContainer.innerHTML = ''; // Clear existing items

        products.forEach(product => {
            const productElement = product.generate(); // Use the generate method
            menuContainer.appendChild(productElement);
        });
    }

    function applyFilter(tagId, products) {
        const filteredProducts = products.filter(product => product.tag === parseInt(tagId) || tagId === 'all');
        renderMenuItems(filteredProducts);
    }
    

    // Fetch products and tags, then render menu items and set up filters
    fetchProducts().then(({ products, tags }) => {
        renderMenuItems(products);

        // Setup filter click events
        filterItems.forEach(filter => {
            filter.addEventListener('click', function () {
                const tagId = this.dataset.tagId;  // Get tag id from data attribute
                applyFilter(tagId, products);
            });
        });
    });
});

class Product {
    constructor(id, name, price, tag) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.tag = tag;  // Store tag information
    }

    generate() {
        // Create the container element
        const container = document.createElement('div');
        container.classList.add('menu-item');

        // Create the image element
        const img = document.createElement('img');
        img.src = `http://127.0.0.1:8080/images/${this.id}.png`; // Construct the image URL using product ID
        img.alt = this.name;
        img.loading = 'lazy';

        // Create the name element
        const nameElement = document.createElement('h3');
        nameElement.textContent = this.name;

        // Create the price element
        const priceElement = document.createElement('h5');
        priceElement.textContent = `${this.price} BHD`;

        // Append all elements to the container
        container.appendChild(img);
        container.appendChild(nameElement);
        container.appendChild(priceElement);

        // Return the container for further manipulation if needed
        return container;
    }
}

