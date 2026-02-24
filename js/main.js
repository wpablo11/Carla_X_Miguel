/* ========================================
   Main JavaScript — Carga optimizada con AJAX
   - Lazy-load de animaciones con IntersectionObserver (móvil)
   - Inicialización directa con containerAnimation (desktop)
   - Horizontal scroll con GSAP ScrollTrigger
   - Envelope animation
   - RSVP form logic
   ======================================== */

(function() {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  var isMobile = function() { return window.innerWidth <= 768; };

  // Control de secciones ya inicializadas (evita re-init innecesario)
  var initialized = {
    envelope: false,
    text: false,
    details: false,
    rsvp: false,
    horizontalScroll: false,
  };

  // Referencia a la animación horizontal para containerAnimation
  var horizontalAnimation = null;

  // Confeti: control para evitar lanzamientos simultáneos
  var confettiActive = false;

  // ------------------------------------------
  // Horizontal Scroll (Desktop only)
  // ------------------------------------------
  function initHorizontalScroll() {
    if (isMobile()) return null;
    if (initialized.horizontalScroll) return horizontalAnimation;

    var track = document.querySelector('.scroll-track');
    var panels = gsap.utils.toArray('.panel');
    var totalScroll = (panels.length - 1) * window.innerWidth;

    var tween = gsap.to(track, {
      x: function() { return -totalScroll; },
      ease: 'none',
      scrollTrigger: {
        trigger: '.scroll-container',
        pin: true,
        scrub: 1,
        end: function() { return '+=' + totalScroll; },
        invalidateOnRefresh: true,
      },
    });

    initialized.horizontalScroll = true;
    horizontalAnimation = tween;
    return tween;
  }

  // ------------------------------------------
  // Confetti Burst
  // ------------------------------------------
  function launchConfetti() {
    if (confettiActive) return;
    confettiActive = true;

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var colors = ['#F2D7D5', '#C9929B', '#F5E6CC', '#A8B5A2', '#d4a0aa', '#e8c8a0', '#ffffff'];
    var numParticles = 150;

    // Origen: centro de la pantalla (donde está la carta)
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    for (var i = 0; i < numParticles; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 7 + 3;
      var size = Math.random() * 8 + 4;
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        w: size,
        h: size * (0.4 + Math.random() * 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        wobbleOffset: Math.random() * Math.PI * 2,
      });
    }

    var startTime = Date.now();
    var duration = 4000;
    var fadeStart = 2800;

    function animate() {
      var elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        canvas.parentNode.removeChild(canvas);
        confettiActive = false;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var globalAlpha = elapsed > fadeStart
        ? 1 - (elapsed - fadeStart) / (duration - fadeStart)
        : 1;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.x += Math.sin(elapsed * 0.002 + p.wobbleOffset) * 0.5;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = globalAlpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // ------------------------------------------
  // Envelope Animation
  // ------------------------------------------
  function initEnvelopeAnimation() {
    if (initialized.envelope) return;

    var flap = document.querySelector('.envelope-flap');
    var letter = document.querySelector('.envelope-letter');
    var front = document.querySelector('.envelope-front');
    var indicator = document.querySelector('.scroll-indicator');
    var envelope = document.querySelector('.envelope');

    if (!flap || !letter || !envelope) return;

    var getEnvelopeH = function() { return envelope.offsetHeight; };
    var mobile = isMobile();

    var confettiTriggered = false;
    var onEnvelopeUpdate = function(self) {
      if (self.progress >= 0.95 && !confettiTriggered && self.direction > 0) {
        confettiTriggered = true;
        launchConfetti();
      }
      if (self.progress < 0.5) {
        confettiTriggered = false;
      }
    };

    var stConfig = mobile ? {
      trigger: '.panel-envelope',
      start: 'top top',
      end: '+=150',
      scrub: 0.3,
      invalidateOnRefresh: true,
      onUpdate: onEnvelopeUpdate,
    } : {
      trigger: '.panel-envelope',
      start: 'left left',
      end: '20% left',
      scrub: 0.3,
      invalidateOnRefresh: true,
      containerAnimation: horizontalAnimation,
      onUpdate: onEnvelopeUpdate,
    };

    var tl = gsap.timeline({ scrollTrigger: stConfig });

    tl.to(indicator, { opacity: 0, duration: 0.05 }, 0);

    tl.to(flap, { rotateX: -180, duration: 0.25 }, 0);

    tl.set(letter, { zIndex: 10 }, 0.2);
    tl.to(letter, { opacity: 1, duration: 0.15 }, 0.2);
    tl.to(letter, {
      y: function() { return getEnvelopeH() * 0.85; },
      duration: 0.45,
      ease: 'power1.out',
    }, 0.2);

    tl.to([front, document.querySelector('.envelope-back'), document.querySelector('.envelope-flap-wrapper')], {
      y: -40,
      opacity: 0.25,
      scale: 0.9,
      duration: 0.3,
    }, 0.5);

    tl.to(letter, {
      scale: 1.25,
      duration: 0.25,
      ease: 'power1.out',
    }, 0.65);

    initialized.envelope = true;
  }

  // ------------------------------------------
  // Text Section Animations
  // ------------------------------------------
  function initTextAnimations() {
    if (initialized.text) return;

    var textElements = document.querySelectorAll(
      '.text-title, .text-body, .text-quote, .text-author'
    );

    textElements.forEach(function(el, i) {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: i * 0.15,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: el,
            start: isMobile() ? 'top 85%' : 'left 80%',
            toggleActions: 'play none none reset',
            containerAnimation: isMobile() ? undefined : horizontalAnimation,
          },
        }
      );
    });

    initialized.text = true;
  }

  // ------------------------------------------
  // Details Section Animations
  // ------------------------------------------
  function initDetailsAnimations() {
    if (initialized.details) return;

    var rows = document.querySelectorAll('.details-row');

    rows.forEach(function(row, i) {
      gsap.fromTo(row,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: i * 0.1,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: row,
            start: isMobile() ? 'top 85%' : 'left 80%',
            toggleActions: 'play none none reset',
            containerAnimation: isMobile() ? undefined : horizontalAnimation,
          },
        }
      );
    });

    initialized.details = true;
  }

  // ------------------------------------------
  // RSVP Form Logic
  // ------------------------------------------
  function initRSVPForm() {
    if (initialized.rsvp) return;

    var form = document.getElementById('rsvp-form');
    var guestsGroup = document.getElementById('guests-group');
    var attendingRadios = document.querySelectorAll('input[name="attending"]');
    var successEl = document.getElementById('rsvp-success');
    var successText = document.getElementById('success-text');

    if (!form) return;

    attendingRadios.forEach(function(radio) {
      radio.addEventListener('change', function(e) {
        if (e.target.value === 'yes') {
          guestsGroup.style.display = 'block';
          gsap.from(guestsGroup, { height: 0, opacity: 0, duration: 0.3 });
        } else {
          guestsGroup.style.display = 'none';
        }
      });
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      clearErrors();

      var name = form.querySelector('#rsvp-name').value.trim();
      var email = form.querySelector('#rsvp-email').value.trim();
      var attending = form.querySelector('input[name="attending"]:checked');
      var valid = true;

      if (!name) {
        showError('error-name', 'Por favor, introduce tu nombre', '#rsvp-name');
        valid = false;
      }

      if (!email || !isValidEmail(email)) {
        showError('error-email', 'Por favor, introduce un email válido', '#rsvp-email');
        valid = false;
      }

      if (!attending) {
        showError('error-attending', 'Por favor, selecciona una opción');
        valid = false;
      }

      if (!valid) return;

      var guests = attending.value === 'yes'
        ? parseInt(form.querySelector('#rsvp-guests').value, 10)
        : 0;

      var attendingText = attending.value === 'yes' ? 'Sí, asistirá' : 'No asistirá';
      var guestLabel = guests > 0 ? guests + ' acompañante' + (guests > 1 ? 's' : '') : 'Sin acompañantes';

      // Deshabilitar botón mientras se envía
      var submitBtn = form.querySelector('.btn-submit');
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;

      // Enviar al email via FormSubmit.co
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://formsubmit.co/ajax/pablovillalonga1@gmail.com', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Guardar en localStorage como respaldo
          var rsvps = JSON.parse(localStorage.getItem('wedding-rsvps') || '[]');
          rsvps.push({ name: name, email: email, attending: attending.value, guests: guests, timestamp: new Date().toISOString() });
          localStorage.setItem('wedding-rsvps', JSON.stringify(rsvps));

          // Mostrar éxito
          form.style.display = 'none';

          if (attending.value === 'yes') {
            var guestText = guests > 0
              ? ' con ' + guests + ' acompañante' + (guests > 1 ? 's' : '')
              : '';
            successText.textContent =
              name + ', hemos registrado tu confirmación' + guestText + '. ¡Nos vemos en la boda!';
          } else {
            successText.textContent =
              name + ', lamentamos que no puedas asistir. ¡Te echaremos de menos!';
          }

          successEl.style.display = 'block';
          gsap.from(successEl, { y: 20, opacity: 0, duration: 0.5 });
        } else {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
          showError('error-name', 'Hubo un error al enviar. Por favor, inténtalo de nuevo.');
        }
      };

      xhr.onerror = function() {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        showError('error-name', 'Error de conexión. Por favor, inténtalo de nuevo.');
      };

      xhr.send(JSON.stringify({
        Nombre: name,
        Email: email,
        Asistencia: attendingText,
        'Acompañantes': guestLabel,
        _subject: 'RSVP Boda: ' + name + ' - ' + attendingText,
        _template: 'table',
      }));
    });

    initialized.rsvp = true;
  }

  // ------------------------------------------
  // Helpers
  // ------------------------------------------
  function showError(id, message, inputSelector) {
    var errorEl = document.getElementById(id);
    if (errorEl) errorEl.textContent = message;
    if (inputSelector) {
      var input = document.querySelector(inputSelector);
      if (input) input.classList.add('input-error');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(function(el) { el.textContent = ''; });
    document.querySelectorAll('.input-error').forEach(function(el) { el.classList.remove('input-error'); });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ------------------------------------------
  // IntersectionObserver — Lazy init solo en MÓVIL
  // En desktop no funciona bien porque los paneles
  // están en fila horizontal transformados con GSAP
  // ------------------------------------------
  function setupMobileLazyInit() {
    var observerOptions = {
      root: null,
      rootMargin: '200px',
      threshold: 0.01,
    };

    var sectionMap = {
      'envelope-section': initEnvelopeAnimation,
      'text-section': initTextAnimations,
      'details-section': initDetailsAnimations,
      'rsvp-section': initRSVPForm,
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var initFn = sectionMap[entry.target.id];
          if (initFn) {
            requestAnimationFrame(initFn);
            observer.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);

    Object.keys(sectionMap).forEach(function(id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  // ------------------------------------------
  // Inicialización
  // ------------------------------------------
  function init() {
    if (isMobile()) {
      // MÓVIL: lazy-load con IntersectionObserver (scroll vertical)
      setupMobileLazyInit();
    } else {
      // DESKTOP: inicializar todo en orden correcto
      // 1. Horizontal scroll primero (necesario para containerAnimation)
      initHorizontalScroll();

      // 2. Esperar a que ScrollTrigger procese el horizontal scroll
      ScrollTrigger.refresh();

      // 3. Ahora inicializar las animaciones que dependen de containerAnimation
      requestAnimationFrame(function() {
        initEnvelopeAnimation();
        initTextAnimations();
        initDetailsAnimations();
        initRSVPForm();
      });
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle resize — rebuild ScrollTrigger
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      ScrollTrigger.getAll().forEach(function(st) { st.kill(); });

      // Reset estado para re-init
      initialized.horizontalScroll = false;
      initialized.envelope = false;
      initialized.text = false;
      initialized.details = false;
      initialized.rsvp = false;
      horizontalAnimation = null;

      init();
    }, 300);
  });

})();
