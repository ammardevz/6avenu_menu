document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    const body = document.body;
    const freezeSection = document.querySelector('.freeze');
    const editor = document.querySelector('.editor');
    const editorCloseBtn = editor.querySelector('.fa-times');
    const nameInput = document.querySelector('#productNameInput');
    const priceInput = document.querySelector('#productPriceInput');
    const imageInput = document.querySelector('#productImageInput');
    const editorImage = document.querySelector('#editorImage');
    const productEditor = document.querySelector('.product-editor');
    const tagSelect = document.querySelector('#productTagInput');
    const saveProductButton = document.querySelector('#saveProductButton');
    const deleteProductButton = document.querySelector('#deleteProductButton'); // New reference for delete button

    let currentProductId = null;
    let newImageFile = null;
    let tags = [];

    const apiBaseUrl = 'http://localhost:8080';

    // Utility to handle fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeout = 8000) {
        // Set default options including credentials
        const defaultOptions = {
            credentials: 'include', // Include cookies in requests
            ...options
        };
    
        return Promise.race([
            fetch(url, defaultOptions),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }
    
    // Open the product editor with details
    function openEditor(product) {
        currentProductId = product.id;
        newImageFile = null;
        nameInput.value = product.name;
        priceInput.value = product.price;
        tagSelect.value = product.tag_id || ''; // Set tag if available
        editorImage.src = `${apiBaseUrl}/images/${product.id}.png`; // Set image src with .png extension

        // Show or hide the delete button based on whether it's an existing product
        deleteProductButton.classList.toggle('hidden', !currentProductId);

        body.style.overflow = 'hidden';
        freezeSection.classList.remove('hidden');
    }

    // Close the product editor
    function closeEditor() {
        currentProductId = null;
        newImageFile = null;
        freezeSection.classList.add('hidden');
        body.style.overflow = '';
    }

    // Fetch products from the server
    async function fetchProducts() {
        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/products`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const products = data.map(product => new Product(
                product.id,
                `${apiBaseUrl}/images/${product.id}.png`, // Use image URL with .png extension
                product.name,
                product.price,
                product.tag_id
            ));
            refreshProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert(`Failed to fetch products: ${error.message}`);
        }
    }

    // Fetch tags from the server
    async function fetchTags() {
        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/tags`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            tags = data;
            refreshTags(tags);
        } catch (error) {
            console.error('Error fetching tags:', error);
            alert(`Failed to fetch tags: ${error.message}`);
        }
    }

    // Refresh the product list in the UI
    function refreshProducts(productList) {
        productEditor.innerHTML = '';
        productList.forEach(product => {
            product.onclick(() => openEditor(product));
            productEditor.appendChild(product.generate());
        });
    }

    // Refresh the tags dropdown in the UI
    function refreshTags(tagList) {
        tagSelect.innerHTML = '<option value="">Select Tag</option>'; // Clear previous options
        tagList.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            tagSelect.appendChild(option);
        });
    }

    // Save a product (add or update)
    async function saveProduct() {
        const product = {
            name: nameInput.value,
            price: parseFloat(priceInput.value),
            tag_id: parseInt(tagSelect.value) || null // Allow null for no tag
        };

        try {
            let response;
            if (currentProductId) {
                // Update existing product
                response = await fetchWithTimeout(`${apiBaseUrl}/products/${currentProductId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            } else {
                // Create new product
                response = await fetchWithTimeout(`${apiBaseUrl}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (newImageFile) {
                const formData = new FormData();
                formData.append('file', newImageFile);

                await fetchWithTimeout(`${apiBaseUrl}/upload/${result.id}`, {
                    method: 'POST',
                    body: formData
                });
            }

            fetchProducts(); // Refresh the product list
            closeEditor(); // Close the editor
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`Failed to save product: ${error.message}`);
        }
    }

    // Delete a product
    async function deleteProduct() {
        if (!currentProductId) return;

        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/products/${currentProductId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            fetchProducts(); // Refresh the product list
            closeEditor(); // Close the editor
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`Failed to delete product: ${error.message}`);
        }
    }

    // Event listeners
    editorCloseBtn.addEventListener('click', closeEditor);
    saveProductButton.addEventListener('click', saveProduct);
    deleteProductButton.addEventListener('click', deleteProduct); // Add event listener for delete button

    // Handle image file change
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            newImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                editorImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Initial load
    fetchProducts();
    fetchTags();
});

// Product class definition
class Product {
    constructor(id, image, name, price, tag_id) {
        this.id = id;
        this.image = image;
        this.name = name;
        this.price = price;
        this.tag_id = tag_id;
        this.clickHandler = null;
    }

    onclick(handler) {
        this.clickHandler = handler;
    }

    generate() {
        const container = document.createElement('div');
        container.classList.add('menu-item', 'editable-menu-item');
        container.dataset.id = this.id;

        const menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');

        const img = document.createElement('img');
        img.src = this.image;
        img.alt = this.name;
        img.loading = 'lazy';

        const nameElement = document.createElement('h3');
        nameElement.textContent = this.name;

        const priceElement = document.createElement('h5');
        priceElement.textContent = `${this.price} BHD`;

        menuItem.append(img, nameElement, priceElement);

        const editIcon = document.createElement('i');
        editIcon.classList.add('fas', 'fa-pencil-alt', 'edit-icon');

        container.append(menuItem, editIcon);

        container.addEventListener('click', () => {
            if (this.clickHandler) this.clickHandler();
        });

        return container;
    }
}



async function logout() {
    try {
        const response = await fetch('http://localhost:8080/logout', {
            method: 'POST', // or 'DELETE' depending on your API
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            console.log('Successfully logged out');
            // Optionally redirect the user to a login page or homepage
            window.location.href = '/login.html'; // Redirect to login page
        } else {
            console.error('Failed to log out', response.status);
            alert('Failed to log out. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred while logging out. Please try again.');
    }
}