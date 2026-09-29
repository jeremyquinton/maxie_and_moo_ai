(() => {
  if (window.productGallerySwipeInitialized) return;
  window.productGallerySwipeInitialized = true;

  const touchStarts = new Map();
  const minimumSwipeDistance = 48;

  document.addEventListener('touchstart', (event) => {
    const stage = event.target.closest?.('[data-gallery-swipe-stage]');
    if (!stage) return;
    if (event.touches.length !== 1) {
      touchStarts.clear();
      return;
    }
    const touch = event.changedTouches[0];
    touchStarts.set(touch.identifier, {
      stage,
      x: touch.clientX,
      y: touch.clientY
    });
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const start = touchStarts.get(touch.identifier);
    touchStarts.delete(touch.identifier);
    if (!start || !start.stage.isConnected) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < minimumSwipeDistance || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    const stage = start.stage;
    const productRoot = stage.closest('[data-product-page]');
    const images = [...stage.querySelectorAll('[data-gallery-image]')];
    const activeIndex = images.findIndex((image) => !image.hidden);
    if (activeIndex < 0 || images.length < 2) return;

    const swipeDirection = deltaX < 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(activeIndex + swipeDirection, images.length - 1));
    const nextImage = images[nextIndex];
    images.forEach((image) => {
      const active = image === nextImage;
      image.hidden = !active;
      image.classList.toggle('is-active', active);
    });

    if (nextIndex !== activeIndex && window.matchMedia('(max-width: 850px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nextImage.animate(
        [
          { transform: `translateX(${swipeDirection > 0 ? 100 : -100}%)` },
          { transform: 'translateX(0)' }
        ],
        { duration: 300, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      );
    }

    const gallery = stage.closest('[data-product-gallery]');
    gallery?.querySelectorAll('[data-gallery-thumbnail]').forEach((thumbnail) => {
      const active = thumbnail.dataset.imageId === nextImage.dataset.imageId;
      thumbnail.classList.toggle('is-active', active);
      thumbnail.setAttribute('aria-pressed', String(active));
      if (active) thumbnail.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });

    if (productRoot) {
      productRoot.galleryClickSuppressUntil = performance.now() + 400;
      const lightbox = productRoot.querySelector('[data-product-lightbox]');
      if (lightbox?.open) {
        const activeImage = nextImage.querySelector('img');
        const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
        const lightboxCount = lightbox.querySelector('[data-lightbox-count]');
        if (activeImage && lightboxImage) {
          lightboxImage.src = activeImage.currentSrc || activeImage.src;
          lightboxImage.alt = activeImage.alt;
        }
        if (lightboxCount) lightboxCount.textContent = `${nextIndex + 1} / ${images.length}`;
      }
    }
  }, { passive: true });

  document.addEventListener('touchcancel', (event) => {
    Array.from(event.changedTouches).forEach((touch) => {
      touchStarts.delete(touch.identifier);
    });
  }, { passive: true });
})();
