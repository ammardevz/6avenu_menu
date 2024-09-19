

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
    const categorySelect = document.querySelector('#productCategoryInput');
    const saveProductButton = document.querySelector('#saveProductButton');
    const deleteProductButton = document.querySelector('#deleteProductButton');
    const createNewProductButton = document.querySelector('#createNewProductButton');

    let currentProductId = null;
    let newImageFile = null;
    let categories = [];

    const apiBaseUrl = 'https://coffee-api-bold-moon-8315.fly.dev';

    async function fetchWithTimeout(url, options = {}, timeout = 8000) {
        const defaultOptions = {
            credentials: 'include',
            ...options
        };

        return Promise.race([
            fetch(url, defaultOptions),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), timeout)
            )
        ]);
    }

    

    function openEditor(product) {
        currentProductId = product.id;
        newImageFile = null;
        nameInput.value = product.name;
        priceInput.value = product.price;
        categorySelect.value = product.category_id || '';
        editorImage.src = `${apiBaseUrl}/images/${product.id}.png?${new Date().getTime()}`;

        deleteProductButton.classList.toggle('hidden', !currentProductId);

        body.style.overflow = 'hidden';
        freezeSection.classList.remove('hidden');
    }

    function closeEditor() {
        currentProductId = null;
        newImageFile = null;
        freezeSection.classList.add('hidden');
        body.style.overflow = '';
    }

    async function fetchProducts() {
        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/products`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const products = await response.json();
            refreshProducts(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert(`Failed to fetch products: ${error.message}`);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/categories`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            categories = await response.json();
            refreshCategories(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            alert(`Failed to fetch categories: ${error.message}`);
        }
    }

    function refreshProducts(productList) {
        productEditor.innerHTML = '';
        productList.forEach(product => {
            const productElement = new Product(
                product.id,
                `${apiBaseUrl}/images/${product.id}.png?${new Date().getTime()}`,
                product.name,
                product.price,
                product.category_id
            );
            productElement.onclick(() => openEditor(product));
            productEditor.appendChild(productElement.generate());
        });
    }

    function refreshCategories(categoryList) {
        if (!categorySelect) {
            console.error('Error: Category select element is not available.');
            return;
        }

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categoryList.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    async function saveProduct() {
        const product = {
            name: nameInput.value,
            price: parseFloat(priceInput.value),
            category_id: parseInt(categorySelect.value) || null
        };

        console.log('Saving product:', product);

        try {
            let response;
            if (currentProductId) {
                console.log(`Updating product with ID: ${currentProductId}`);
                response = await fetchWithTimeout(`${apiBaseUrl}/products/${currentProductId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            } else {
                console.log('Creating new product');
                response = await fetchWithTimeout(`${apiBaseUrl}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const result = await response.json();
            console.log('Save product result:', result);

            if (newImageFile) {
                console.log('Uploading new image');
                const formData = new FormData();
                formData.append('id', result.id.toString());
                formData.append('file', newImageFile);

                const uploadResponse = await fetchWithTimeout(`${apiBaseUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadResponse.ok) {
                    const uploadErrorText = await uploadResponse.text();
                    throw new Error(`Image upload failed! status: ${uploadResponse.status}, message: ${uploadErrorText}`);
                }
                console.log('Image uploaded successfully');
            }

            await fetchProducts();
            closeEditor();
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`Failed to save product: ${error.message}`);
        }
    }

    async function deleteProduct() {
        if (!currentProductId) return;

        try {
            const response = await fetchWithTimeout(`${apiBaseUrl}/products/${currentProductId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            fetchProducts();
            closeEditor();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`Failed to delete product: ${error.message}`);
        }
    }

    editorCloseBtn.addEventListener('click', closeEditor);
    saveProductButton.addEventListener('click', saveProduct);
    deleteProductButton.addEventListener('click', deleteProduct);
    createNewProductButton.addEventListener('click', () => {
        currentProductId = null;
        nameInput.value = '';
        priceInput.value = '';
        categorySelect.value = '';
        editorImage.src = '';
        newImageFile = null;
        deleteProductButton.classList.add('hidden');
        body.style.overflow = 'hidden';
        freezeSection.classList.remove('hidden');
    });

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

    fetchProducts();
    fetchCategories();
});

class Product {
    constructor(id, image, name, price, category_id) {
        this.id = id;
        this.image = image;
        this.name = name;
        this.price = price;
        this.category_id = category_id;
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
        const response = await fetch(`${apiBaseUrl}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            console.log('Successfully logged out');
            window.location.href = '/login.html';
        } else {
            console.error('Failed to log out', response.status);
            alert('Failed to log out. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred while logging out. Please try again.');
    }
}
