/* ------------------------------------------------------------------
   CTA LINKS — replace these two placeholders when the real links exist.
   tally:   every "Get Started" / plan button opens this Tally form.
   booking: "Talk to our team" links go here.
   After a Tally submission the site itself opens thank-you.html, which then
   forwards to the Brevo booking page, so leave Tally's own "Redirect on
   completion" setting OFF.
   Until a value starts with http, buttons fall back to their in-page link.
------------------------------------------------------------------- */
const LINKS = {
  tally: 'https://tally.so/r/pebVRy',
  booking: 'BOOKING_CALL_PAGE_LINK_HERE',
};

(() => {
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  /* CTA links */
  document.querySelectorAll('[data-link]').forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url && /^https?:\/\//.test(url)) a.href = url;
  });

  /* Tally popup: every [data-link="tally"] button opens the same form in one shared modal
     (Tally's official embed URL in an iframe). Without <dialog> support or JS, the link
     above still opens the form page. Closes with X, Escape or a click outside. */
  const tallyId = (LINKS.tally.match(/tally\.so\/r\/([\w-]+)/) || [])[1];
  let tallyDlg = null;
  /* After Tally itself confirms a submission it posts "Tally.FormSubmitted" to this page.
     Only then do we mark the enquiry as sent (for this tab) and go to the Thank You page. */
  let tallySent = false;
  window.addEventListener('message', (e) => {
    if (tallySent || e.origin !== 'https://tally.so' || typeof e.data !== 'string' || !e.data.includes('Tally.FormSubmitted')) return;
    let msg = null;
    try { msg = JSON.parse(e.data); } catch (err) { return; }
    if (!msg || msg.event !== 'Tally.FormSubmitted') return;
    tallySent = true;
    try { sessionStorage.setItem('wc-enquiry-sent', String(Date.now())); } catch (err) { /* storage blocked: page still loads */ }
    window.location.href = 'thank-you.html';
  });
  const openTally = () => {
    if (!tallyDlg) {
      tallyDlg = document.createElement('dialog');
      tallyDlg.className = 'tf-dlg';
      tallyDlg.setAttribute('aria-label', 'Get started with Webchirpy');
      tallyDlg.innerHTML = '<button class="tf-close" type="button" aria-label="Close form">&times;</button>'
        + `<iframe src="https://tally.so/embed/${tallyId}?alignLeft=1&transparentBackground=1" title="Webchirpy enquiry form" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0"></iframe>`;
      document.body.appendChild(tallyDlg);
      tallyDlg.querySelector('.tf-close').addEventListener('click', () => tallyDlg.close());
      tallyDlg.addEventListener('click', (e) => { if (e.target === tallyDlg) tallyDlg.close(); });
      tallyDlg.addEventListener('close', () => document.documentElement.classList.remove('tf-open'));
    }
    document.documentElement.classList.add('tf-open');
    tallyDlg.showModal();
  };
  if (tallyId && typeof HTMLDialogElement === 'function') {
    document.querySelectorAll('[data-link="tally"]').forEach((a) => a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let new-tab clicks open the form page
      e.preventDefault();
      openTally();
    }));
  }

  const hdr = document.querySelector('.hdr');
  const hero = document.querySelector('.hero');

  /* mobile menu */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    const setMenu = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
    };
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* hero "See Our Work": a small menu of the three work pages */
  document.querySelectorAll('.work-menu').forEach((wm) => {
    const btn = wm.querySelector('button');
    const setOpen = (open) => { wm.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!wm.classList.contains('open')); });
    document.addEventListener('click', (e) => { if (!wm.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wm.classList.contains('open')) { setOpen(false); btn.focus(); } });
  });

  /* active nav link (in-page links only) */
  const links = nav ? [...nav.querySelectorAll('a[href^="#"]:not(.btn)')] : [];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));
  const spy = () => {
    if (!links.length) return;
    // highlight the section whose top is closest above the reading line (works in any section order)
    const y = window.scrollY + 160;
    let cur = 0, best = -Infinity;
    targets.forEach((t, i) => {
      if (!t || i === 0) return;
      const top = t.getBoundingClientRect().top + window.scrollY;
      if (top <= y && top > best) { best = top; cur = i; }
    });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  };

  /* hero showcase: five category slides on fixed slots; selecting one swaps it into the centre */
  const deckSlides = [...document.querySelectorAll('.deck .hc[data-slot]')];
  if (deckSlides.length) {
    // x, y, rotation, z-index, scale for each slot (left → right)
    // four equal cards on one circular arc (radius ~2450px, cards at ±2.5° and ±7.5°):
    // equal spacing, each card turned to follow the arc, neighbours' bottom corners just touching
    const SLOTS = [[-320, 21, -7.5, 1, 1], [-107, 2, -2.5, 2, 1], [107, 2, 2.5, 2, 1], [320, 21, 7.5, 1, 1]];
    const CENTER = '2';
    const place = () => deckSlides.forEach((f) => {
      const [x, y, r, z, sc] = SLOTS[Number(f.dataset.slot)];
      f.style.setProperty('--x', `${x}px`);
      f.style.setProperty('--y', `${y}px`);
      f.style.setProperty('--r', `${r}deg`);
      f.style.setProperty('--z', z);
      f.style.setProperty('--s', sc);
      const center = f.dataset.slot === CENTER;
      f.classList.toggle('is-center', center);
      f.setAttribute('aria-pressed', String(center));
    });
    // phones: the deck is a swipeable row, so a selected card scrolls to the middle instead
    const deck = document.querySelector('.deck');
    const mobile = window.matchMedia('(max-width: 720px)');
    const centerOn = (f, smooth) => deck.scrollTo({ left: f.offsetLeft - (deck.clientWidth - f.offsetWidth) / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    if (mobile.matches) {
      const start = () => centerOn(deckSlides.find((g) => g.dataset.slot === CENTER), false);
      start();
      window.addEventListener('load', start);
    }
    const feature = (f) => {
      // the cards are equal, so nothing is reordered; on phones a tapped card slides to the middle
      if (mobile.matches) centerOn(f, true);
    };
    deckSlides.forEach((f) => {
      f.addEventListener('click', () => feature(f));
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); feature(f); } });
    });
    place();
  }

  /* carousel ([data-carousel]): --n cards in view (set in CSS), advances one card at a time
     on its own; pauses on hover, focus or while off screen. The first cards are cloned at the
     end so the loop runs forward without rewinding. */
  document.querySelectorAll('[data-carousel]').forEach((cr) => {
    const track = cr.querySelector('.cr-track');
    const cards = [...track.children];
    const total = cards.length;
    cards.slice(0, 3).forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('img').forEach((im) => { im.alt = ''; im.loading = 'eager'; });
      track.appendChild(c);
    });
    const dotsBox = cr.querySelector('.cr-dots');
    const dots = cards.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Show slide ${i + 1} of ${total}`);
      b.addEventListener('click', () => { go(i); hold(); });
      dotsBox.appendChild(b);
      return b;
    });
    let idx = 0, step = 0, visible = false, hover = false, focus = false, holdUntil = 0;
    const hold = (ms = 5000) => { holdUntil = performance.now() + ms; };
    const measure = () => { step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0); };
    const render = (animate = true) => {
      track.classList.toggle('no-anim', !animate);
      track.style.setProperty('--cx', (idx * step).toFixed(1));
      dots.forEach((d, i) => { d.classList.toggle('on', i === idx % total); d.setAttribute('aria-current', String(i === idx % total)); });
      if (!animate) { void track.offsetWidth; track.classList.remove('no-anim'); }
    };
    const go = (i) => { idx = i; render(!reduce); if (reduce) wrapEnd(); };
    // after sliding onto the clones, jump back to the matching original without animation
    const wrapEnd = () => { if (idx >= total) { idx -= total; render(false); } };
    track.addEventListener('transitionend', (e) => { if (e.target === track) wrapEnd(); });
    const next = () => { wrapEnd(); go(idx + 1); };
    const prev = () => {
      if (idx === 0) { idx = total; render(false); }
      go(idx - 1);
    };
    cr.querySelectorAll('.tn-btn').forEach((b) => b.addEventListener('click', () => { hold(); (Number(b.dataset.dir) > 0 ? next : prev)(); }));
    cr.addEventListener('mouseenter', () => { hover = true; });
    cr.addEventListener('mouseleave', () => { hover = false; hold(1200); });
    cr.addEventListener('focusin', () => { focus = true; });
    cr.addEventListener('focusout', () => { focus = false; hold(); });
    let tx = null;
    track.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; hold(); }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.3 }).observe(cr);
    setInterval(() => {
      if (!reduce && visible && !hover && !focus && !document.hidden && performance.now() > holdUntil) next();
    }, 3400);
    window.addEventListener('resize', () => { measure(); render(false); });
    measure();
    render(false);
  });

  /* portfolio carousel ([data-wc]): equal cards, --n in view (CSS). On desktop the carousel pins
     while you scroll and the cards slide right → left with the scroll; the arrows jump the page to
     the matching point, and the page carries on normally after the last card. On smaller screens
     (or with reduced motion) it is a plain carousel: arrows, swipe and arrow keys. */
  document.querySelectorAll('[data-wc]').forEach((wc) => {
    const track = wc.querySelector('.wc-track');
    const cards = [...track.children];
    const prevB = wc.querySelector('.tn-btn[data-dir="-1"]');
    const nextB = wc.querySelector('.tn-btn[data-dir="1"]');
    const count = wc.querySelector('.wc-count b');
    const spacer = document.createElement('div');
    spacer.className = 'wc-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    wc.after(spacer);
    const PX_PER_CARD = 420; // page scroll needed to move one card
    let pos = 0; // carousel position in cards (fractional while scrolling)
    let pinned = false, travel = 0, stickyTop = 0;
    const perView = () => Math.max(1, parseInt(getComputedStyle(wc).getPropertyValue('--n'), 10) || 1);
    const maxIdx = () => Math.max(0, cards.length - perView());
    const stepW = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    const startY = () => spacer.getBoundingClientRect().top + window.scrollY - wc.offsetHeight - stickyTop;
    const paint = (animate) => {
      pos = Math.max(0, Math.min(maxIdx(), pos));
      const idx = Math.round(pos);
      track.classList.toggle('wc-live', !animate);
      track.style.setProperty('--wx', (pos * stepW()).toFixed(1));
      wc.style.setProperty('--wp', (perView() / cards.length).toFixed(3));
      wc.style.setProperty('--wo', (pos / cards.length).toFixed(3));
      prevB.disabled = idx === 0;
      nextB.disabled = idx >= maxIdx();
      if (count) count.textContent = String(idx + 1).padStart(2, '0');
      cards.forEach((c, i) => {
        const shown = i >= idx && i < idx + perView();
        c.toggleAttribute('inert', !shown);
        c.classList.toggle('is-off', !shown);
      });
    };
    const onScroll = () => {
      if (!pinned) return;
      const p = Math.max(0, Math.min(1, (window.scrollY - startY()) / travel));
      pos = p * maxIdx();
      paint(false);
    };
    const layout = () => {
      wc.classList.remove('wc-pin');
      wc.style.top = '';
      spacer.style.height = '0px';
      const vh = window.innerHeight;
      const hh = hdr ? hdr.offsetHeight : 0;
      const h = wc.offsetHeight;
      pinned = !reduce && window.innerWidth >= 1000 && maxIdx() > 0 && hh + h + 32 <= vh;
      if (pinned) {
        travel = maxIdx() * PX_PER_CARD;
        stickyTop = Math.max(hh + 16, hh + (vh - hh - h) / 2);
        wc.classList.add('wc-pin');
        wc.style.top = `${stickyTop}px`;
        spacer.style.height = `${travel}px`;
        onScroll();
      } else {
        pos = Math.round(pos);
        paint(true);
      }
    };
    const go = (d) => {
      const target = Math.max(0, Math.min(maxIdx(), Math.round(pos) + d));
      if (pinned) {
        window.scrollTo({ top: startY() + (target / maxIdx()) * travel, behavior: reduce ? 'auto' : 'smooth' });
      } else {
        pos = target;
        paint(true);
      }
    };
    prevB.addEventListener('click', () => go(-1));
    nextB.addEventListener('click', () => go(1));
    wc.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    let tx = null;
    track.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking || !pinned) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; onScroll(); });
    }, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  });

  /* stats: each figure counts up from 0 the first time it scrolls into view */
  const counters = [...document.querySelectorAll('.ct[data-count]')];
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    const run = (el) => {
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const DUR = 2000;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / DUR);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3)))); // 0 → value, easing out
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    counters.forEach((el) => {
      el.textContent = '0';
    });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* one-shot reveals: .rv (fade up) and .rv-card (card slide-up) */
  const rv = [...document.querySelectorAll('.rv, .rv-card')];
  if (!reduce && 'IntersectionObserver' in window) {
    const vh = window.innerHeight;
    rv.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.9) el.classList.add('pre'); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.remove('pre');
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  }

  /* horizontal strips (.hs). [data-pin-strip]: on desktop the heading scrolls normally,
     then the card strip pins (centred under the header) and vertical scrolling slides it
     left until the last card is fully in view, after which the page continues. Where the
     strip can't fit on screen it falls back to a native swipeable strip. */
  const strips = [...document.querySelectorAll('.hs')].map((el) => ({
    el,
    wrap: el.querySelector('.track-wrap'),
    track: el.querySelector('.track'),
    pin: el.querySelector('.hs-pin'),
    head: el.querySelector('.head'),
    curve: [...el.querySelectorAll('.curve > li')],
    pinnable: el.hasAttribute('data-pin-strip'),
    travel: 0,
    start: 0,
    stickyTop: 0,
  }));
  const END_HOLD = 48; // px of scroll the finished strip stays pinned before releasing
  const setupPins = () => {
    strips.forEach((s) => {
      if (!s.pinnable) return;
      // measure with the pinned layout applied, from a clean state
      s.el.classList.add('pinned');
      s.el.style.height = '';
      s.track.style.removeProperty('--tx');
      const vh = window.innerHeight;
      const hh = hdr.offsetHeight;
      const pinH = s.pin.offsetHeight;
      const fits = !reduce && window.innerWidth >= 1000 && hh + pinH <= vh;
      if (!fits) {
        s.el.classList.remove('pinned');
        s.travel = 0;
        return;
      }
      s.travel = Math.max(0, s.track.scrollWidth - document.documentElement.clientWidth);
      s.stickyTop = Math.max(hh, hh + (vh - hh - pinH) / 2);
      // natural (un-stuck) offset of the strip inside the section: right after the heading
      s.start = s.head.offsetTop + s.head.offsetHeight + parseFloat(getComputedStyle(s.head).marginBottom);
      s.el.style.setProperty('--pin-top', `${s.stickyTop}px`);
      s.el.style.height = `${s.start + pinH + s.travel + END_HOLD}px`;
    });
  };
  strips.forEach((s) => {
    s.wrap.addEventListener('scroll', () => {
      if (s.el.classList.contains('pinned')) return;
      const max = s.wrap.scrollWidth - s.wrap.clientWidth;
      s.el.style.setProperty('--tp', max > 0 ? (s.wrap.scrollLeft / max).toFixed(3) : 0);
      bend(s);
    }, { passive: true });
  });
  /* curve: cards dip and tilt slightly the further they are from the screen centre */
  const bend = (s) => {
    if (reduce || !s.curve.length) return;
    const mid = window.innerWidth / 2;
    s.curve.forEach((li) => {
      const r = li.getBoundingClientRect();
      const c = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - mid) / mid));
      li.style.setProperty('--cy', `${(c * c * 34).toFixed(1)}px`);
      li.style.setProperty('--cr', `${(c * 3.2).toFixed(2)}deg`);
    });
  };

  /* auto-scrolling strip ([data-auto]): the cards are duplicated once so the loop is
     seamless; it pauses on hover, focus, touch or drag and resumes shortly after */
  strips.filter((s) => s.el.hasAttribute('data-auto')).forEach((s) => {
    const { el, wrap, track } = s;
    const originals = [...track.children];
    originals.forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button').forEach((n) => n.setAttribute('tabindex', '-1'));
      c.querySelectorAll('.rv-card, .pre').forEach((n) => n.classList.remove('rv-card', 'pre'));
      track.appendChild(c);
    });
    s.curve = [...track.children];
    let setW = 0;
    const measure = () => { setW = track.children[originals.length].offsetLeft - originals[0].offsetLeft; };
    measure();
    window.addEventListener('resize', measure);

    const SPEED = 34; // px per second
    let pos = wrap.scrollLeft, last = 0, visible = false, hover = false, focus = false, holdUntil = 0;
    const hold = (ms = 2600) => { holdUntil = performance.now() + ms; };
    const running = () => !reduce && visible && !hover && !focus && performance.now() > holdUntil;

    const tick = (t) => {
      const dt = last ? Math.min(64, t - last) / 1000 : 0;
      last = t;
      if (running() && setW > 0) {
        if (wrap.scrollLeft >= setW) wrap.scrollLeft -= setW;
        pos = (Math.abs(wrap.scrollLeft - pos) > 2 ? wrap.scrollLeft : pos) + SPEED * dt;
        if (pos >= setW) pos -= setW;
        wrap.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    wrap.addEventListener('scroll', () => {
      if (setW > 0) el.style.setProperty('--tp', ((wrap.scrollLeft % setW) / setW).toFixed(3));
    }, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(el);
    wrap.addEventListener('mouseenter', () => { hover = true; });
    wrap.addEventListener('mouseleave', () => { hover = false; hold(600); });
    el.addEventListener('focusin', () => { focus = true; });
    el.addEventListener('focusout', () => { focus = false; hold(); });
    ['touchstart', 'wheel'].forEach((ev) => wrap.addEventListener(ev, () => hold(), { passive: true }));

    /* mouse drag (touch already scrolls natively) */
    let drag = null;
    wrap.addEventListener('pointerdown', (e) => {
      hold();
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: wrap.scrollLeft, moved: false };
      wrap.classList.add('dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      wrap.scrollLeft = drag.left - dx;
      hold();
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      wrap.classList.remove('dragging');
      if (drag.moved) wrap.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true });
      drag = null;
      hold();
    });

    /* prev / next buttons */
    el.querySelectorAll('.tn-btn').forEach((b) => b.addEventListener('click', () => {
      hold(3200);
      const step = originals[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24);
      const dir = Number(b.dataset.dir);
      if (dir < 0 && wrap.scrollLeft < step) wrap.scrollLeft += setW;
      if (dir > 0 && wrap.scrollLeft >= setW) wrap.scrollLeft -= setW;
      wrap.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
    }));
  });

  /* scroll-linked progress: every [data-sp] gets --p from 0 → 1 as it moves
     from `start` to `end` (fractions of viewport height, measured at its top edge) */
  const sp = [...document.querySelectorAll('[data-sp]')].map((el) => {
    const [start, end] = (el.dataset.spRange || '1,0').split(',').map(Number);
    return { el, start, end };
  });
  const steps = document.querySelector('.steps');
  const stepItems = steps ? [...steps.querySelectorAll('.step')] : [];

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    spy();

    if (hero && hdr) {
      hdr.classList.toggle('on-dark', hero.getBoundingClientRect().bottom > hdr.offsetHeight);
      hero.style.setProperty('--hp', reduce ? 0 : clamp(window.scrollY / (vh * 0.9)).toFixed(3));
    }

    strips.forEach((s) => {
      if (s.el.classList.contains('pinned') && s.travel > 0) {
        // 0 when the strip reaches its sticky position, 1 after scrolling `travel` px further
        const natural = s.el.getBoundingClientRect().top + s.start;
        const p = clamp((s.stickyTop - natural) / s.travel);
        s.track.style.setProperty('--tx', (p * s.travel).toFixed(1));
        s.el.style.setProperty('--tp', p.toFixed(3));
      }
      bend(s);
    });

    sp.forEach(({ el, start, end }) => {
      const top = el.getBoundingClientRect().top;
      const p = reduce ? 1 : clamp((start * vh - top) / ((start - end) * vh));
      el.style.setProperty('--p', p.toFixed(3));
      if (el === steps) stepItems.forEach((s, i) => s.classList.toggle('on', p > 0.02 + i * 0.2));
      // creative board: once every request has settled into place, its status dot turns green
      if (el.classList.contains('stage')) el.classList.toggle('ready', p > 0.97);
    });
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  setupPins();
  update();
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', () => { setupPins(); req(); });
  window.addEventListener('load', () => { setupPins(); req(); });
  // web fonts change the heading height, which shifts where the strip pins
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { setupPins(); req(); });

  /* FAQ accordion */
  const qs = [...document.querySelectorAll('.q')];
  qs.forEach((q) => {
    const btn = q.querySelector('button');
    btn.addEventListener('click', () => {
      const open = !q.classList.contains('open');
      qs.forEach((o) => { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); });
      q.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* category pages: click a work item to view it large */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img');
    const lbCap = lb.querySelector('figcaption');
    document.querySelectorAll('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const img = btn.querySelector('img');
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = btn.dataset.zoom;
        lb.showModal();
      });
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-close')) lb.close(); });
  }

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
