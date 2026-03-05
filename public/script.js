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

  // --- PDF DOWNLOAD ---
  var downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
  }

  async function generatePDF() {
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      alert('PDF libraries are still loading. Please wait a moment and try again.');
      return;
    }

    var jsPDF = jspdf.jsPDF;

    downloadPdfBtn.disabled = true;
    var origHTML = downloadPdfBtn.innerHTML;
    downloadPdfBtn.innerHTML = 'Generating&hellip;';

    // Progress overlay
    var overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    overlay.innerHTML =
      '<div class="pdf-overlay__text">Generating PDF &mdash; <span id="pdfSlideProgress">0</span> / ' + totalSlides + '</div>' +
      '<div class="pdf-overlay__progress"><div class="pdf-overlay__bar" id="pdfProgressBar"></div></div>';
    document.body.appendChild(overlay);

    var pdfSlideProgress = document.getElementById('pdfSlideProgress');
    var pdfProgressBar = document.getElementById('pdfProgressBar');

    var savedIndex = currentIndex;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [vw, vh],
      compress: true
    });

    var navEl = document.getElementById('deckNav');
    var progressTrack = document.getElementById('progressTrack');

    for (var i = 0; i < totalSlides; i++) {
      pdfSlideProgress.textContent = (i + 1);
      pdfProgressBar.style.width = ((i + 1) / totalSlides * 100) + '%';

      slides.forEach(function (s, idx) {
        if (idx === i) {
          s.classList.add('active');
          s.style.opacity = '1';
          s.style.transform = 'translateX(0)';
          s.style.pointerEvents = 'auto';
          s.querySelectorAll('.animate-in').forEach(function (el) { el.classList.add('visible'); });
        } else {
          s.classList.remove('active');
          s.style.opacity = '0';
          s.style.transform = '';
          s.style.pointerEvents = 'none';
        }
      });

      await new Promise(function (r) { setTimeout(r, 250); });

      try {
        var canvas = await html2canvas(document.body, {
          width: vw,
          height: vh,
          windowWidth: vw,
          windowHeight: vh,
          scale: 2,
          useCORS: true,
          backgroundColor: '#000000',
          logging: false,
          ignoreElements: function (el) {
            return el === overlay || el === navEl || el === progressTrack;
          }
        });

        var imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (i > 0) {
          pdf.addPage([vw, vh], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, vw, vh);
      } catch (err) {
        console.error('Error capturing slide ' + (i + 1) + ':', err);
      }
    }

    // Restore original slide
    slides.forEach(function (s, idx) {
      if (idx === savedIndex) {
        s.classList.add('active');
        s.style.opacity = '1';
        s.style.transform = 'translateX(0)';
        s.style.pointerEvents = 'auto';
        s.querySelectorAll('.animate-in').forEach(function (el) { el.classList.add('visible'); });
      } else {
        s.classList.remove('active');
        s.style.opacity = '';
        s.style.transform = '';
        s.style.pointerEvents = '';
      }
    });

    currentIndex = savedIndex;
    updateUI();

    document.body.removeChild(overlay);

    downloadPdfBtn.disabled = false;
    downloadPdfBtn.innerHTML = origHTML;

    pdf.save('ASP-StrategyFirst-CompoMedema.pdf');
  }

})();
