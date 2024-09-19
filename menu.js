document.addEventListener('DOMContentLoaded', function () {
    const menuContainer = document.querySelector('.menu-container');
    const filterItems = document.querySelectorAll('.filters .filter-item');

    // Function to handle fetch with a timeout
    function fetchWithTimeout(url, options, timeout = 8000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    // Fetch products and categories from the API
    function fetchProducts() {
        return fetchWithTimeout('https://coffee-api-bold-moon-8315.fly.dev/products')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(products => {
                return fetchCategories().then(categories => {
                    const productObjects = products.map(productData => new Product(
                        productData.id,
                        productData.name,
                        parseFloat(productData.price).toFixed(2),
                        productData.category_id || 0,
                        productData.created_at
                    ));
                    return { products: productObjects, categories: categories };
                });
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                alert(`Failed to fetch products: ${error.message}`);
                return { products: [], categories: [] };
            });
    }

    // Fetch categories
    function fetchCategories() {
        return fetchWithTimeout('https://coffee-api-bold-moon-8315.fly.dev/categories')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
                alert(`Failed to fetch categories: ${error.message}`);
                return [];
            });
    }

    // Render menu items into the DOM
    function renderMenuItems(products) {
        menuContainer.innerHTML = '';
        products.forEach(product => {
            const productElement = product.generate();
            menuContainer.appendChild(productElement);
        });
    }

    // Apply filter based on category
    function applyFilter(categoryId, products) {
        const filteredProducts = products.filter(product => 
            categoryId === 'all' || product.category_id === parseInt(categoryId)
        );
        renderMenuItems(filteredProducts);
    }

    // Fetch products and categories, then render menu items and set up filters
    fetchProducts().then(({ products, categories }) => {
        renderMenuItems(products);

        // Setup filter click events
        filterItems.forEach(filter => {
            filter.addEventListener('click', function () {
                const categoryId = this.dataset.tagId; // Use data-tag-id
                applyFilter(categoryId, products);
            });
        });
    });
});

// Updated Product class
class Product {
    constructor(id, name, price, category_id, created_at) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category_id = category_id;
        this.created_at = created_at;
    }

    generate() {
        const container = document.createElement('div');
        container.classList.add('menu-item');

        const img = document.createElement('img');
        img.src = `https://coffee-api-bold-moon-8315.fly.dev/images/${this.id}.png`;
        img.alt = this.name;
        img.loading = 'lazy';

        const nameElement = document.createElement('h3');
        nameElement.textContent = this.name;

        const priceElement = document.createElement('h5');
        priceElement.textContent = `${this.price} BHD`;

        container.appendChild(img);
        container.appendChild(nameElement);
        container.appendChild(priceElement);

        return container;
    }
}
