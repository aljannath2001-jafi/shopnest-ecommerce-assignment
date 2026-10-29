// ShopNest: Product data, cart, search/filter, checkout and order history

// ---------- Helper functions ----------

// Converts special characters to plain text so user input can't run as HTML/code
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Reads an array from localStorage; returns [] if it is missing or corrupted
function loadFromStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        console.error("Could not read " + key + " from localStorage:", error);
        return [];
    }
}

// ---------- Product loading and display ----------

const productsContainer = document.getElementById("products-container");
const productsMessage = document.getElementById("products-message");

let products = [];

// Loads product data from products.json using fetch with async/await
async function loadProducts() {
    try {
        productsMessage.textContent = "Loading products...";

        const response = await fetch("products.json");

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        products = await response.json();

        displayProducts(products);
        renderCart();
    } catch (error) {
        console.error("Product loading error:", error);
        productsMessage.textContent =
            "Products could not load. Please check your JSON file and Live Server.";
    }
}

// Builds the product cards using DOM methods (no hardcoded HTML)
function displayProducts(productList) {
    productsContainer.innerHTML = "";

    if (productList.length === 0) {
        productsMessage.textContent = "No products found.";
        return;
    }

    productsMessage.textContent = "";

    productList.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const image = document.createElement("img");
        image.className = "product-image";
        image.src = product.imageUrl;
        image.alt = product.name;

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("p");
        category.className = "product-category";
        category.textContent = product.category;

        const name = document.createElement("h3");
        name.textContent = product.name;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent =
            product.description || "Explore this product at ShopNest.";

        const rating = document.createElement("p");
        rating.className = "product-rating";
        rating.textContent = `⭐ ${product.rating}`;

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = `₹${product.price}`;

        const originalPrice = document.createElement("span");
        originalPrice.className = "original-price";
        originalPrice.textContent = `₹${product.originalPrice}`;

        price.appendChild(originalPrice);

        const addButton = document.createElement("button");
        addButton.className = "add-to-cart";
        addButton.textContent = "Add to Cart";
        addButton.addEventListener("click", function () {
            addToCart(product.id);
        });

        info.append(category, name, description, rating, price, addButton);
        card.append(image, info);
        productsContainer.appendChild(card);
    });
}

// ---------- Cart ----------

const cartItemsContainer = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartTotalElement = document.getElementById("cart-total");

// The cart stores only { id, quantity }; product details come from `products`
let cart = loadFromStorage("shopnest-cart");

// Saves the cart to localStorage so it survives a page refresh
function saveCart() {
    localStorage.setItem("shopnest-cart", JSON.stringify(cart));
}

// Adds a product, or increases its quantity if it is already in the cart
function addToCart(productId) {
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }

    saveCart();
    renderCart();
}

// Handles the + and - buttons; removes the item if quantity reaches 0
function changeQuantity(productId, change) {
    const item = cart.find((item) => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter((item) => item.id !== productId);
    }

    saveCart();
    renderCart();
}

// Removes an item completely
function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
}

// Redraws the cart, the header count and the running total
function renderCart() {
    cartItemsContainer.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return;

        total += product.price * item.quantity;
        count += item.quantity;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const name = document.createElement("p");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = `₹${product.price} × ${item.quantity}`;

        const decrease = document.createElement("button");
        decrease.textContent = "−";
        decrease.className = "quantity-btn";
        decrease.addEventListener("click", () => {
            changeQuantity(product.id, -1);
        });

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;

        const increase = document.createElement("button");
        increase.textContent = "+";
        increase.className = "quantity-btn";
        increase.addEventListener("click", () => {
            changeQuantity(product.id, 1);
        });

        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            removeFromCart(product.id);
        });

        const quantityControls = document.createElement("div");
        quantityControls.className = "quantity-controls";
        quantityControls.append(decrease, quantity, increase);

        cartItem.append(name, price, quantityControls, remove);
        cartItemsContainer.appendChild(cartItem);
    });

    cartCountElement.textContent = count;
    cartTotalElement.textContent = `₹${total.toFixed(2)}`;
}

// Start loading products
loadProducts();

// ---------- Search and category filters ----------

const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");

let selectedCategory = "All";

// Applies the search text and the selected category together
function filterProducts() {
    const searchText = searchInput.value.toLowerCase().trim();

    const filteredProducts = products.filter(function (product) {
        const matchesSearch = product.name.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displayProducts(filteredProducts);
}

// Live search: runs on every keystroke
searchInput.addEventListener("input", filterProducts);

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedCategory = button.dataset.category;

        filterButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        filterProducts();
    });
});

// ---------- Checkout ----------

const checkoutButton = document.getElementById("checkout-btn");
const checkoutSection = document.getElementById("checkout-section");
const checkoutTotal = document.getElementById("checkout-total");

// Shows the checkout form (only if the cart has items)
checkoutButton.addEventListener("click", function () {
    if (cart.length === 0) {
        alert("Your cart is empty! Please add products first.");
        return;
    }

    checkoutTotal.textContent = cartTotalElement.textContent;
    checkoutSection.hidden = false;

    checkoutSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// ---------- Order history and order placing ----------

document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");

    let orderHistory = loadFromStorage("shopnest-orders");

    // Draws all saved orders. User-supplied text is escaped for safety.
    function renderOrderHistory() {
        const orderHistoryContainer = document.getElementById("order-history");

        if (!orderHistoryContainer) return;

        if (orderHistory.length === 0) {
            orderHistoryContainer.innerHTML =
                "<p>No orders yet. Start shopping!</p>";
            return;
        }

        orderHistoryContainer.innerHTML = orderHistory
            .map(
                (order, index) => `
        <div class="order-card">
            <h3>Order #${escapeHTML(order.orderNumber)}</h3>
            <p>Date: ${escapeHTML(order.date)}</p>
            <p>Customer: ${escapeHTML(order.customerName)}</p>
            <p>Total: ${escapeHTML(order.total)}</p>
            <p>Status: ${escapeHTML(order.status)}</p>
            <button type="button" class="view-order-btn" data-order-index="${index}">
                View Details
            </button>

            <button
                type="button"
                class="cancel-order-btn"
                data-order-index="${index}"
                ${order.status === "Cancelled" ? "disabled" : ""}
            >
                ${order.status === "Cancelled" ? "Order Cancelled" : "Cancel Order"}
            </button>
            <div class="order-details" id="order-details-${index}" hidden>
                ${
                    order.products && order.products.length
                        ? order.products
                              .map(
                                  (product) => `
                        <div class="order-product">
                            <p>Product: ${escapeHTML(product.name)}</p>
                            <p>Quantity: ${Number(product.quantity)}</p>
                            <p>Price: ₹${Number(product.price).toFixed(2)}</p>
                            <p>Subtotal: ₹${(Number(product.price) * Number(product.quantity)).toFixed(2)}</p>
                        </div>
                    `
                              )
                              .join("")
                        : "<p>Product details unavailable for this order.</p>"
                }
            </div>
        </div>
    `
            )
            .join("");

        // Show / hide order details
        orderHistoryContainer.querySelectorAll(".view-order-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const index = this.dataset.orderIndex;
                const details = document.getElementById(`order-details-${index}`);

                details.hidden = !details.hidden;
                this.textContent = details.hidden ? "View Details" : "Hide Details";
            });
        });

        // Cancel an order (after confirmation) and save the new status
        orderHistoryContainer.querySelectorAll(".cancel-order-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const index = Number(this.dataset.orderIndex);

                if (orderHistory[index].status === "Cancelled") return;

                const confirmCancel = confirm(
                    "Are you sure you want to cancel this order?"
                );

                if (!confirmCancel) return;

                orderHistory[index].status = "Cancelled";

                localStorage.setItem(
                    "shopnest-orders",
                    JSON.stringify(orderHistory)
                );

                renderOrderHistory();
            });
        });
    }

    renderOrderHistory();

    if (!checkoutForm) {
        console.error("Checkout form not found!");
        return;
    }

    // Places the order: saves it, shows the confirmation and clears the cart
    checkoutForm.addEventListener("submit", function (event) {
        const placeOrderButton = checkoutForm.querySelector(".place-order-btn");
        event.preventDefault();

        if (placeOrderButton.disabled) return;

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Processing...";

        const customerName = document.getElementById("customer-name").value.trim();
        const orderTotal = cartTotalElement.textContent;
        const orderNumber = "SN" + Date.now().toString().slice(-6);

        const newOrder = {
            orderNumber: orderNumber,
            customerName: customerName,
            total: orderTotal,
            date: new Date().toLocaleString(),
            status: "Placed",
            products: cart.map((item) => {
                const product = products.find((p) => p.id === item.id);

                return {
                    name: product ? product.name : "Product",
                    quantity: item.quantity,
                    price: product ? product.price : 0
                };
            })
        };

        orderHistory.unshift(newOrder);
        localStorage.setItem("shopnest-orders", JSON.stringify(orderHistory));
        renderOrderHistory();

        document.getElementById("confirmed-order-number").textContent = orderNumber;
        document.getElementById("confirmed-order-total").textContent = orderTotal;
        const confirmation = document.getElementById("order-confirmation");
         confirmation.hidden = false;

        confirmation.scrollIntoView({
         behavior: "smooth",
         block: "center"
});
        cart = [];
        saveCart();
        renderCart();

        checkoutForm.reset();
        checkoutSection.hidden = true;

        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place Order";
    });

    // Hides the confirmation and scrolls back to the products
    document
        .getElementById("continue-shopping-btn")
        .addEventListener("click", function () {
            document.getElementById("order-confirmation").hidden = true;
            document.getElementById("products-container").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
});
