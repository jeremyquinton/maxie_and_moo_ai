(() => {
  if (window.collectionColorCardsInitialized) return;
  window.collectionColorCardsInitialized = true;

  const readGallery = (card) => {
    try {
      return JSON.parse(card.querySelector('[data-card-gallery-data]')?.textContent || '[]');
    } catch {
      return [];
    }
  };

  const showGalleryImage = (card, images, index) => {
    if (!images.length) return;
    const imageIndex = (index + images.length) % images.length;
    const nextIndex = (imageIndex + 1) % images.length;
    const imageLink = card.querySelector('[data-card-main-link]');
    let primary = imageLink.querySelector('.featured-collection__image-primary');
    let alternate = imageLink.querySelector('.featured-collection__image-alternate');

    if (!primary) {
      primary = document.createElement('img');
      primary.className = 'featured-collection__image-primary';
      primary.loading = 'lazy';
      imageLink.prepend(primary);
    }
    primary.src = images[imageIndex].src;
    primary.removeAttribute('srcset');
    primary.removeAttribute('sizes');
    primary.alt = images[imageIndex].alt || '';
    primary.hidden = false;

    if (images.length > 1) {
      if (!alternate) {
        alternate = document.createElement('img');
        alternate.className = 'featured-collection__image-alternate';
        alternate.loading = 'lazy';
        imageLink.append(alternate);
      }
      alternate.src = images[nextIndex].src;
      alternate.removeAttribute('srcset');
      alternate.removeAttribute('sizes');
      alternate.alt = images[nextIndex].alt || '';
      alternate.hidden = false;
    } else if (alternate) {
      alternate.hidden = true;
    }

    imageLink.classList.toggle('has-preview', images.length > 1);
    card.dataset.galleryIndex = String(imageIndex);
    const controls = card.querySelector('[data-card-gallery-controls]');
    if (controls) controls.hidden = images.length < 2;
    const count = card.querySelector('[data-card-gallery-count]');
    if (count) {
      count.textContent = count.dataset.format
        .replace('__CURRENT__', String(imageIndex + 1))
        .replace('__TOTAL__', String(images.length));
    }
  };

  const updateFeaturedCollectionControls = (section) => {
    const track = section.querySelector('.featured-collection__grid');
    if (!track) return;
    const previousButton = section.querySelector('[data-featured-scroll="-1"]');
    const nextButton = section.querySelector('[data-featured-scroll="1"]');
    if (previousButton) previousButton.disabled = track.scrollLeft <= 1;
    if (nextButton) nextButton.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };

  const initializeFeaturedCollectionControls = (section) => {
    const track = section.querySelector('.featured-collection__grid');
    if (!track) return;
    if (track.dataset.featuredScrollInitialized !== 'true') {
      track.dataset.featuredScrollInitialized = 'true';
      const update = () => updateFeaturedCollectionControls(section);
      track.addEventListener('scroll', update, { passive: true });
      track.addEventListener('scrollend', update, { passive: true });
    }
    updateFeaturedCollectionControls(section);
  };

  const initializeAllFeaturedCollectionControls = () => {
    document.querySelectorAll('.featured-collection').forEach(initializeFeaturedCollectionControls);
  };

  initializeAllFeaturedCollectionControls();
  document.addEventListener('DOMContentLoaded', initializeAllFeaturedCollectionControls, { once: true });
  window.addEventListener('resize', initializeAllFeaturedCollectionControls);
  document.addEventListener('shopify:section:load', initializeAllFeaturedCollectionControls);

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-featured-scroll]');
    if (!button || button.disabled) return;
    const section = button.closest('.featured-collection');
    const track = section?.querySelector('.featured-collection__grid');
    if (!track) return;
    event.preventDefault();
    const direction = Number(button.dataset.featuredScroll);
    if (direction > 0) {
      section.querySelector('[data-featured-scroll="-1"]').disabled = false;
    }
    const firstCard = track.querySelector('.featured-collection__card');
    const columnGap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const scrollAmount = firstCard ? firstCard.getBoundingClientRect().width + columnGap : track.clientWidth;
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  });

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const media = event.target.closest?.('.featured-collection__media');
    if (!media || media.contains(event.relatedTarget)) return;
    const card = media.closest('[data-product-card]');
    if (!card || card.classList.contains('is-gallery-browsing')) return;
    const images = readGallery(card);
    if (images.length > 1) {
      card.classList.add('is-gallery-browsing');
      showGalleryImage(card, images, 1);
    }
  });

  document.addEventListener('pointerout', (event) => {
    const media = event.target.closest?.('.featured-collection__media');
    if (!media || media.contains(event.relatedTarget)) return;
    const card = media.closest('[data-product-card]');
    if (!card) return;
    const images = readGallery(card);
    if (images.length) showGalleryImage(card, images, 0);
    card.classList.remove('is-gallery-browsing');
  });

  document.addEventListener('click', (event) => {
    const galleryStep = event.target.closest?.('[data-card-gallery-step]');
    if (galleryStep) {
      event.preventDefault();
      event.stopPropagation();
      const card = galleryStep.closest('[data-product-card]');
      const images = readGallery(card);
      if (card && images.length > 1) {
        card.classList.add('is-gallery-browsing');
        const currentIndex = Number(card.dataset.galleryIndex || 0);
        showGalleryImage(card, images, currentIndex + Number(galleryStep.dataset.cardGalleryStep));
      }
      return;
    }

    const swatch = event.target.closest?.('[data-color-product-link]');
    if (!swatch || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const card = swatch.closest('[data-product-card]');
    if (!card) return;

    event.preventDefault();

    const colorGallery = JSON.parse(swatch.dataset.colorCardGallery || '[]');
    const galleryData = card.querySelector('[data-card-gallery-data]');
    if (galleryData) galleryData.textContent = JSON.stringify(colorGallery);
    card.classList.remove('is-gallery-browsing');
    if (colorGallery.length) showGalleryImage(card, colorGallery, 0);

    const primaryUrl = swatch.dataset.colorCardPrimaryImage;
    const alternateUrl = swatch.dataset.colorCardSecondaryImage;
    const title = swatch.dataset.colorCardTitle;
    const mainLink = card.querySelector('[data-card-main-link]');
    const titleLink = card.querySelector('[data-card-title-link]');
    const placeholder = card.querySelector('[data-card-placeholder]');
    let primaryImage = card.querySelector('.collection-product__image-primary');
    let alternateImage = card.querySelector('.collection-product__image-alternate');

    if (primaryUrl) {
      if (!primaryImage) {
        primaryImage = document.createElement('img');
        primaryImage.className = 'collection-product__image-primary';
        primaryImage.loading = 'lazy';
        mainLink.prepend(primaryImage);
      }
      primaryImage.src = primaryUrl;
      primaryImage.alt = title;
      primaryImage.hidden = false;
      if (placeholder) placeholder.hidden = true;
    } else {
      if (primaryImage) primaryImage.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }

    if (alternateUrl) {
      if (!alternateImage) {
        alternateImage = document.createElement('img');
        alternateImage.className = 'collection-product__image-alternate';
        alternateImage.loading = 'lazy';
        mainLink.append(alternateImage);
      }
      alternateImage.src = alternateUrl;
      alternateImage.alt = title;
      alternateImage.hidden = false;
    } else if (alternateImage) {
      alternateImage.hidden = true;
    }

    mainLink.href = swatch.dataset.productUrl;
    mainLink.classList.toggle('has-preview', Boolean(alternateUrl));
    titleLink.href = swatch.dataset.productUrl;
    titleLink.textContent = title;
    card.querySelector('[data-card-displayed-price]').textContent = swatch.dataset.colorCardPrice;

    const comparePrice = card.querySelector('[data-card-displayed-compare-price]');
    comparePrice.textContent = swatch.dataset.colorCardComparePrice;
    comparePrice.hidden = swatch.dataset.colorCardOnSale !== 'true';

    const badgeContainer = card.querySelector('.collection-product__badges');
    badgeContainer.replaceChildren();
    if (swatch.dataset.colorCardAvailable !== 'true' || swatch.dataset.colorCardOnSale === 'true') {
      const badge = document.createElement('span');
      badge.className = 'collection-product__badge';
      if (swatch.dataset.colorCardAvailable === 'true') {
        badge.classList.add('collection-product__badge--sale');
        badge.textContent = badgeContainer.dataset.saleLabel;
      } else {
        badge.textContent = badgeContainer.dataset.soldOutLabel;
      }
      badgeContainer.append(badge);
    }

    card.querySelectorAll('[data-color-product-link]').forEach((link) => {
      const selected = link === swatch;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  });
})();
