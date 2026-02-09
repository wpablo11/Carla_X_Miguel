/* ========================================
   Main JavaScript
   - Horizontal scroll with GSAP ScrollTrigger
   - Envelope animation
   - RSVP form logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const isMobile = () => window.innerWidth <= 768;

  // ------------------------------------------
  // Horizontal Scroll (Desktop only)
  // ------------------------------------------
  function initHorizontalScroll() {
    if (isMobile()) return;

    const track = document.querySelector('.scroll-track');
    const panels = gsap.utils.toArray('.panel');
    const totalScroll = (panels.length - 1) * window.innerWidth;

    gsap.to(track, {
      x: () => -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: '.scroll-container',
        pin: true,
        scrub: 1,
        end: () => '+=' + totalScroll,
        invalidateOnRefresh: true,
      },
    });
  }

  // ------------------------------------------
  // Envelope Animation
  // ------------------------------------------
  function initEnvelopeAnimation() {
    const flap = document.querySelector('.envelope-flap');
    const letter = document.querySelector('.envelope-letter');
    const front = document.querySelector('.envelope-front');
    const indicator = document.querySelector('.scroll-indicator');
    const envelope = document.querySelector('.envelope');

    if (!flap || !letter || !envelope) return;

    // Get envelope height for calculating distances
    const getEnvelopeH = () => envelope.offsetHeight;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: isMobile() ? '.panel-envelope' : '.scroll-container',
        start: 'top top',
        end: '+=150',
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });

    // Phase 1: Fade out scroll indicator immediately
    tl.to(indicator, {
      opacity: 0,
      duration: 0.05,
    }, 0);

    // Phase 2: Flap opens (rotates backward)
    tl.to(flap, {
      rotateX: -180,
      duration: 0.25,
    }, 0);

    // Phase 3: Letter slides DOWN out of envelope — z-index above front
    tl.set(letter, { zIndex: 10 }, 0.2);
    tl.to(letter, {
      y: () => getEnvelopeH() * 0.85,
      duration: 0.45,
      ease: 'power1.out',
    }, 0.2);

    // Phase 4: Envelope body rises up and fades so letter is clearly visible below
    tl.to([front, document.querySelector('.envelope-back'), document.querySelector('.envelope-flap-wrapper')], {
      y: -40,
      opacity: 0.25,
      scale: 0.9,
      duration: 0.3,
    }, 0.5);

    // Phase 5: Letter scales up to be prominent
    tl.to(letter, {
      scale: 1.25,
      duration: 0.25,
      ease: 'power1.out',
    }, 0.65);
  }

  // ------------------------------------------
  // Text Section Animations
  // ------------------------------------------
  function initTextAnimations() {
    const textElements = document.querySelectorAll(
      '.text-title, .text-body, .text-quote, .text-author'
    );

    textElements.forEach((el, i) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: isMobile() ? 'top 85%' : 'left 80%',
          toggleActions: 'play none none none',
          containerAnimation: isMobile() ? undefined : ScrollTrigger.getAll().find(
            st => st.vars.trigger === '.scroll-container'
          )?.animation,
        },
      });
    });
  }

  // ------------------------------------------
  // Details Section Animations
  // ------------------------------------------
  function initDetailsAnimations() {
    const rows = document.querySelectorAll('.details-row');

    rows.forEach((row, i) => {
      gsap.from(row, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: row,
          start: isMobile() ? 'top 85%' : 'left 80%',
          toggleActions: 'play none none none',
          containerAnimation: isMobile() ? undefined : ScrollTrigger.getAll().find(
            st => st.vars.trigger === '.scroll-container'
          )?.animation,
        },
      });
    });
  }

  // ------------------------------------------
  // RSVP Form Logic
  // ------------------------------------------
  function initRSVPForm() {
    const form = document.getElementById('rsvp-form');
    const guestsGroup = document.getElementById('guests-group');
    const attendingRadios = document.querySelectorAll('input[name="attending"]');
    const successEl = document.getElementById('rsvp-success');
    const successText = document.getElementById('success-text');

    // Show/hide guests based on attendance
    attendingRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
          guestsGroup.style.display = 'block';
          gsap.from(guestsGroup, { height: 0, opacity: 0, duration: 0.3 });
        } else {
          guestsGroup.style.display = 'none';
        }
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous errors
      clearErrors();

      // Validate
      const name = form.querySelector('#rsvp-name').value.trim();
      const email = form.querySelector('#rsvp-email').value.trim();
      const attending = form.querySelector('input[name="attending"]:checked');
      let valid = true;

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

      // Collect data
      const guests = attending.value === 'yes'
        ? parseInt(form.querySelector('#rsvp-guests').value, 10)
        : 0;

      const data = {
        name,
        email,
        attending: attending.value,
        guests,
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage
      const rsvps = JSON.parse(localStorage.getItem('wedding-rsvps') || '[]');
      rsvps.push(data);
      localStorage.setItem('wedding-rsvps', JSON.stringify(rsvps));

      // Show success
      form.style.display = 'none';

      if (attending.value === 'yes') {
        const guestText = guests > 0
          ? ` con ${guests} acompañante${guests > 1 ? 's' : ''}`
          : '';
        successText.textContent =
          `${name}, hemos registrado tu confirmación${guestText}. ¡Nos vemos en la boda!`;
      } else {
        successText.textContent =
          `${name}, lamentamos que no puedas asistir. ¡Te echaremos de menos!`;
      }

      successEl.style.display = 'block';
      gsap.from(successEl, { y: 20, opacity: 0, duration: 0.5 });
    });
  }

  function showError(id, message, inputSelector) {
    const errorEl = document.getElementById(id);
    if (errorEl) errorEl.textContent = message;
    if (inputSelector) {
      const input = document.querySelector(inputSelector);
      if (input) input.classList.add('input-error');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ------------------------------------------
  // Initialize everything
  // ------------------------------------------
  initHorizontalScroll();
  initEnvelopeAnimation();
  initRSVPForm();

  // Delay content animations so horizontal scroll is set up first
  requestAnimationFrame(() => {
    initTextAnimations();
    initDetailsAnimations();
  });

  // Handle resize — rebuild ScrollTrigger
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      initHorizontalScroll();
      initEnvelopeAnimation();
      requestAnimationFrame(() => {
        initTextAnimations();
        initDetailsAnimations();
      });
    }, 300);
  });
});
