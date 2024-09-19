document.addEventListener('DOMContentLoaded', async function () {
    // Define constants
    const apiBaseUrl = 'https://coffee-api-bold-moon-8315.fly.dev'; // Adjust base URL as needed

    // Utility to handle fetch with timeout
    async function fetchWithTimeout(url, options = {}, timeout = 8000) {
        const defaultOptions = {
            credentials: 'include',  // Ensure cookies are sent with requests
            ...options
        };
        return Promise.race([
            fetch(url, defaultOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
    }

    const menuContainer = document.querySelector('.menu-container');
    const orderSummary = document.getElementById('order-summary');
    const submitOrderBtn = document.getElementById('submit-order');
    const deleteOrderBtn = document.getElementById('delete-order');
    const orderTabsContainer = document.getElementById('order-tabs-container');
    const newOrderBtn = document.getElementById('new-order-btn');
    let orders = loadOrders();
    let currentOrderIndex = 0;

    function fetchProducts() {
        return fetchWithTimeout(`${apiBaseUrl}/products`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const products = data.map(productData => new Product(
                    productData.id,
                    `${apiBaseUrl}/images/${productData.id}.png`,
                    productData.name,
                    productData.price
                ));
                return products;
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                alert(`Unable to retrieve products: ${error.message}`);
                return [];
            });
    }

    function renderMenuItems(products) {
        menuContainer.innerHTML = '';

        products.forEach(product => {
            const productElement = product.generate();
            menuContainer.appendChild(productElement);
            productElement.addEventListener('click', () => addToOrder(product, 1));
        });
    }

    function addToOrder(product, quantity) {
        const currentOrder = orders[currentOrderIndex];
        const existingOrderItem = currentOrder.find(item => item.product.id === product.id);
        if (existingOrderItem) {
            existingOrderItem.quantity += quantity;
        } else {
            currentOrder.push({ product, quantity });
        }
        saveOrders();
        updateOrderSummary();
    }

    function updateOrderSummary() {
        const currentOrder = orders[currentOrderIndex];
        orderSummary.innerHTML = '';

        if (currentOrder.length === 0) {
            orderSummary.innerHTML = '<p>Your order is currently empty.</p>';
        } else {
            const orderList = document.createElement('ul');
            let total = 0;

            currentOrder.forEach((orderItem, index) => {
                const listItem = document.createElement('li');
                const itemTotal = orderItem.quantity * orderItem.product.price;
                total += itemTotal;

                listItem.innerHTML = `
                    <span class="item-name">${orderItem.product.name}</span>
                    <span class="item-details">
                        (${orderItem.quantity})
                        ${itemTotal.toFixed(2)} BHD
                    </span>
                    <span class="quantity-controls">
                        <button class="quantity-btn decrease" data-index="${index}">−</button>
                        <button class="quantity-btn increase" data-index="${index}">+</button>
                    </span>
                `;
                orderList.appendChild(listItem);
            });

            orderSummary.appendChild(orderList);

            // Add total
            const totalElement = document.createElement('p');
            totalElement.innerHTML = `<strong>Total: ${total.toFixed(2)} BHD</strong>`;
            orderSummary.appendChild(totalElement);

            orderSummary.querySelectorAll('.quantity-btn').forEach(button => {
                button.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const index = parseInt(this.getAttribute('data-index'));
                    const action = this.classList.contains('increase') ? 'increase' : 'decrease';
                    adjustQuantity(index, action);
                });
            });
        }
    }

    function adjustQuantity(index, action) {
        const currentOrder = orders[currentOrderIndex];
        if (action === 'increase') {
            currentOrder[index].quantity += 1;
        } else if (action === 'decrease') {
            currentOrder[index].quantity -= 1;
            if (currentOrder[index].quantity <= 0) {
                removeFromOrder(index);
                return;
            }
        }
        saveOrders();
        updateOrderSummary();
    }

    function removeFromOrder(index) {
        orders[currentOrderIndex].splice(index, 1);
        saveOrders();
        updateOrderSummary();
    }

    function saveOrders() {
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    function loadOrders() {
        const savedOrders = localStorage.getItem('orders');
        return savedOrders ? JSON.parse(savedOrders) : [[]];
    }

    function addNewOrder() {
        orders.push([]);
        currentOrderIndex = orders.length - 1;
        updateOrderTabs();
        saveOrders();
        updateOrderSummary();
    }

    function switchOrder(index) {
        currentOrderIndex = index;
        updateOrderTabs();
        updateOrderSummary();
    }

    function deleteCurrentOrder() {
        if (orders.length > 1) {
            orders.splice(currentOrderIndex, 1);
            currentOrderIndex = Math.max(0, currentOrderIndex - 1);
            updateOrderTabs();
            saveOrders();
            updateOrderSummary();
        } else {
            alert('The last order cannot be deleted.');
        }
    }

    function updateOrderTabs() {
        orderTabsContainer.innerHTML = '';
        orders.forEach((_, index) => {
            const tab = document.createElement('button');
            tab.textContent = `Order ${index + 1}`;
            tab.classList.add('tab');
            if (index === currentOrderIndex) {
                tab.classList.add('active');
            }
            tab.addEventListener('click', () => switchOrder(index));
            orderTabsContainer.appendChild(tab);
        });
    }

    submitOrderBtn.addEventListener('click', function () {
        const currentOrder = orders[currentOrderIndex];
    
        if (currentOrder.length === 0) {
            alert('No items to submit in the current order.');
            return;
        }
    
        // Create the order
        fetch(`${apiBaseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}),
            credentials: 'include' // Ensure cookies are included for authentication
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(orderData => {
            // Add products to the order
            const addProductPromises = currentOrder.map(item =>
                fetch(`${apiBaseUrl}/orders/${orderData.id}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        product_id: item.product.id,
                        order_id: orderData.id,
                        price_at_time: item.product.price,
                        quantity: item.quantity
                    }),
                    credentials: 'include' // Ensure cookies are included for authentication
                })
            );
    
            return Promise.all(addProductPromises);
        })
        .then(() => {
            // Remove the current order
            orders.splice(currentOrderIndex, 1);
            saveOrders();
    
            // If there are still orders, switch to a valid one
            if (orders.length > 0) {
                currentOrderIndex = Math.min(currentOrderIndex, orders.length - 1); // Adjust index to a valid range
            } else {
                orders.push([]); // Ensure there is at least one empty order
                currentOrderIndex = 0;
            }
    
            updateOrderSummary();
            updateOrderTabs(); // Update the order tabs after submission
    
            alert('Order submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            alert(`Failed to submit order: ${error.message}`);
        });
    });
    


    deleteOrderBtn.addEventListener('click', deleteCurrentOrder);
    newOrderBtn.addEventListener('click', addNewOrder);

    fetchProducts().then(renderMenuItems);
    updateOrderTabs();
    updateOrderSummary();
});

class Product {
    constructor(id, image, name, price) {
        this.id = id;
        this.image = image;
        this.name = name;
        this.price = price;
        this.clickHandler = null;
    }

    onclick(handler) {
        this.clickHandler = handler;
    }

    generate() {
        const container = document.createElement('div');
        container.classList.add('menu-item', 'editable-menu-item');
        container.dataset.id = this.id;

        const img = document.createElement('img');
        img.src = this.image;
        img.alt = this.name;
        img.loading = 'lazy';

        const nameElement = document.createElement('h3');
        nameElement.textContent = this.name;

        const priceElement = document.createElement('h5');
        priceElement.textContent = `${this.price} BHD`;

        container.appendChild(img);
        container.appendChild(nameElement);
        container.appendChild(priceElement);

        container.addEventListener('click', () => {
            if (this.clickHandler) this.clickHandler();
        });

        return container;
    }
}

async function logout() {
    try {
        const response = await fetch('https://coffee-api-bold-moon-8315.fly.dev/logout', {
            method: 'POST', // or 'DELETE' depending on your API
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            console.log('Successfully logged out');
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
