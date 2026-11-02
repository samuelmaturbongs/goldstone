/**
 * Goldstone Arena - Main JavaScript Application
 * Modular clean code architecture
 */

// ==========================================
// 1. DYNAMIC SECTION LOADER
// ==========================================
async function loadSections() {
  const containers = document.querySelectorAll('[data-include]');
  if (!containers.length) return;

  await Promise.all(
    Array.from(containers).map(async (el) => {
      const file = el.getAttribute('data-include');
      try {
        const res = await fetch(`${file}?v=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        el.outerHTML = html;
      } catch (err) {
        console.error(`Failed to load section: ${file}`, err);
      }
    })
  );
}

// ==========================================
// 2. COMPONENT INITIALIZERS
// ==========================================
function initApp() {
  // ---------- Top Promo Announcement Bar & Welcome Event Modal ----------
  (function initPromoBar() {
    const bar = document.getElementById('promo-bar');
    const promoModal = document.getElementById('promo-modal');

    // Setup native <dialog> modal & light-dismiss fallback
    if (promoModal && typeof promoModal.showModal === 'function') {
      const viewEditorial = document.getElementById('promo-view-editorial');
      const viewPoster = document.getElementById('promo-view-poster');
      const posterToggle = document.getElementById('promo-poster-toggle');
      const posterThumb = document.getElementById('promo-poster-thumb');

      function setPosterMode(showPoster) {
        if (!viewEditorial || !viewPoster || !posterToggle) return;
        viewEditorial.classList.toggle('hidden', showPoster);
        viewPoster.classList.toggle('hidden', !showPoster);
        posterToggle.textContent = showPoster ? '← Info Singkat' : 'Lihat Poster';
      }

      if (posterToggle) {
        posterToggle.addEventListener('click', () => {
          const isPosterVisible = viewPoster && !viewPoster.classList.contains('hidden');
          setPosterMode(!isPosterVisible);
        });
      }
      if (posterThumb) {
        posterThumb.addEventListener('click', () => setPosterMode(true));
      }

      promoModal.addEventListener('close', () => {
        promoModal.returnValue = '';
        setPosterMode(false);
      });

      // Fallback for browsers without native closedby="any" support
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e, dialog) => {
          const r = dialog.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        promoModal.addEventListener('pointerdown', (e) => {
          pressedOutside = outside(e, promoModal);
        });
        promoModal.addEventListener('pointerup', (e) => {
          if (pressedOutside && outside(e, promoModal)) promoModal.close();
        });
      }

      // Automatically open modal on initial page load unless disabled
      if (promoModal.dataset.autoOpen !== 'false') {
        setTimeout(() => {
          if (!promoModal.open) promoModal.showModal();
        }, 250);
      }
    }

    if (!bar) return;

    const slides = Array.from(bar.querySelectorAll('.promo-slide'));
    const badgeText = document.getElementById('promo-badge-text');
    const ctaBtn = document.getElementById('promo-cta');
    const ctaText = document.getElementById('promo-cta-text');
    const dotsWrap = document.getElementById('promo-dots');
    const closeBtn = document.getElementById('promo-close');

    if (!slides.length) return;

    let currentIdx = 0;
    let timer = null;

    // Allow clicking any slide with data-open-modal="true" to open the modal directly
    slides.forEach((slide) => {
      if (slide.dataset.openModal === 'true' && promoModal) {
        slide.addEventListener('click', () => {
          if (!promoModal.open) promoModal.showModal();
        });
      }
    });

    // Build indicator dots if multiple promos exist
    if (dotsWrap && slides.length > 1) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Promo ${idx + 1}`);
        dot.className = idx === 0
          ? 'w-4 h-1.5 rounded-full bg-night transition-all'
          : 'w-1.5 h-1.5 rounded-full bg-night/30 hover:bg-night/60 transition-all';
        dot.addEventListener('click', () => {
          showSlide(idx);
          restartTimer();
        });
        dotsWrap.appendChild(dot);
      });
    }

    function showSlide(index) {
      currentIdx = (index + slides.length) % slides.length;
      const activeSlide = slides[currentIdx];

      slides.forEach((s, i) => {
        if (i === currentIdx) {
          s.classList.remove('hidden');
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
          s.classList.add('hidden');
        }
      });

      if (badgeText && activeSlide.dataset.badge) {
        badgeText.textContent = activeSlide.dataset.badge;
      }
      if (ctaText && activeSlide.dataset.cta) {
        ctaText.textContent = activeSlide.dataset.cta;
      }
      if (ctaBtn) {
        ctaBtn.setAttribute('href', activeSlide.dataset.target || '#promo-modal');
      }

      if (dotsWrap && slides.length > 1) {
        Array.from(dotsWrap.children).forEach((d, i) => {
          d.className = i === currentIdx
            ? 'w-4 h-1.5 rounded-full bg-night transition-all'
            : 'w-1.5 h-1.5 rounded-full bg-night/30 hover:bg-night/60 transition-all';
        });
      }
    }

    function startTimer() {
      if (slides.length <= 1) return;
      stopTimer();
      timer = setInterval(() => showSlide(currentIdx + 1), 5200);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function restartTimer() {
      stopTimer();
      startTimer();
    }

    bar.addEventListener('mouseenter', stopTimer);
    bar.addEventListener('mouseleave', startTimer);

    if (ctaBtn) {
      ctaBtn.addEventListener('click', (e) => {
        const activeSlide = slides[currentIdx];
        if (!activeSlide) return;

        // If the active slide opens the promo modal
        if (activeSlide.dataset.openModal === 'true' && promoModal) {
          e.preventDefault();
          if (!promoModal.open) promoModal.showModal();
          return;
        }

        const targetSel = activeSlide.dataset.target || '#jadwal';
        const tier = activeSlide.dataset.tier;
        const sport = activeSlide.dataset.sport;

        // Auto-select sport & pricelist tier tab in Jadwal section
        if (sport) {
          const sportBtn = document.querySelector(`.sport-btn[data-sport="${sport}"]`);
          if (sportBtn) sportBtn.click();
        }
        if (tier) {
          const tierBtn = document.querySelector(`.tier-tab-btn[data-tier="${tier}"]`);
          if (tierBtn) tierBtn.click();
        }

        const targetEl = document.querySelector(targetSel);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const wrapper = document.getElementById('pricelist-wrapper') || targetEl;
          wrapper.classList.remove('pricelist-highlight');
          void wrapper.offsetWidth; // trigger reflow
          wrapper.classList.add('pricelist-highlight');
          setTimeout(() => wrapper.classList.remove('pricelist-highlight'), 1500);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        stopTimer();
        bar.style.display = 'none';
      });
    }

    showSlide(0);
    startTimer();
  })();

  // Marquee pause control (accessibility)
  const marquee = document.getElementById('marquee');
  const marqueeToggle = document.getElementById('marquee-toggle');
  marqueeToggle.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    marqueeToggle.setAttribute('aria-pressed', paused);
    marqueeToggle.textContent = paused ? 'Putar animasi' : 'Jeda animasi';
  });

  // ---------- Jadwal & Pricelist (06.00 – 24.00) ----------
  const HOURS = Array.from({ length: 18 }, (_, i) => 6 + i); // 06:00–23:00 (selesai 24:00)
  const SPORTS = {
    soccer: { label: 'Mini Soccer (64×44m)', ig: 'https://www.instagram.com/goldstonearena/', venue: 'Goldstone Arena' },
    padel:  { label: 'Social Padel',         ig: 'https://www.instagram.com/goldstonesocialhouse/', venue: 'Goldstone Social Padel' },
  };
  const TIER_LABELS = {
    reguler: 'Reguler',
    member:  'Member',
    pelajar: 'Dana Pelajar',
  };

  const fmtDay = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
  const fmtLong = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  const fmtShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
  const fmtRp = new Intl.NumberFormat('id-ID');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Hitung tarif resmi Goldstone Arena per jam (dalam ribuan Rupiah)
  function getHourRateK(date, hour, tier) {
    const day = date.getDay(); // 0 = Minggu, 1 = Senin ... 6 = Sabtu
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      // Weekend & Tanggal Merah (Sabtu–Minggu): Harga Reguler
      if (hour >= 6 && hour < 10) return 800;
      if (hour >= 10 && hour < 15) return 600;
      if (hour >= 15 && hour < 22) return 1000;
      return 950; // 22.00–24.00
    }

    // Dana Pelajar: Senin–Kamis (day 1..4), jam 06.00–15.00 -> Rp500.000/jam
    if (tier === 'pelajar' && day >= 1 && day <= 4 && hour >= 6 && hour < 15) {
      return 500;
    }

    // Weekday (Senin–Jumat)
    const isMember = tier === 'member';
    if (hour >= 6 && hour < 10) return isMember ? 550 : 600;
    if (hour >= 10 && hour < 15) return isMember ? 500 : 550;
    if (hour >= 15 && hour < 22) return isMember ? 800 : 850;
    return isMember ? 750 : 800; // 22.00–24.00
  }

  // DATA ILUSTRASI — ganti dengan data booking asli (API / Google Sheet).
  function isBooked(sport, date, hour) {
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + (sport === 'padel' ? 777 : 0);
    const x = Math.sin(seed * 31 + hour * 7) * 10000;
    const r = x - Math.floor(x);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const peak = hour >= 16 && hour <= 21;
    return r < 0.18 + (peak ? 0.38 : 0) + (weekend ? 0.15 : 0);
  }
  const isPast = (date, hour) => date < today || (sameDay(date, today) && hour <= new Date().getHours());
  const freeCount = (sport, date) => HOURS.filter((h) => !isBooked(sport, date, h) && !isPast(date, h)).length;
  const dot = (c) => (c === 0 ? 'border border-night/30' : c <= 5 ? 'bg-night/30' : 'bg-gold-500');

  const state = {
    sport: 'soccer', tier: 'reguler',
    monthCursor: new Date(today.getFullYear(), today.getMonth(), 1),
    date: today, hours: new Set(),
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    month: $('month-view'), monthGrid: $('month-grid'),
    label: $('cal-label'), prev: $('cal-prev'), next: $('cal-next'),
    slots: $('slot-grid'), slotDate: $('slot-date'), dayBadge: $('day-rate-badge'),
    summary: $('summary-text'), book: $('book-btn'), note: $('copy-note'),
  };

  function pick(date) { state.date = date; state.hours.clear(); render(); }

  function dayButton(d, { disabled }) {
    const count = disabled ? 0 : freeCount(state.sport, d);
    const active = sameDay(d, state.date);
    const b = document.createElement('button');
    b.type = 'button';
    b.disabled = disabled;
    b.setAttribute('aria-pressed', active);
    b.setAttribute('aria-label', `${fmtLong.format(d)}, ${count} slot tersedia`);
    b.className = [
      'rounded-xl sm:rounded-2xl aspect-square flex items-center justify-center transition-colors',
      active ? 'bg-night text-cream' : 'bg-cream hover:bg-sand',
      disabled ? 'opacity-30 cursor-not-allowed hover:bg-cream' : '',
    ].join(' ');
    b.innerHTML = `<span class="font-display text-sm sm:text-base font-semibold">${d.getDate()}</span>`;
    if (!disabled) b.addEventListener('click', () => pick(d));
    return b;
  }

  function renderMonth() {
    els.monthGrid.innerHTML = '';
    const c = state.monthCursor;
    els.label.textContent = fmtMonth.format(c);
    els.prev.disabled = c.getFullYear() === today.getFullYear() && c.getMonth() === today.getMonth();
    const lead = (c.getDay() + 6) % 7;
    const days = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
    for (let i = 0; i < lead; i++) els.monthGrid.appendChild(document.createElement('span'));
    for (let d = 1; d <= days; d++) {
      const date = new Date(c.getFullYear(), c.getMonth(), d);
      els.monthGrid.appendChild(dayButton(date, { disabled: date < today }));
    }
  }

  function renderSlots() {
    els.slotDate.textContent = fmtLong.format(state.date);
    const isWeekend = state.date.getDay() === 0 || state.date.getDay() === 6;
    const effectiveTier = state.tier === 'all' ? 'reguler' : state.tier;
    if (els.dayBadge) {
      if (isWeekend) {
        els.dayBadge.textContent = 'Weekend · Akhir Pekan';
      } else if (effectiveTier === 'member') {
        els.dayBadge.textContent = 'Weekday · Member (-50rb)';
      } else if (effectiveTier === 'pelajar') {
        els.dayBadge.textContent = 'Weekday · Pelajar (500rb)';
      } else {
        els.dayBadge.textContent = 'Weekday · Harga Reguler';
      }
    }
    els.slots.innerHTML = '';
    HOURS.forEach((h) => {
      const booked = isBooked(state.sport, state.date, h);
      const off = booked || isPast(state.date, h);
      const sel = state.hours.has(h);
      const rateK = getHourRateK(state.date, h, effectiveTier);
      const isPelajarSpecial = !isWeekend && effectiveTier === 'pelajar' && state.date.getDay() >= 1 && state.date.getDay() <= 4 && h >= 6 && h < 15;
      const isMemberDiscount = !isWeekend && effectiveTier === 'member';

      const b = document.createElement('button');
      b.type = 'button';
      b.disabled = off;
      b.setAttribute('aria-pressed', sel);
      b.setAttribute('aria-label', `${pad(h)}:00 sampai ${pad(h + 1)}:00, Rp${rateK}.000${booked ? ', sudah dipesan' : ''}`);
      b.className = [
        'py-2.5 px-3 rounded-xl tabular-nums transition-colors flex items-center justify-between gap-1.5 leading-none',
        sel ? 'bg-gold-grad text-night font-semibold shadow-md' :
        off ? 'bg-white/[0.03] text-cream/20 line-through cursor-not-allowed' :
        isPelajarSpecial ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30' :
        isMemberDiscount ? 'bg-gold-500/15 text-gold-200 border border-gold-400/30 hover:bg-gold-500/25' :
        'bg-white/[0.07] hover:bg-white/15',
      ].join(' ');
      b.innerHTML = `
        <span class="text-xs sm:text-sm font-medium">${pad(h)}:00</span>
        <span class="text-[11px] ${sel ? 'text-night/85 font-bold' : off ? 'text-cream/15' : isPelajarSpecial ? 'text-amber-300 font-bold' : isMemberDiscount ? 'text-gold-300 font-semibold' : 'text-gold-300/80'}">${rateK}rb</span>
      `;
      b.addEventListener('click', () => { sel ? state.hours.delete(h) : state.hours.add(h); renderSlots(); renderSummary(); });
      els.slots.appendChild(b);
    });
  }

  const hoursLabel = () => [...state.hours].sort((a, b) => a - b).map((h) => `${pad(h)}:00–${pad(h + 1)}:00`).join(', ');
  const totalPrice = () => {
    const effectiveTier = state.tier === 'all' ? 'reguler' : state.tier;
    return [...state.hours].reduce((sum, h) => sum + getHourRateK(state.date, h, effectiveTier) * 1000, 0);
  };

  function renderSummary() {
    const n = state.hours.size;
    els.book.disabled = n === 0;
    const isWeekend = state.date.getDay() === 0 || state.date.getDay() === 6;
    const effectiveTier = state.tier === 'all' ? 'reguler' : state.tier;
    const tierNote = isWeekend 
      ? 'Tarif Weekend (Akhir pekan berlaku harga reguler)' 
      : effectiveTier === 'member'
      ? 'Tarif Member (Hemat Rp50.000 / jam)'
      : effectiveTier === 'pelajar'
      ? 'Tarif Dana Pelajar (Senin–Kamis 06.00–15.00 Rp500rb/jam)'
      : 'Tarif Reguler';

    els.summary.innerHTML = n === 0
      ? 'Pilih satu atau beberapa jam untuk melihat total estimasi biaya sewa.'
      : `<div class="flex items-center justify-between gap-2 text-cream font-medium">
           <span>${SPORTS[state.sport].label} · ${n} jam</span>
           <span class="text-gold-300 font-display text-lg font-bold">Rp${fmtRp.format(totalPrice())}</span>
         </div>
         <span class="block mt-1 text-xs text-cream/70">${fmtLong.format(state.date)} · <span class="text-gold-300 font-medium">${tierNote}</span></span>
         <span class="block mt-1 text-xs text-gold-300">${hoursLabel()}</span>`;
  }

  function setToggle(selector, key, value, activeCls, idleCls) {
    document.querySelectorAll(selector).forEach((b) => {
      const on = b.dataset[key] === value;
      b.setAttribute('aria-pressed', on);
      b.className = `${selector.slice(1)} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors ${on ? activeCls : idleCls}`;
    });
  }

  function updateTierUI() {
    const activeTier = state.tier === 'all' ? 'reguler' : state.tier;

    // 1. Update tabs styling
    document.querySelectorAll('.tier-tab-btn').forEach((b) => {
      const active = b.dataset.tier === activeTier;
      b.setAttribute('aria-selected', active);
      b.className = `tier-tab-btn px-4 py-2 rounded-full transition-colors ${active ? 'bg-night text-cream font-semibold' : 'text-night/65 hover:text-night'}`;
    });

    // 2. Show ONLY the selected tier panel (Reguler | Member | Dana Pelajar)
    const panelReguler = $('tier-panel-reguler');
    const panelMember  = $('tier-panel-member');
    const panelPelajar = $('tier-panel-pelajar');
    if (panelReguler) panelReguler.hidden = activeTier !== 'reguler';
    if (panelMember)  panelMember.hidden  = activeTier !== 'member';
    if (panelPelajar) panelPelajar.hidden = activeTier !== 'pelajar';

    // 3. Update in-slot tier toggle styling
    document.querySelectorAll('.slot-tier-btn').forEach((b) => {
      const active = b.dataset.tier === activeTier;
      b.setAttribute('aria-pressed', active);
      b.className = `slot-tier-btn py-2 px-2 rounded-xl text-xs font-medium transition-colors ${active ? 'bg-gold-grad text-night font-bold shadow-sm' : 'text-cream/65 hover:text-cream'}`;
    });
  }

  function render() {
    setToggle('.sport-btn', 'sport', state.sport, 'bg-night text-cream', 'text-night/60 hover:text-night');
    updateTierUI();
    renderMonth();
    renderSlots();
    renderSummary();
  }

  document.querySelectorAll('.sport-btn').forEach((b) => b.addEventListener('click', () => { state.sport = b.dataset.sport; state.hours.clear(); render(); }));
  document.querySelectorAll('.tier-tab-btn').forEach((b) => b.addEventListener('click', () => { state.tier = b.dataset.tier; render(); }));
  document.querySelectorAll('.slot-tier-btn').forEach((b) => b.addEventListener('click', () => { state.tier = b.dataset.tier; render(); }));

  els.prev.addEventListener('click', () => {
    state.monthCursor = new Date(state.monthCursor.getFullYear(), state.monthCursor.getMonth() - 1, 1);
    render();
  });
  els.next.addEventListener('click', () => {
    state.monthCursor = new Date(state.monthCursor.getFullYear(), state.monthCursor.getMonth() + 1, 1);
    render();
  });

  els.book.addEventListener('click', async () => {
    const s = SPORTS[state.sport];
    const isWeekend = state.date.getDay() === 0 || state.date.getDay() === 6;
    const tierText = isWeekend ? 'Weekend' : TIER_LABELS[state.tier];
    const msg = `Halo ${s.venue}, saya ingin booking ${s.label} (${tierText}) pada ${fmtLong.format(state.date)}, jam ${hoursLabel()} (${state.hours.size} jam — Estimasi Rp${fmtRp.format(totalPrice())}). Apakah slot masih tersedia?`;
    try { await navigator.clipboard.writeText(msg); } catch {}
    const waUrl = `https://wa.me/6281280809212?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  });

  render();

  // ---------- 3D CircularCarousel (port vanilla dari @react-bits/CircularCarousel-JS-CSS) ----------
  (function initCircularCarousel() {
    const root = document.getElementById('events-circular-carousel');
    if (!root) return;

    const ITEMS = [
      {
        src: 'assets/images/pggm-cup-2026.jpg',
        badge: '22–28 Nov 2026 · Hadiah Rp50 Juta',
        title: 'PGGM CUP 2026 — Natal & Tahun Baru',
        desc: 'Turnamen mini soccer antar denominasi gereja se-Kabupaten Mimika di Goldstone Arena. Kuota terbatas 24 tim!'
      },
      {
        src: 'assets/images/img_4.jpg',
        badge: 'Tuan Rumah Resmi',
        title: 'Kapolda Papua Tengah Cup',
        desc: 'Dipercaya menggelar turnamen mini soccer bergengsi tingkat provinsi dengan ratusan penonton.'
      },
      {
        src: 'assets/images/img_1.jpg',
        badge: 'Turnamen Regional',
        title: 'Danbrigif Cup & Kejuaraan Daerah',
        desc: 'Fasilitas tribun single seat, bench pemain, dan area F&B terpadu mendukung kesuksesan turnamen Anda.'
      },
      {
        src: 'assets/images/img_13.jpg',
        badge: 'Goldstone Social Padel',
        title: 'Padel Social Play & Sesi Pemula',
        desc: 'Belum pernah main padel? Ikuti sesi mabar komunitas atau sewa court bareng sahabat di Timika.'
      },
      {
        src: 'assets/images/img_8.jpg',
        badge: 'Member & Instansi',
        title: 'Paket Liga Kantor & Sparring Rutin',
        desc: 'Amankan jadwal mingguan tetap untuk klub, BUMN, perusahaan tambang, maupun instansi pemerintahan.'
      },
      {
        src: 'assets/images/img_7.jpg',
        badge: '@goldstonesocialhouse',
        title: 'Gathering Kantor, Ulang Tahun & Nobar',
        desc: 'Paket reservasi tempat makan, katering turnamen, hingga acara nonton bareng laga besar.'
      },
      {
        src: 'assets/images/lapangan.jpeg',
        badge: 'Standar FIFA · 64 × 44 M',
        title: 'Fun Match Malam Hari',
        desc: 'Pencahayaan floodlight merata dan rumput sintetis premium untuk sensasi tanding malam terbaik.'
      },
      {
        src: 'assets/images/img_11.jpg',
        badge: 'Program Dana Pelajar',
        title: 'Latihan Sekolah & Akademi Muda',
        desc: 'Dukungan tarif khusus pelajar Senin–Kamis untuk pembinaan bakat sepak bola muda di Timika.'
      },
      {
        src: 'assets/images/img_5.jpg',
        badge: 'Coffee & Family Dining',
        title: 'Kuliner & Ruang Kumpul Nyaman',
        desc: 'Nikmati specialty coffee dan hidangan restoran lengkap bersama keluarga selepas pertandingan.'
      }
    ];

    const stage = root.querySelector('.circular-carousel__stage');
    const camera = root.querySelector('.circular-carousel__camera');
    const ring = root.querySelector('.circular-carousel__ring');
    const live = root.querySelector('.circular-carousel__live');
    const prevBtn = document.getElementById('events-prev');
    const nextBtn = document.getElementById('events-next');

    const TILES = 8;
    const OVERLAP = 2.5;
    const DRAG_THRESHOLD = 5;
    const SPRING = 118;
    const SETTLE_SPEED = 9;
    const INTRO_RISE_LEN = 1400;
    const TO_RAD = Math.PI / 180;

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const wrap = deg => ((((deg + 180) % 360) + 360) % 360) - 180;
    const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
    const rotateX = (p, deg) => {
      const r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r);
      return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
    };
    const rotateY = (p, deg) => {
      const r = deg * TO_RAD, c = Math.cos(r), s = Math.sin(r);
      return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    };

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cfg = {
      count: ITEMS.length,
      step: 360 / ITEMS.length,
      cardW: 250,
      cardH: 300,
      gap: 25,
      tilt: -5,
      curve: 1,
      perspective: 2500,
      speed: 14,
      momentum: 0.6,
      snap: true,
      pauseOnHover: true,
      focusOnClick: true,
      draggable: true,
      parallax: reduced ? 0 : 0.3,
      stretch: reduced ? 0 : 0.5,
      depthFade: 0.55,
      innerShade: 0.6,
      cornerRadius: 18
    };

    root.setAttribute('data-axis', 'y');
    root.setAttribute('data-shape', 'cylinder');
    root.setAttribute('data-draggable', '');
    root.style.setProperty('--cc-fade', '#0B0C09');
    root.style.setProperty('--cc-radius', `${cfg.cornerRadius}px`);
    root.style.setProperty('--cc-inner', (1 - cfg.innerShade).toFixed(3));

    const pitch = cfg.cardW + cfg.gap;
    const chord = pitch / (2 * Math.sin(Math.PI / cfg.count));
    const arc = (cfg.count * pitch) / (2 * Math.PI);
    const radius = Math.max(chord + (arc - chord) * cfg.curve, cfg.cardW * 0.6);

    const tileDefs = Array.from({ length: TILES }, (_, index) => {
      const length = cfg.cardW / TILES;
      const bend = radius / cfg.curve;
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < TILES - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - cfg.cardW / 2;
      const alpha = center / bend;
      const shift = bend * Math.sin(alpha);
      const sink = bend * (1 - Math.cos(alpha));
      const depth = -sink;
      const turn = (alpha * 180) / Math.PI;
      const move = `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total: TILES, start, end, size: end - start, move };
    });

    const cardEls = [];
    ITEMS.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'circular-carousel__card';
      card.setAttribute('data-cc-index', String(index));
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${item.title}, ${index + 1} dari ${cfg.count}`);

      const buildTile = (tile, back) => {
        const strip = back ? tile.total - 1 - tile.index : tile.index;
        const first = strip === 0;
        const last = strip === tile.total - 1;
        const r = 'var(--cc-radius)';
        const frameRadius = `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
        const offset = back ? cfg.cardW - tile.end : tile.start;
        const flip = back ? ' rotateY(180deg)' : '';

        const tileEl = document.createElement('div');
        tileEl.className = 'circular-carousel__tile';
        tileEl.setAttribute('aria-hidden', 'true');
        tileEl.style.left = `${-tile.size / 2}px`;
        tileEl.style.top = `${-cfg.cardH / 2}px`;
        tileEl.style.width = `${tile.size}px`;
        tileEl.style.height = `${cfg.cardH}px`;
        tileEl.style.transform = tile.move + flip;

        const surfaceBox = `left:${-offset}px;top:0;width:${cfg.cardW}px;height:${cfg.cardH}px;`;
        tileEl.innerHTML = `
          <div class="circular-carousel__frame" style="height:${cfg.cardH}px;border-radius:${frameRadius};">
            <img class="circular-carousel__photo" src="${item.src}" alt="" draggable="false" decoding="async" style="${surfaceBox}" />
            ${back ? '<div class="circular-carousel__inner"></div>' : `
              <div class="circular-carousel__overlay" style="${surfaceBox}">
                <span class="px-2.5 py-1 rounded-full bg-gold-grad text-night text-[10px] font-bold w-fit mb-2.5 shadow-sm">${item.badge}</span>
                <h3 class="font-display text-lg font-semibold leading-snug text-cream">${item.title}</h3>
                <p class="mt-1.5 text-[11px] text-cream/80 leading-relaxed">${item.desc}</p>
              </div>
            `}
            <div class="circular-carousel__shade"></div>
          </div>
        `;
        return tileEl;
      };

      tileDefs.forEach(t => card.appendChild(buildTile(t, false)));
      tileDefs.forEach(t => card.appendChild(buildTile(t, true)));
      ring.appendChild(card);
      cardEls.push(card);
    });

    const state = {
      angle: 0,
      velocity: 0,
      target: null,
      dir: -1, // direction="left"
      press: null,
      drag: false,
      hover: false,
      pointer: { inside: false, x: 0, y: 0 },
      yaw: 0,
      pitch: 0,
      intro: null,
      introDone: reduced,
      holdUntil: 0,
      suppressClick: false,
      wheelTimer: 0,
      fit: 1,
      shift: 0,
      drop: 0,
      last: 0,
      active: 0
    };

    let raf = 0;
    let visible = true;
    const nearest = a => Math.round(a / cfg.step) * cfg.step;

    function measure() {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const width = rect.width * 0.94;
      const height = rect.height * 0.92;
      const P = cfg.perspective;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const corners = [
        [-cfg.cardW / 2, -cfg.cardH / 2],
        [cfg.cardW / 2, -cfg.cardH / 2],
        [-cfg.cardW / 2, cfg.cardH / 2],
        [cfg.cardW / 2, cfg.cardH / 2]
      ];
      for (let a = -180; a <= 180; a += 180 / 24) {
        for (const [cx, cy] of corners) {
          let p = rotateX(rotateY([cx, cy, radius], a), cfg.tilt);
          p = [p[0], p[1], p[2] - radius];
          if (p[2] >= P * 0.95) continue;
          const k = P / (P - p[2]);
          minX = Math.min(minX, p[0] * k);
          maxX = Math.max(maxX, p[0] * k);
          minY = Math.min(minY, p[1] * k);
          maxY = Math.max(maxY, p[1] * k);
        }
      }
      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);
      // On mobile keep cards comfortably large so overlaid text stays legible
      const minMobileFit = rect.width < 640 ? 0.78 : 0;
      const fit = Math.max(minMobileFit, Math.min(1, width / spanX, height / spanY));
      state.fit = fit;
      state.shift = -((minY + maxY) / 2) * fit;
      state.drop = (rect.height / fit) * 0.55 + cfg.cardH;
      stage.style.perspective = `${P}px`;
      stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${fit})`;
    }

    function advance(dt, now) {
      if (!state.introDone) {
        if (!state.intro) state.intro = { start: now };
        if (now - state.intro.start >= INTRO_RISE_LEN) {
          state.intro = null;
          state.introDone = true;
        }
      }

      const paused = (cfg.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
      const cruise = !reduced && !paused && !state.intro ? cfg.speed * state.dir : 0;
      let busy = Boolean(state.intro) || state.drag;

      if (state.drag || state.intro) {
        state.velocity = state.drag ? state.velocity : 0;
      } else if (state.target !== null) {
        let rem = dt;
        const damping = 2 * Math.sqrt(SPRING);
        while (rem > 0) {
          const h = Math.min(rem, 1 / 240);
          const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
          state.velocity += accel * h;
          state.angle += state.velocity * h;
          rem -= h;
        }
        if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
          state.angle = state.target;
          state.velocity = 0;
          state.target = null;
        }
        busy = true;
      } else {
        const tau = 0.18 + cfg.momentum * 1.5;
        state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
        state.angle += state.velocity * dt;
        if (cruise === 0 && cfg.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
          state.target = nearest(state.angle);
        }
        busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
      }

      if (now < state.holdUntil) busy = true;

      const ease = 1 - Math.exp(-dt / 0.35);
      const aimYaw = state.pointer.inside ? state.pointer.x * cfg.parallax * 9 : 0;
      const aimPitch = state.pointer.inside ? -state.pointer.y * cfg.parallax * 6 : 0;
      state.yaw += (aimYaw - state.yaw) * ease;
      state.pitch += (aimPitch - state.pitch) * ease;
      if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

      return busy;
    }

    function renderRing(now) {
      const elapsed = state.intro ? now - state.intro.start : 0;
      const swell = 1 + cfg.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
      const angle = state.angle;
      const R = radius * swell;

      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${cfg.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;

      for (let i = 0; i < cfg.count; i++) {
        const card = cardEls[i];
        const base = i * cfg.step;
        let lift = 0;
        if (state.intro) {
          const reach = Math.abs(wrap(base + state.angle));
          const delay = (reach / 180) * 480;
          const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
          lift = (1 - p) * state.drop;
        }
        let transform = `rotateY(${base}deg) translateZ(${R}px)`;
        if (lift) transform += ` translateY(${lift}px)`;
        card.style.transform = transform;

        const world = wrap(base + angle);
        const facing = Math.cos(world * TO_RAD);
        const fade = cfg.depthFade * Math.pow((1 - facing) / 2, 1.25);
        card.style.setProperty('--cc-depth', fade.toFixed(3));
      }

      const idx = ((Math.round(-state.angle / cfg.step) % cfg.count) + cfg.count) % cfg.count || 0;
      if (idx !== state.active) {
        state.active = idx;
        if (live) live.textContent = `${ITEMS[idx].title}, ${idx + 1} dari ${cfg.count}`;
      }
    }

    function frame(now) {
      raf = 0;
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
      state.last = now;
      const busy = advance(dt, now);
      renderRing(now);
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else state.last = 0;
    }

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function focusIndex(index) {
      let target = -index * cfg.step;
      target += 360 * Math.round((state.angle - target) / 360);
      state.target = target;
      state.holdUntil = performance.now() + 2800;
      wake();
    }

    function stepBy(delta) {
      const base = state.target ?? nearest(state.angle);
      state.target = base - delta * cfg.step;
      state.holdUntil = performance.now() + 2800;
      wake();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => stepBy(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => stepBy(1));

    root.addEventListener('pointerdown', (e) => {
      state.suppressClick = false;
      if (e.button !== 0) return;
      state.press = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        angle: state.angle,
        moved: false,
        origin: 0,
        samples: [{ time: performance.now(), angle: state.angle }]
      };
    });

    root.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        const rect = root.getBoundingClientRect();
        state.pointer.inside = true;
        state.pointer.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        state.pointer.y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      }
      const press = state.press;
      if (!press || press.id !== e.pointerId) {
        wake();
        return;
      }
      const delta = e.clientX - press.x;
      const cross = e.clientY - press.y;
      if (!press.moved) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;
        if (Math.abs(cross) > Math.abs(delta) * 1.2 && e.pointerType !== 'mouse') {
          state.press = null;
          return;
        }
        press.moved = true;
        press.origin = delta;
        state.drag = true;
        state.target = null;
        state.velocity = 0;
        root.setAttribute('data-dragging', '');
        try { root.setPointerCapture(e.pointerId); } catch {}
      }
      const perPixel = 180 / (Math.PI * radius * state.fit);
      state.angle = press.angle + (delta - press.origin) * perPixel;
      const now = performance.now();
      press.samples.push({ time: now, angle: state.angle });
      while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
      wake();
    });

    const releasePointer = (e) => {
      const press = state.press;
      if (!press || press.id !== e.pointerId) return;
      state.press = null;
      if (!press.moved) return;
      state.drag = false;
      root.removeAttribute('data-dragging');
      state.suppressClick = true;
      const first = press.samples[0];
      const last = press.samples[press.samples.length - 1];
      const span = (last.time - first.time) / 1000;
      const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
      state.velocity = velocity;
      if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
      const coasting = !reduced && !(cfg.pauseOnHover && state.hover && e.pointerType === 'mouse');
      if (cfg.snap && !coasting) {
        const tau = 0.18 + cfg.momentum * 1.5;
        state.target = Math.round((state.angle + velocity * tau * 0.55) / cfg.step) * cfg.step;
      }
      wake();
    };

    root.addEventListener('pointerup', releasePointer);
    root.addEventListener('pointercancel', releasePointer);
    root.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      state.hover = true;
      wake();
    });
    root.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        state.hover = false;
        state.pointer.inside = false;
      }
      wake();
    });
    root.addEventListener('click', (e) => {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }
      const card = e.target.closest && e.target.closest('[data-cc-index]');
      if (!card) return;
      focusIndex(Number(card.getAttribute('data-cc-index')));
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') stepBy(1);
      else if (e.key === 'ArrowLeft') stepBy(-1);
      else if (e.key === 'Home') focusIndex(0);
      else if (e.key === 'End') focusIndex(cfg.count - 1);
      else return;
      e.preventDefault();
    });
    root.addEventListener('wheel', (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (!delta) return;
      e.preventDefault();
      const perPixel = 180 / (Math.PI * radius * state.fit);
      state.target = null;
      state.angle -= delta * perPixel;
      state.velocity = -delta * perPixel * 30;
      state.holdUntil = performance.now() + 1600;
      clearTimeout(state.wheelTimer);
      state.wheelTimer = setTimeout(() => {
        state.target = nearest(state.angle + state.velocity * 0.12);
        wake();
      }, 140);
      wake();
    }, { passive: false });

    const resizeObs = new ResizeObserver(() => { measure(); wake(); });
    resizeObs.observe(root);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        root.setAttribute('data-ready', '');
        wake();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        state.last = 0;
      }
    }, { threshold: 0.15 });
    io.observe(root);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        state.last = 0;
      } else wake();
    });

    measure();
    renderRing(performance.now());
  })();

  // ---------- ScrollExpand (window scroll) ----------
  (function initScrollExpand() {
    const root = document.getElementById('scroll-expand');
    if (!root) return;
    const track = root.querySelector('.scroll-expand__track');
    const stage = root.querySelector('.scroll-expand__stage');
    const frame = root.querySelector('.scroll-expand__frame');
    const media = root.querySelector('.scroll-expand__media');
    const scrim = root.querySelector('.scroll-expand__scrim');
    const titleEl = root.querySelector('.scroll-expand__title');
    const hint = root.querySelector('.scroll-expand__hint');
    const overlay = root.querySelector('.scroll-expand__overlay');

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1); return t * t * (3 - 2 * t); };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cfg = { endRadius: 0, mediaZoom: 1.35, scrollDistance: 1.2, holdDistance: 0.35, smoothing: 0.1, overlayScrim: 0.45 };
    let startWidth, startHeight, startRadius, stageH = 0, current = 0, target = 0, raf = 0, running = false;

    function readConfig() {
      const mobile = window.innerWidth < 640;
      startWidth = mobile ? 74 : 42;
      startHeight = mobile ? 50 : 58;
      startRadius = mobile ? 28 : 24;
    }

    function apply(p) {
      const e = smoothstep(0, 1, p);
      const w = startWidth + (100 - startWidth) * e;
      const h = startHeight + (100 - startHeight) * e;
      const ix = Math.max(0, (100 - w) / 2), iy = Math.max(0, (100 - h) / 2);
      const r = startRadius + (cfg.endRadius - startRadius) * e;
      frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
      media.style.transform = `scale(${cfg.mediaZoom + (1 - cfg.mediaZoom) * e})`;
      scrim.style.opacity = `${cfg.overlayScrim * e}`;
      const out = smoothstep(0.4, 0.88, p);
      titleEl.style.opacity = `${1 - out}`;
      titleEl.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
      const gone = smoothstep(0, 0.12, p);
      hint.style.opacity = `${1 - gone}`;
      const inn = smoothstep(0.68, 1, p);
      overlay.style.opacity = `${inn}`;
      overlay.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
      overlay.style.pointerEvents = inn > 0.9 ? 'auto' : 'none';
    }

    function measure() {
      readConfig();
      stageH = window.innerHeight;
      track.style.height = `${stageH * (1 + cfg.scrollDistance + cfg.holdDistance)}px`;
    }
    function readProgress() {
      const span = stageH * cfg.scrollDistance;
      return clamp(-track.getBoundingClientRect().top / span, 0, 1);
    }
    function tick() {
      const k = 1 - Math.exp(-1 / (60 * cfg.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) { current = target; running = false; }
      apply(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    }
    function onScroll() {
      target = readProgress();
      if (reduceMotion) { current = target; apply(current); return; }
      if (!running) { running = true; if (!raf) raf = requestAnimationFrame(tick); }
    }
    function onResize() { measure(); target = readProgress(); current = target; apply(current); }

    measure();
    target = readProgress(); current = target; apply(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  })();

  // Initialize BlurText scroll-view animations on elements with .blur-text-view
  const blurTextViewElements = document.querySelectorAll('.blur-text-view');
  if ('IntersectionObserver' in window && blurTextViewElements.length > 0) {
    blurTextViewElements.forEach((container) => {
      // Split text into words wrapped in span.blur-view-word
      const childNodes = Array.from(container.childNodes);
      container.innerHTML = '';
      let wordIndex = 0;

      childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/);
          words.forEach((w) => {
            if (/^\s+$/.test(w)) {
              container.appendChild(document.createTextNode(w));
            } else if (w.length > 0) {
              const span = document.createElement('span');
              span.className = 'blur-view-word';
              span.textContent = w;
              span.style.transitionDelay = `${wordIndex * 70}ms`;
              container.appendChild(span);
              wordIndex++;
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const wrapper = document.createElement('span');
          wrapper.className = 'blur-view-word';
          wrapper.style.transitionDelay = `${wordIndex * 70}ms`;
          wrapper.appendChild(node.cloneNode(true));
          container.appendChild(wrapper);
          wordIndex++;
        }
      });

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          container.classList.add('is-visible');
          observer.unobserve(container);
        }
      }, { threshold: 0.25 });
      observer.observe(container);
    });
  }

  // ---------- Mobile "Lihat selengkapnya" pada paragraf panjang & daftar fasilitas ----------
  (function initMobileReadMore() {
    document.querySelectorAll('[data-readmore]').forEach((el) => {
      const colorCls = el.dataset.readmore || 'text-gold-700';
      el.classList.add('rm-collapsed');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `rm-btn is-needed ${colorCls}`;
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Lihat selengkapnya ↓';
      btn.addEventListener('click', () => {
        const collapsed = el.classList.toggle('rm-collapsed');
        btn.setAttribute('aria-expanded', String(!collapsed));
        btn.textContent = collapsed ? 'Lihat selengkapnya ↓' : 'Sembunyikan ↑';
      });
      el.insertAdjacentElement('afterend', btn);
    });

    const facList = document.getElementById('fac-list');
    const facToggle = document.getElementById('fac-toggle');
    if (facList && facToggle) {
      facToggle.addEventListener('click', () => {
        const open = facList.classList.toggle('is-open');
        facToggle.setAttribute('aria-expanded', String(open));
        facToggle.textContent = open ? 'Sembunyikan ↑' : 'Lihat 5 fasilitas lainnya ↓';
      });
    }

    // Indikator titik geser (swipe), tombol panah & mouse drag untuk kartu Ekosistem di mobile
    const ekoTrack = document.getElementById('eko-track');
    const ekoDots = document.querySelectorAll('#eko-dots i');
    const ekoPrev = document.getElementById('eko-prev');
    const ekoNext = document.getElementById('eko-next');
    if (ekoTrack) {
      const getStep = () => {
        const firstCard = ekoTrack.querySelector('article');
        return firstCard ? firstCard.offsetWidth + 16 : 300;
      };
      if (ekoPrev) ekoPrev.addEventListener('click', () => ekoTrack.scrollBy({ left: -getStep(), behavior: 'smooth' }));
      if (ekoNext) ekoNext.addEventListener('click', () => ekoTrack.scrollBy({ left: getStep(), behavior: 'smooth' }));

      let dragging = false, startX = 0, startScroll = 0;
      ekoTrack.addEventListener('mousedown', (e) => {
        if (window.innerWidth >= 1024) return;
        dragging = true;
        startX = e.pageX - ekoTrack.offsetLeft;
        startScroll = ekoTrack.scrollLeft;
      });
      window.addEventListener('mouseup', () => { dragging = false; });
      ekoTrack.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        e.preventDefault();
        const x = e.pageX - ekoTrack.offsetLeft;
        ekoTrack.scrollLeft = startScroll - (x - startX) * 1.5;
      });

      if (ekoDots.length) {
        ekoTrack.addEventListener('scroll', () => {
          const max = ekoTrack.scrollWidth - ekoTrack.clientWidth;
          const idx = max > 0 ? Math.round((ekoTrack.scrollLeft / max) * (ekoDots.length - 1)) : 0;
          ekoDots.forEach((d, i) => {
            d.className = i === idx
              ? 'w-5 h-1.5 rounded-full bg-night transition-all'
              : 'w-1.5 h-1.5 rounded-full bg-night/25 transition-all';
          });
        }, { passive: true });
      }
    }
  })();

  // ---------- Vercel Client Visit & Interaction Logger ----------
  (function initClientTracker() {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocal) return;

    // Load Vercel Web Analytics script on production
    const vaScript = document.createElement('script');
    vaScript.defer = true;
    vaScript.src = '/_vercel/insights/script.js';
    document.head.appendChild(vaScript);

    const params = new URLSearchParams(location.search);
    const clientTag = params.get('client') || params.get('ref') || 'visitor';

    function sendLog(event, detail) {
      const payload = JSON.stringify({
        event,
        detail,
        tag: clientTag,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer || 'direct',
      });

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/track', blob);
        } else {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    }

    // 1. Log initial page open
    sendLog('PAGE_OPEN', location.pathname + location.search);

    // 2. Log key interactions (Pricelist tabs, Sport toggle, WhatsApp / Registration links)
    document.addEventListener('click', (e) => {
      const tierBtn = e.target.closest('.tier-tab-btn');
      if (tierBtn) {
        sendLog('CHECK_PRICELIST', `Tab: ${tierBtn.dataset.tier}`);
        return;
      }

      const sportBtn = e.target.closest('.sport-btn');
      if (sportBtn) {
        sendLog('SWITCH_SPORT', `Sport: ${sportBtn.dataset.sport}`);
        return;
      }

      const bookBtn = e.target.closest('#book-btn');
      if (bookBtn) {
        sendLog('CLICK_BOOKING_SCHEDULE', bookBtn.textContent.trim().slice(0, 50));
        return;
      }

      const link = e.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href') || '';
        if (href.includes('wa.me') || href.includes('persekutuangerejamimika.org')) {
          sendLog('CLICK_CTA_LINK', href.slice(0, 80));
        }
      }
    }, { passive: true });
  })();

}

// ==========================================
// 3. BOOTSTRAP
// ==========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadSections();
    initApp();
  });
} else {
  (async () => {
    await loadSections();
    initApp();
  })();
}
