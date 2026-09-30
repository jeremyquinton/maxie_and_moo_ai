(() => {
  if (window.cartDrawerInitialized) return;

  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;
  window.cartDrawerInitialized = true;

  const itemsElement = drawer.querySelector('[data-cart-drawer-items]');
  const emptyElement = drawer.querySelector('[data-cart-drawer-empty]');
  const footerElement = drawer.querySelector('[data-cart-drawer-footer]');
  const statusElement = drawer.querySelector('[data-cart-drawer-status]');
  const closeButton = drawer.querySelector('[data-cart-drawer-close]');
  const totalElement = drawer.querySelector('[data-cart-drawer-total]');
  let updatingCart = false;

  const setStatus = (message) => {
    statusElement.textContent = message || '';
  };

  const formatMoney = (amount) => {
    const cents = Number(amount) || 0;
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(cents, drawer.dataset.moneyFormat);
    }

    return new Intl.NumberFormat(document.documentElement.lang || 'en-ZA', {
      style: 'currency',
      currency: drawer.dataset.currency || 'ZAR'
    }).format(cents / 100);
  };

  const requestCart = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.description || data.message || drawer.dataset.labelError);
    }
    return data;
  };

  const updateCartCount = (cart) => {
    document.querySelectorAll('[data-cart-count]').forEach((count) => {
      count.textContent = String(cart.item_count);
      count.hidden = cart.item_count < 1;
    });
  };

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const makeCartItem = (item) => {
    const row = makeElement('li', 'cart-drawer__item');
    row.dataset.cartLineKey = item.key;

    const imageUrl = item.featured_image?.url || item.image;
    if (imageUrl) {
      const imageLink = makeElement('a', 'cart-drawer__item-image');
      imageLink.href = item.url || drawer.dataset.cartPageUrl;
      const image = makeElement('img');
      image.src = imageUrl;
      image.alt = item.featured_image?.alt || item.product_title || item.title;
      image.loading = 'lazy';
      imageLink.append(image);
      row.append(imageLink);
    }

    const details = makeElement('div', 'cart-drawer__item-details');
    const title = makeElement('a', 'cart-drawer__item-title', item.product_title || item.title);
    title.href = item.url || drawer.dataset.cartPageUrl;
    details.append(title);

    const optionLabels = (item.options_with_values || [])
      .filter((option) => option.value && option.value !== 'Default Title' && option.name !== 'Title')
      .map((option) => `${option.name}: ${option.value}`);
    if (optionLabels.length) {
      details.append(makeElement('p', 'cart-drawer__item-options', optionLabels.join(' / ')));
    }

    const linePrice = item.final_line_price ?? item.line_price ?? (item.price * item.quantity);
    details.append(makeElement('p', 'cart-drawer__item-price', formatMoney(linePrice)));

    const actions = makeElement('div', 'cart-drawer__item-actions');
    const quantity = makeElement('div', 'cart-drawer__quantity');
    const decrease = makeElement('button', '', '−');
    decrease.type = 'button';
    decrease.dataset.cartQuantityStep = '-1';
    decrease.setAttribute('aria-label', drawer.dataset.labelDecrease);

    const input = makeElement('input');
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    input.value = String(item.quantity);
    input.dataset.cartQuantity = '';
    input.setAttribute('aria-label', drawer.dataset.labelQuantity);

    const increase = makeElement('button', '', '+');
    increase.type = 'button';
    increase.dataset.cartQuantityStep = '1';
    increase.setAttribute('aria-label', drawer.dataset.labelIncrease);
    quantity.append(decrease, input, increase);

    const remove = makeElement('button', 'cart-drawer__remove', drawer.dataset.labelRemove);
    remove.type = 'button';
    remove.dataset.cartRemove = '';
    actions.append(quantity, remove);
    details.append(actions);
    row.append(details);
    return row;
  };

  const renderCart = (cart) => {
    const hasItems = cart.item_count > 0;
    itemsElement.replaceChildren(...cart.items.map(makeCartItem));
    itemsElement.hidden = !hasItems;
    emptyElement.hidden = hasItems;
    footerElement.hidden = !hasItems;
    totalElement.textContent = formatMoney(cart.total_price);
    updateCartCount(cart);
  };

  const showDrawer = () => {
    if (!drawer.open) drawer.showModal();
    closeButton.focus({ preventScroll: true });
  };

  const refreshCart = async () => {
    const cart = await requestCart(drawer.dataset.cartUrl, { cache: 'no-store' });
    renderCart(cart);
  };

  const updateLine = async (key, quantity) => {
    if (updatingCart) return;
    updatingCart = true;
    drawer.setAttribute('aria-busy', 'true');
    setStatus(drawer.dataset.labelUpdating);
    try {
      const cart = await requestCart(drawer.dataset.cartChangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      renderCart(cart);
      setStatus('');
    } catch (error) {
      setStatus(error.message || drawer.dataset.labelError);
    } finally {
      updatingCart = false;
      drawer.removeAttribute('aria-busy');
    }
  };

  document.addEventListener('click', (event) => {
    const openButton = event.target.closest?.('[data-cart-drawer-open]');
    if (openButton && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      showDrawer();
      setStatus(drawer.dataset.labelLoading);
      refreshCart().then(() => setStatus('')).catch((error) => setStatus(error.message || drawer.dataset.labelError));
      return;
    }

    const closeControl = event.target.closest?.('[data-cart-drawer-close]');
    if (closeControl) {
      event.preventDefault();
      drawer.close();
      return;
    }

    if (event.target === drawer) {
      drawer.close();
      return;
    }

    const remove = event.target.closest?.('[data-cart-remove]');
    if (remove) {
      const row = remove.closest('[data-cart-line-key]');
      if (row) updateLine(row.dataset.cartLineKey, 0);
      return;
    }

    const stepButton = event.target.closest?.('[data-cart-quantity-step]');
    if (stepButton) {
      const row = stepButton.closest('[data-cart-line-key]');
      const input = row?.querySelector('[data-cart-quantity]');
      if (row && input) {
        const quantity = Math.max(0, Number(input.value) + Number(stepButton.dataset.cartQuantityStep));
        updateLine(row.dataset.cartLineKey, quantity);
      }
    }
  });

  drawer.addEventListener('change', (event) => {
    const input = event.target.closest?.('[data-cart-quantity]');
    if (!input) return;
    const row = input.closest('[data-cart-line-key]');
    const quantity = Number.parseInt(input.value, 10);
    if (!row || !Number.isFinite(quantity) || quantity < 1) {
      input.value = '1';
      return;
    }
    updateLine(row.dataset.cartLineKey, quantity);
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest?.('form[data-product-form]');
    if (!form || event.defaultPrevented) return;
    if (event.submitter?.name && event.submitter.name !== 'add') return;
    if (!form.querySelector('[data-variant-id]')?.value) return;

    event.preventDefault();
    const addButton = form.querySelector('[data-add-button]');
    const addLabel = addButton?.querySelector('[data-add-label]');
    const previousLabel = addLabel?.textContent;
    const wasDisabled = addButton?.disabled;
    if (addButton) {
      addButton.disabled = true;
      addButton.setAttribute('aria-busy', 'true');
    }

    showDrawer();
    setStatus(drawer.dataset.labelAdding);
    try {
      await requestCart(drawer.dataset.cartAddUrl, {
        method: 'POST',
        body: new FormData(form)
      });
      await refreshCart();
      setStatus(drawer.dataset.labelAdded);
    } catch (error) {
      setStatus(error.message || drawer.dataset.labelError);
    } finally {
      if (addButton) {
        addButton.disabled = wasDisabled;
        addButton.removeAttribute('aria-busy');
      }
      if (addLabel && previousLabel) addLabel.textContent = previousLabel;
    }
  });
})();