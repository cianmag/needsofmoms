/**
 * NeedsOfMoms - Main Application JavaScript
 * Vanilla JS, no frameworks, no dependencies
 * Modern ES6+ with broad browser support
 */

(function () {
  'use strict';

  // =========================================================================
  // CONFIGURATION
  // =========================================================================

  const CONFIG = {
    GA_ID: 'G-XXXXXXXXXX',
    COOKIE_KEY: 'nom_cookie_consent',
    SCROLL_THRESHOLD: 50,
    READING_WPM: 200,
    ANIMATION_DURATION: 800,
    DEBOUNCE_DELAY: 300,
    ACCORDION_DURATION: 300,
  };

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  /**
   * Format a date nicely (e.g., "January 15, 2025")
   */
  function formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) return '';
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Calculate days between two dates
   */
  function daysBetween(date1, date2) {
    var d1 = date1 instanceof Date ? date1 : new Date(date1);
    var d2 = date2 instanceof Date ? date2 : new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    var diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Add days to a date
   */
  function addDays(date, days) {
    var d = date instanceof Date ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Get weeks between two dates
   */
  function getWeeksBetween(date1, date2) {
    var days = daysBetween(date1, date2);
    return Math.floor(days / 7);
  }

  /**
   * Format a number with commas (e.g., 1234567 => "1,234,567")
   */
  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Debounce function
   */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  /**
   * Animate a counter from 0 to target
   */
  function animateCounter(element, target, duration) {
    if (!element || typeof target !== 'number') return;
    duration = duration || CONFIG.ANIMATION_DURATION;
    var start = 0;
    var startTime = null;
    target = Math.floor(target);

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out quad
      var eased = progress * (2 - progress);
      var current = Math.floor(eased * target);
      element.textContent = formatNumber(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = formatNumber(target);
      }
    }

    // Use requestAnimationFrame with fallback
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(step);
    } else {
      element.textContent = formatNumber(target);
    }
  }

  /**
   * Calculate reading time for an article
   */
  function calculateReadingTime(container) {
    if (!container) return 0;
    var text = container.textContent || container.innerText || '';
    var wordCount = text.trim().split(/\s+/).filter(function (w) {
      return w.length > 0;
    }).length;
    var minutes = Math.ceil(wordCount / CONFIG.READING_WPM);
    return minutes < 1 ? 1 : minutes;
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Toggle mobile menu (called from HTML onclick)
   */
  function toggleMobileMenu() {
    var mobileMenu = document.getElementById('mobileMenu');
    var menuBtn = document.querySelector('.mobile-menu-btn');
    if (!mobileMenu) return;

    var isOpen = mobileMenu.classList.toggle('active');
    document.body.classList.toggle('nav-open', isOpen);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.textContent = isOpen ? '✕' : '☰';
    }
  }

  // Expose globally so HTML onclick can call it
  window.toggleMobileMenu = toggleMobileMenu;

  function initNavigation() {
    var navbar = document.querySelector('.nav, #navbar');
    var mobileMenu = document.getElementById('mobileMenu');
    var navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    var currentPath = window.location.pathname;

    // --- Close mobile menu on link click ---
    if (mobileMenu) {
      var mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.remove('active');
          document.body.classList.remove('nav-open');
          var menuBtn = document.querySelector('.mobile-menu-btn');
          if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.textContent = '☰';
          }
        });
      });
    }

    // --- Close mobile menu on outside click ---
    document.addEventListener('click', function (e) {
      if (!mobileMenu || !mobileMenu.classList.contains('active')) return;
      var menuBtn = document.querySelector('.mobile-menu-btn');
      if (
        !mobileMenu.contains(e.target) &&
        (!menuBtn || !menuBtn.contains(e.target))
      ) {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('nav-open');
        if (menuBtn) {
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.textContent = '☰';
        }
      }
    });

    // --- Sticky nav: add shadow on scroll ---
    if (navbar) {
      var scrollHandler = function () {
        if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      };
      window.addEventListener('scroll', debounce(scrollHandler, 10), {
        passive: true,
      });
      scrollHandler();
    }

    // --- Active page highlighting ---
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var normalizedHref = href.replace(/\/$/, '').replace(/\.html$/, '');
      var normalizedPath = currentPath.replace(/\/$/, '').replace(/\.html$/, '');

      if (
        normalizedPath === normalizedHref ||
        (normalizedHref !== '' &&
          normalizedHref !== '/' &&
          normalizedPath.indexOf(normalizedHref) === 0)
      ) {
        link.classList.add('active');
        if (link.parentElement) {
          link.parentElement.classList.add('active');
        }
      }
    });
  }

  // =========================================================================
  // COOKIE CONSENT
  // =========================================================================

  function initCookieConsent() {
    var consent = localStorage.getItem(CONFIG.COOKIE_KEY);
    if (consent) {
      // Already decided
      if (consent === 'accepted') {
        loadGoogleAnalytics();
      }
      return;
    }

    // Build banner
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
      '<p class="cookie-banner-text">' +
      'We use cookies to improve your experience and analyze site traffic. ' +
      'By clicking "Accept", you consent to our use of cookies.' +
      '</p>' +
      '<div class="cookie-banner-buttons">' +
      '<button id="cookie-accept" class="btn btn-primary btn-sm">Accept</button>' +
      '<button id="cookie-decline" class="btn btn-outline btn-sm">Decline</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(banner);

    // Style inline so it works without CSS
    banner.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
      'background:#2c3e50;color:#fff;padding:16px 20px;' +
      'box-shadow:0 -2px 10px rgba(0,0,0,0.15);display:flex;align-items:center;' +
      'justify-content:center;';

    var inner = banner.querySelector('.cookie-banner-inner');
    if (inner) {
      inner.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;' +
        'flex-wrap:wrap;gap:12px;max-width:1200px;width:100%;';
    }

    var text = banner.querySelector('.cookie-banner-text');
    if (text) {
      text.style.cssText = 'margin:0;font-size:14px;line-height:1.5;flex:1;min-width:200px;';
    }

    var buttons = banner.querySelector('.cookie-banner-buttons');
    if (buttons) {
      buttons.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';
    }

    var acceptBtn = document.getElementById('cookie-accept');
    var declineBtn = document.getElementById('cookie-decline');

    if (acceptBtn) {
      acceptBtn.style.cssText =
        'background:#27ae60;color:#fff;border:none;padding:8px 24px;' +
        'border-radius:4px;cursor:pointer;font-size:14px;font-weight:600;';
      acceptBtn.addEventListener('click', function () {
        localStorage.setItem(CONFIG.COOKIE_KEY, 'accepted');
        banner.style.display = 'none';
        loadGoogleAnalytics();
      });
    }

    if (declineBtn) {
      declineBtn.style.cssText =
        'background:transparent;color:#fff;border:1px solid #fff;' +
        'padding:8px 24px;border-radius:4px;cursor:pointer;font-size:14px;';
      declineBtn.addEventListener('click', function () {
        localStorage.setItem(CONFIG.COOKIE_KEY, 'declined');
        banner.style.display = 'none';
      });
    }
  }

  // =========================================================================
  // GOOGLE ANALYTICS (placeholder)
  // =========================================================================

  var analyticsLoaded = false;

  function loadGoogleAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // GA4 initialization placeholder
    // Replace G-XXXXXXXXXX with real measurement ID
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', CONFIG.GA_ID, { anonymize_ip: true });
  }

  /**
   * Track a custom event
   */
  function trackEvent(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  // =========================================================================
  // SEO HELPERS
  // =========================================================================

  /**
   * Generate breadcrumbs from the current URL path
   */
  function generateBreadcrumbs() {
    var container = document.querySelector(
      '.breadcrumbs, [data-breadcrumbs], #breadcrumbs'
    );
    if (!container) return;

    var path = window.location.pathname;
    var segments = path.split('/').filter(function (s) {
      return s.length > 0 && s !== 'index.html';
    });

    var html = '<ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">';
    var pos = 1;

    // Home link
    html +=
      '<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
      '<a itemprop="item" href="/"><span itemprop="name">Home</span></a>' +
      '<meta itemprop="position" content="' + pos + '" />' +
      '</li>';
    pos++;

    // Build cumulative path
    var currentPath = '';
    for (var i = 0; i < segments.length; i++) {
      currentPath += '/' + segments[i];
      var name = decodeURIComponent(segments[i])
        .replace(/-/g, ' ')
        .replace(/\.html?$/, '')
        .replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        });

      var isLast = i === segments.length - 1;

      if (isLast) {
        html +=
          '<li class="breadcrumb-item active" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
          '<span itemprop="name">' + name + '</span>' +
          '<meta itemprop="position" content="' + pos + '" />' +
          '</li>';
      } else {
        html +=
          '<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">' +
          '<a itemprop="item" href="' + currentPath + '/"><span itemprop="name">' + name + '</span></a>' +
          '<meta itemprop="position" content="' + pos + '" />' +
          '</li>';
      }
      pos++;
    }

    html += '</ol>';
    container.innerHTML = html;
  }

  /**
   * Smooth scroll for anchor links
   */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();

      var header = document.querySelector('header, .site-header, .header');
      var headerHeight = header ? header.offsetHeight : 0;
      var targetPos =
        target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth',
      });

      // Update URL hash without jumping
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', hash);
      }
    });
  }

  // =========================================================================
  // FAQ ACCORDION
  // =========================================================================

  function initFAQAccordion() {
    var faqItems = document.querySelectorAll(
      '.faq-item, .accordion-item, [data-faq-item]'
    );
    if (faqItems.length === 0) return;

    faqItems.forEach(function (item) {
      var question = item.querySelector(
        '.faq-question, .accordion-header, [data-faq-question]'
      );
      var answer = item.querySelector(
        '.faq-answer, .accordion-body, [data-faq-answer]'
      );
      if (!question || !answer) return;

      // Set up ARIA
      var id = answer.id || 'faq-answer-' + Math.random().toString(36).substr(2, 9);
      answer.id = id;
      question.setAttribute('role', 'button');
      question.setAttribute('tabindex', '0');
      question.setAttribute('aria-expanded', 'false');
      question.setAttribute('aria-controls', id);

      // Initially collapsed
      answer.style.overflow = 'hidden';
      answer.style.maxHeight = '0';
      answer.style.transition = 'max-height ' + CONFIG.ACCORDION_DURATION + 'ms ease';

      // Click handler
      question.addEventListener('click', function () {
        toggleAccordion(item, answer, question);
      });

      // Keyboard support
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion(item, answer, question);
        }
      });
    });
  }

  function toggleAccordion(item, answer, question) {
    var isOpen = item.classList.contains('open');
    var parent = item.parentElement;
    var onlyOneOpen =
      parent && parent.hasAttribute('data-one-open')
        ? true
        : parent &&
          parent.classList.contains('faq-accordion-single');

    // Close all siblings if single-open mode
    if (onlyOneOpen && !isOpen) {
      var siblings = parent.querySelectorAll(
        '.faq-item.open, .accordion-item.open'
      );
      siblings.forEach(function (sibling) {
        if (sibling !== item) {
          var sibAnswer = sibling.querySelector(
            '.faq-answer, .accordion-body, [data-faq-answer]'
          );
          var sibQuestion = sibling.querySelector(
            '.faq-question, .accordion-header, [data-faq-question]'
          );
          sibling.classList.remove('open');
          if (sibAnswer) {
            sibAnswer.style.maxHeight = '0';
            sibAnswer.setAttribute('aria-hidden', 'true');
          }
          if (sibQuestion) {
            sibQuestion.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    if (isOpen) {
      item.classList.remove('open');
      answer.style.maxHeight = '0';
      answer.setAttribute('aria-hidden', 'true');
      question.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.setAttribute('aria-hidden', 'false');
      question.setAttribute('aria-expanded', 'true');
    }
  }

  // =========================================================================
  // SEARCH (Baby Names)
  // =========================================================================

  function initSearch() {
    var searchInput = document.querySelector(
      '#name-search, [data-search-input]'
    );
    var resultsContainer = document.querySelector(
      '#search-results, [data-search-results]'
    );
    var filterButtons = document.querySelectorAll(
      '[data-filter], .filter-btn'
    );
    var noResults = document.querySelector(
      '#no-results, [data-no-results]'
    );

    if (!searchInput || !resultsContainer) return;

    var searchItems = resultsContainer.querySelectorAll(
      '[data-name], [data-search-item], .name-card, .name-entry'
    );

    var activeFilter = 'all';

    // Debounced search handler
    var performSearch = debounce(function () {
      var query = searchInput.value.toLowerCase().trim();
      var visibleCount = 0;

      searchItems.forEach(function (item) {
        var name = (
          item.getAttribute('data-name') ||
          item.textContent ||
          ''
        ).toLowerCase();
        var gender = (item.getAttribute('data-gender') || '').toLowerCase();
        var origin = (item.getAttribute('data-origin') || '').toLowerCase();
        var meaning = (item.getAttribute('data-meaning') || '').toLowerCase();

        var matchesText =
          query === '' ||
          name.indexOf(query) !== -1 ||
          meaning.indexOf(query) !== -1 ||
          origin.indexOf(query) !== -1;

        var matchesFilter =
          activeFilter === 'all' ||
          gender === activeFilter ||
          item.classList.contains('filter-' + activeFilter);

        if (matchesText && matchesFilter) {
          item.style.display = '';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
      });

      if (noResults) {
        noResults.style.display = visibleCount === 0 ? '' : 'none';
      }
    }, CONFIG.DEBOUNCE_DELAY);

    searchInput.addEventListener('input', performSearch);

    // Filter buttons
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter') || 'all';
        performSearch();
      });
    });
  }

  // =========================================================================
  // TAB NAVIGATION
  // =========================================================================

  function initTabs() {
    var tabContainers = document.querySelectorAll(
      '[data-tabs], .tabs-container'
    );

    tabContainers.forEach(function (container) {
      var tabButtons = container.querySelectorAll(
        '[data-tab], .tab-btn, .tab-trigger'
      );
      var tabPanels = container.querySelectorAll(
        '[data-tab-panel], .tab-panel, .tab-content'
      );

      if (tabButtons.length === 0 || tabPanels.length === 0) return;

      tabButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-tab');

          // Deactivate all
          tabButtons.forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          tabPanels.forEach(function (panel) {
            panel.classList.remove('active');
            panel.style.display = 'none';
            panel.setAttribute('aria-hidden', 'true');
          });

          // Activate selected
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');

          var activePanel = container.querySelector(
            '[data-tab-panel="' + target + '"]'
          );
          if (activePanel) {
            activePanel.classList.add('active');
            activePanel.style.display = '';
            activePanel.setAttribute('aria-hidden', 'false');
          }
        });

        // Set ARIA attributes
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      });

      // Set up panel ARIA
      tabPanels.forEach(function (panel) {
        panel.setAttribute('role', 'tabpanel');
        if (!panel.classList.contains('active')) {
          panel.style.display = 'none';
          panel.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }

  // =========================================================================
  // BACK TO TOP BUTTON
  // =========================================================================

  function initBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML = '&#9650;';
    btn.style.cssText =
      'position:fixed;bottom:90px;right:20px;z-index:9998;' +
      'width:44px;height:44px;border-radius:50%;border:none;' +
      'background:#e91e8c;color:#fff;font-size:18px;cursor:pointer;' +
      'opacity:0;visibility:hidden;transition:opacity 0.3s,visibility 0.3s;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;' +
      'justify-content:center;';

    document.body.appendChild(btn);

    var scrollHandler = function () {
      if (window.pageYOffset > 400) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
      }
    };

    window.addEventListener('scroll', debounce(scrollHandler, 50), {
      passive: true,
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========================================================================
  // LAZY LOADING IMAGES
  // =========================================================================

  function initLazyLoading() {
    var images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;

    if (
      'IntersectionObserver' in window &&
      typeof IntersectionObserver === 'function'
    ) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var img = entry.target;
              img.src = img.getAttribute('data-src');
              var srcset = img.getAttribute('data-srcset');
              if (srcset) {
                img.srcset = srcset;
              }
              img.removeAttribute('data-src');
              img.removeAttribute('data-srcset');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '100px 0px',
          threshold: 0.01,
        }
      );

      images.forEach(function (img) {
        observer.observe(img);
      });
    } else {
      // Fallback: load all images immediately
      images.forEach(function (img) {
        img.src = img.getAttribute('data-src');
        var srcset = img.getAttribute('data-srcset');
        if (srcset) {
          img.srcset = srcset;
        }
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.classList.add('loaded');
      });
    }
  }

  // =========================================================================
  // READING TIME
  // =========================================================================

  function initReadingTime() {
    var article = document.querySelector(
      'article, .article-content, .post-content, main'
    );
    var display = document.querySelector(
      '[data-reading-time], #reading-time, .reading-time'
    );

    if (article && display) {
      var minutes = calculateReadingTime(article);
      display.textContent = minutes + ' min read';
    }
  }

  // =========================================================================
  // COUNTER ANIMATION ON SCROLL (bonus: uses animateCounter)
  // =========================================================================

  function initCounterAnimation() {
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    if (
      'IntersectionObserver' in window &&
      typeof IntersectionObserver === 'function'
    ) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var target = parseInt(el.getAttribute('data-count'), 10);
              if (!isNaN(target) && !el.classList.contains('counted')) {
                el.classList.add('counted');
                animateCounter(el, target);
              }
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(function (counter) {
        observer.observe(counter);
      });
    }
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    initNavigation();
    initCookieConsent();
    generateBreadcrumbs();
    initSmoothScroll();
    initFAQAccordion();
    initSearch();
    initTabs();
    initBackToTop();
    initLazyLoading();
    initReadingTime();
    initCounterAnimation();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // =========================================================================
  // PUBLIC API (expose to window for external use)
  // =========================================================================

  window.NeedsOfMoms = {
    formatDate: formatDate,
    daysBetween: daysBetween,
    addDays: addDays,
    getWeeksBetween: getWeeksBetween,
    formatNumber: formatNumber,
    debounce: debounce,
    animateCounter: animateCounter,
    calculateReadingTime: calculateReadingTime,
    trackEvent: trackEvent,
  };
})();
