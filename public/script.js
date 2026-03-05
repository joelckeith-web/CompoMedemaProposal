/* =============================================
   ASP PITCH DECK — SLIDE ENGINE
   Strategy First: Compo & Medema Group
   ============================================= */

(function () {
  'use strict';

  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentIndex = 0;
  let isAnimating = false;

  // DOM refs
  const progressBar = document.getElementById('progressBar');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const currentSlideEl = document.getElementById('currentSlide');
  const totalSlidesEl = document.getElementById('totalSlides');

  // Zero-pad helper
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Detect mobile
  const MOBILE_BP = 768;
  const isMobile = window.matchMedia('(max-width: ' + MOBILE_BP + 'px)').matches;

  // Init
  totalSlidesEl.textContent = pad(totalSlides);

  // --- SHARED HELPERS ---
  function updateUI() {
    currentSlideEl.textContent = pad(currentIndex + 1);
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === totalSlides - 1;
    var pct = ((currentIndex + 1) / totalSlides) * 100;
    progressBar.style.width = pct + '%';
  }

  function triggerAnimations(slide) {
    var els = slide.querySelectorAll('.animate-in');
    els.forEach(function (el) {
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function () {
        el.classList.add('visible');
      }, delay + 100);
    });
  }

  function resetAnimations(slide) {
    var els = slide.querySelectorAll('.animate-in');
    els.forEach(function (el) {
      el.classList.remove('visible');
    });
  }

  /* =============================================
     MOBILE — Continuous scroll mode
     ============================================= */
  if (isMobile) {
    document.body.classList.add('mobile-scroll');

    slides.forEach(function (s) {
      s.classList.add('active');
    });

    var scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          var idx = Array.prototype.indexOf.call(slides, entry.target);
          if (idx !== -1) {
            currentIndex = idx;
            updateUI();
          }
        }
      });
    }, { root: null, threshold: 0.3 });

    slides.forEach(function (s) { scrollObserver.observe(s); });

    var animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var slide = entry.target.closest('.slide');
          if (slide) triggerAnimations(slide);
          animObserver.unobserve(entry.target);
        }
      });
    }, { root: null, threshold: 0.15 });

    slides.forEach(function (s) { animObserver.observe(s); });

    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        var pct = (scrollTop / docHeight) * 100;
        progressBar.style.width = Math.min(pct, 100) + '%';
      }
    }, { passive: true });

    updateUI();
    triggerAnimations(slides[0]);

  /* =============================================
     DESKTOP — Slide-based navigation
     ============================================= */
  } else {
    updateUI();
    triggerAnimations(slides[0]);

    function goToSlide(index) {
      if (isAnimating || index === currentIndex || index < 0 || index >= totalSlides) return;
      isAnimating = true;

      var outgoing = slides[currentIndex];
      var incoming = slides[index];
      var direction = index > currentIndex ? 1 : -1;

      outgoing.classList.remove('active');
      outgoing.style.transform = 'translateX(' + (direction * -60) + 'px)';
      outgoing.style.opacity = '0';

      setTimeout(function () {
        outgoing.style.transform = '';
        outgoing.style.opacity = '';
        resetAnimations(outgoing);
      }, 500);

      incoming.style.transform = 'translateX(' + (direction * 60) + 'px)';
      incoming.style.opacity = '0';
      void incoming.offsetWidth;
      incoming.classList.add('active');

      requestAnimationFrame(function () {
        incoming.style.transform = 'translateX(0)';
        incoming.style.opacity = '1';
        triggerAnimations(incoming);
      });

      currentIndex = index;
      updateUI();

      setTimeout(function () {
        isAnimating = false;
      }, 550);
    }

    function next() { goToSlide(currentIndex + 1); }
    function prev() { goToSlide(currentIndex - 1); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    });

    // Touch / Swipe
    var touchStartX = 0;
    var touchStartY = 0;

    document.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].screenX - touchStartX;
      var dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
    }, { passive: true });

    // Mouse wheel
    var wheelTimer = null;
    document.addEventListener('wheel', function (e) {
      if (wheelTimer) return;
      wheelTimer = setTimeout(function () { wheelTimer = null; }, 800);
      if (e.deltaY > 0 || e.deltaX > 0) next();
      else if (e.deltaY < 0 || e.deltaX < 0) prev();
    }, { passive: true });
  }

})();
