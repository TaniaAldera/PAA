/* =========================================================
   PEGADAIAN MAYANG MANGURAI — app.js
   Berisi seluruh logika: navigasi, Digi-Taksir, Cicil Emas
   ========================================================= */

/* ===== NAVIGASI ===== */
const LOGO_HTML = `
  <div class="logo-box">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Danantara_Indonesia_%28no_SW%29.svg/3840px-Danantara_Indonesia_%28no_SW%29.svg.png" alt="Danantara"/>
    <div class="sep"></div>
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Pegadaian_logo_%282013%29.svg/1280px-Pegadaian_logo_%282013%29.svg.png" alt="Pegadaian"/>
  </div>`;

const headers = {
  pageIndex:
    `${LOGO_HTML}<div class="header-badge">Selamat Datang 😊</div>`,
  pageDigiTaksir:
    `${LOGO_HTML}<div class="header-center"><h2>DIGI-<span>TAKSIR</span></h2><p>Digital Appraisal &amp; Education System</p></div><button class="btn-back" onclick="showPage('pageIndex')">← Kembali</button>`,
  pageCicilEmas:
    `${LOGO_HTML}<div class="header-center"><h2>CICIL <span>EMAS</span></h2><p>Galeri 24 — Simulasi Angsuran</p></div><button class="btn-back" onclick="showPage('pageIndex')">← Kembali</button>`,
};

/**
 * Tampilkan halaman tertentu dan sembunyikan yang lain.
 * @param {string} id - ID elemen halaman yang dituju
 */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('siteHeader').innerHTML = headers[id] || headers.pageIndex;
  window.scrollTo(0, 0);

  if (id === 'pageCicilEmas') {
    renderTable();
  }
  if (id === 'pageDigiTaksir') {
    const countEl = document.getElementById('countDisplay');
    if (countEl) countEl.innerText = localStorage.getItem('digitaksir_usage') || 0;
  }
}

// Inisialisasi header halaman awal
document.getElementById('siteHeader').innerHTML = headers.pageIndex;


/* =========================================================
   DIGI-TAKSIR — State & Konstanta
   ========================================================= */
let selectedProduct = '';
let currentType     = 'perhiasan';
let currentMode     = 'taksir';
let myChart         = null;
let itemCounter     = 0;
let itemsData       = [];

// Standar Taksiran Logam (STL) per gram dalam Rupiah
const STL_PERHIASAN = 2290196;  // perhiasan & ANTAM & UBS
const STL_GALERI24  = 2390095;  // emas batangan Galeri 24

/**
 * Kembalikan nilai STL berdasarkan merek batangan yang dipilih.
 */
function getSTLBatangan() {
  const v = document.getElementById('merekBatangan')?.value || 'galeri24';
  return v === 'galeri24' ? STL_GALERI24 : STL_PERHIASAN;
}

/**
 * Tambah 1 ke counter simulasi di localStorage dan tampilkan ke UI.
 */
function updateCounter() {
  let c = parseInt(localStorage.getItem('digitaksir_usage') || 0) + 1;
  localStorage.setItem('digitaksir_usage', c);
  const el = document.getElementById('countDisplay');
  if (el) el.innerText = c;
}

/* ===== NAVIGASI PRODUK ===== */

/**
 * Pilih produk dan tampilkan form input.
 * @param {string} prod - 'KCA' | 'FLEKSI' | 'KRASIDA'
 */
function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById('productSelection').style.display = 'none';
  document.getElementById('inputSection').classList.remove('hidden');
  document.getElementById('panelHasil').style.display = 'none';

  // Inisialisasi item list jika belum ada
  const list = document.getElementById('itemList');
  if (list && list.children.length === 0) initItems();

  updateTenor();
}

/**
 * Kembali ke halaman pilihan produk.
 */
function goBack() {
  document.getElementById('productSelection').style.display = 'block';
  document.getElementById('inputSection').classList.add('hidden');
  document.getElementById('panelHasil').style.display = 'none';
  resetFeedback();
}

/* ===== SWITCH MODE & TYPE ===== */

/**
 * Ganti mode antara taksir emas dan input pinjaman langsung.
 * @param {'taksir'|'inputUP'} mode
 */
function switchMode(mode) {
  currentMode = mode;
  document.getElementById('btnModeTaksir').classList.toggle('active',  mode === 'taksir');
  document.getElementById('btnModeInputUP').classList.toggle('active', mode === 'inputUP');
  document.getElementById('sectionTaksir').classList.toggle('hidden',  mode === 'inputUP');
  document.getElementById('sectionInputUP').classList.toggle('hidden', mode === 'taksir');
}

/**
 * Ganti jenis jaminan antara perhiasan dan batangan.
 * @param {'perhiasan'|'batangan'} type
 */
function switchType(type) {
  currentType = type;
  document.getElementById('btnPerhiasan').classList.toggle('active', type === 'perhiasan');
  document.getElementById('btnBatangan').classList.toggle('active',  type === 'batangan');
  document.getElementById('formPerhiasan').classList.toggle('hidden', type === 'batangan');
  document.getElementById('formBatangan').classList.toggle('hidden',  type === 'perhiasan');

  if (type === 'batangan')  updateMerekInfo();
  if (type === 'perhiasan') {
    const list = document.getElementById('itemList');
    if (list && list.children.length === 0) initItems();
  }
}

/**
 * Handler saat merek batangan berubah.
 */
function onMerekChange() {
  updateMerekInfo();
}

/**
 * Perbarui info STL merek batangan.
 */
function updateMerekInfo() {
  const el = document.getElementById('infoMerek');
  if (!el) return;
  const merek = document.getElementById('merekBatangan')?.value || 'galeri24';
  const stl   = getSTLBatangan();
  const labels = {
    galeri24: 'Galeri 24 — STL Khusus (lebih tinggi)',
    antam:    'ANTAM — STL mengikuti perhiasan',
    ubs:      'UBS — STL mengikuti perhiasan',
  };
  el.innerText = (labels[merek] || '') + ' | STL: Rp ' + stl.toLocaleString('id-ID') + '/gram';
}

/**
 * Isi dropdown tenor sesuai produk yang dipilih.
 */
function updateTenor() {
  const tenor = document.getElementById('tenor');
  tenor.innerHTML = '';
  if (selectedProduct === 'KCA') {
    tenor.add(new Option('120 Hari', '120'));
  } else if (selectedProduct === 'FLEKSI') {
    [15, 30, 60, 180].forEach(d => tenor.add(new Option(d + ' Hari', d)));
  } else if (selectedProduct === 'KRASIDA') {
    [6, 12, 18, 24, 36, 48].forEach(m => tenor.add(new Option(m + ' Bulan', m)));
  }
}

/* ===== MULTI-ITEM PERHIASAN ===== */

/**
 * Reset dan inisialisasi daftar item (mulai dengan 1 item kosong).
 */
function initItems() {
  itemsData = [];
  itemCounter = 0;
  document.getElementById('itemList').innerHTML = '';
  addItem();
  updateTotalTaksiranDisplay();
}

/**
 * Tambah baris item perhiasan baru ke dalam form.
 */
function addItem() {
  if (itemCounter >= 10) { alert('Maksimal 10 item.'); return; }
  itemCounter++;
  const id = itemCounter;

  // Opsi karat yang tersedia
  const opts = [6, 8, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
    .map(k => `<option value="${k}"${k === 18 ? ' selected' : ''}>${k} Karat</option>`)
    .join('');

  const html = `
  <div class="item-row" id="item-${id}">
    <div class="item-header">
      <span class="item-label">Item ${id}</span>
      ${id > 1 ? `<button class="btn-remove-item" onclick="removeItem(${id})">✕ Hapus</button>` : ''}
    </div>
    <div class="item-fields">
      <div class="item-field">
        <label>Kadar</label>
        <select id="kadar-${id}" onchange="recalcItem(${id})">${opts}</select>
      </div>
      <div class="item-field">
        <label>Berat (gr)</label>
        <input type="number" id="berat-${id}" placeholder="0.00" step="0.01" oninput="recalcItem(${id})">
      </div>
      <div class="item-field item-field-full">
        <label>Taksiran</label>
        <div class="item-taksiran" id="taksiran-${id}">Rp —</div>
      </div>
    </div>
  </div>`;

  document.getElementById('itemList').insertAdjacentHTML('beforeend', html);
  itemsData.push({ id, taksiran: 0 });
  updateTotalTaksiranDisplay();
  document.getElementById('btnAddItem').style.display = itemsData.length >= 10 ? 'none' : 'block';
}

/**
 * Hapus item perhiasan berdasarkan ID.
 * @param {number} id
 */
function removeItem(id) {
  document.getElementById(`item-${id}`)?.remove();
  itemsData = itemsData.filter(it => it.id !== id);
  updateTotalTaksiranDisplay();
  document.getElementById('btnAddItem').style.display = itemsData.length >= 10 ? 'none' : 'block';
}

/**
 * Hitung ulang taksiran untuk satu item dan perbarui tampilan.
 * @param {number} id
 */
function recalcItem(id) {
  const berat = parseFloat(document.getElementById(`berat-${id}`)?.value) || 0;
  const karat = parseFloat(document.getElementById(`kadar-${id}`)?.value);
  const t = berat > 0 ? berat * (karat / 24) * STL_PERHIASAN : 0;

  const entry = itemsData.find(it => it.id === id);
  if (entry) entry.taksiran = t;

  const el = document.getElementById(`taksiran-${id}`);
  if (el) el.innerText = t > 0 ? 'Rp ' + Math.round(t).toLocaleString('id-ID') : 'Rp —';

  updateTotalTaksiranDisplay();
}

/**
 * Perbarui tampilan total taksiran seluruh item.
 */
function updateTotalTaksiranDisplay() {
  const total = itemsData.reduce((s, it) => s + (it.taksiran || 0), 0);
  const row   = document.getElementById('rowTotalTaksiran');
  const el    = document.getElementById('totalTaksiranDisplay');
  if (!row || !el) return;

  if (total > 0) {
    row.style.display = 'flex';
    el.innerText = 'Rp ' + Math.round(total).toLocaleString('id-ID');
  } else {
    row.style.display = 'none';
  }
}

/* ===== KALKULASI UTAMA ===== */

/**
 * Hitung estimasi pinjaman & sewa modal, lalu tampilkan hasilnya.
 */
function hitungTaksiran() {
  const isTaksir    = document.getElementById('btnModeTaksir')?.classList.contains('active');
  const isPerhiasan = document.getElementById('btnPerhiasan')?.classList.contains('active');
  const tenorVal    = parseInt(document.getElementById('tenor').value);
  let upFinal = 0, taksiran = 0;

  // Reset error state
  document.getElementById('inputNominalUP')?.classList.remove('input-error');

  /* --- Mode: Taksir dari barang --- */
  if (isTaksir) {
    if (isPerhiasan) {
      // Validasi semua item memiliki berat > 0
      let ok = true;
      itemsData.forEach(it => {
        if ((parseFloat(document.getElementById(`berat-${it.id}`)?.value) || 0) <= 0) {
          alert(`Item ${it.id}: masukkan berat > 0 gram`);
          ok = false;
        }
      });
      if (!ok) return;

      taksiran = itemsData.reduce((s, it) => s + (it.taksiran || 0), 0);
      if (taksiran <= 0) { alert('Tidak ada item dengan taksiran valid.'); return; }

      // Tampilkan rincian item
      const rs = document.getElementById('rincianItemSection');
      const rb = document.getElementById('bodyRincianItem');
      if (rs && rb) {
        rs.classList.remove('hidden');
        rb.innerHTML = itemsData.map((it, i) => {
          const k = document.getElementById(`kadar-${it.id}`)?.value || '-';
          const b = document.getElementById(`berat-${it.id}`)?.value || '-';
          return `<tr>
            <td>Item ${i + 1}</td>
            <td>${k} Karat</td>
            <td>${b} gr</td>
            <td>Rp ${Math.round(it.taksiran).toLocaleString('id-ID')}</td>
          </tr>`;
        }).join('');
      }
    } else {
      // Batangan
      taksiran = parseFloat(document.getElementById('denominasi').value) * getSTLBatangan();
      document.getElementById('rincianItemSection')?.classList.add('hidden');
    }

    // Plafon uang pinjaman (persentase dari taksiran)
    let plafon = selectedProduct === 'KRASIDA' ? 0.95 : 0.92;
    if (selectedProduct === 'FLEKSI' && tenorVal === 15) plafon = 0.96;

    upFinal = Math.floor(taksiran * plafon / 1000) * 1000;
    document.getElementById('rowTaksiran').classList.remove('hidden');
    document.getElementById('titleUP').innerText = 'Uang Pinjaman (UP)';

  /* --- Mode: Input langsung nominal pinjaman --- */
  } else {
    upFinal = parseFloat(document.getElementById('inputNominalUP').value) || 0;
    if (upFinal < 50000) {
      alert('Minimal pinjaman Rp 50.000');
      document.getElementById('inputNominalUP').classList.add('input-error');
      return;
    }
    document.getElementById('rowTaksiran').classList.add('hidden');
    document.getElementById('rincianItemSection')?.classList.add('hidden');
    document.getElementById('titleUP').innerText = 'Nominal Pinjaman';
  }

  /* --- Kalkulasi Sewa Modal per Produk --- */
  let sewaDesc = '', estimasiSewa = 0, unitWaktu = '', totalSewaGrafik = 0;
  let dt = new Date();

  document.getElementById('sectionDetailKCA').classList.add('hidden');
  document.getElementById('bodyTabelKCA').innerHTML = '';

  if (selectedProduct === 'KCA') {
    // Tarif: 1.2% per 15 hari untuk UP ≤ 20jt, 1.1% untuk UP > 20jt
    const tarif = upFinal > 20100000 ? 0.011 : 0.012;
    sewaDesc = (tarif * 100).toFixed(1) + '% / 15 Hari';
    estimasiSewa = upFinal * tarif;
    unitWaktu = ' / 15 Hari';
    dt.setDate(dt.getDate() + 120);
    document.getElementById('lblSewaNominal').innerText = 'Estimasi Sewa (Per 15 Hari):';
    totalSewaGrafik = estimasiSewa * 8; // 8 periode dalam 120 hari

    // Tabel rincian 8 periode KCA
    document.getElementById('sectionDetailKCA').classList.remove('hidden');
    let rows = '';
    for (let i = 1; i <= 8; i++) {
      rows += `<tr>
        <td>Ke-${i}</td>
        <td>${i * 15}</td>
        <td>Rp ${Math.round(upFinal * tarif * i).toLocaleString('id-ID')}</td>
      </tr>`;
    }
    document.getElementById('bodyTabelKCA').innerHTML = rows;

  } else if (selectedProduct === 'FLEKSI') {
    sewaDesc = '0.07% / Hari';
    estimasiSewa = upFinal * 0.0007;
    unitWaktu = ' / Hari';
    dt.setDate(dt.getDate() + tenorVal);
    document.getElementById('lblSewaNominal').innerText = 'Estimasi Sewa:';
    totalSewaGrafik = estimasiSewa * tenorVal;

  } else if (selectedProduct === 'KRASIDA') {
    let tarif = 0.0125;
    if (tenorVal === 18 || tenorVal === 36) tarif = 0.013;
    else if (tenorVal === 48)               tarif = 0.014;

    sewaDesc = (tarif * 100).toFixed(2) + '% / Bulan';
    estimasiSewa = upFinal / tenorVal + upFinal * tarif; // pokok + bunga per bulan
    unitWaktu = ' / Bulan';
    dt.setMonth(dt.getMonth() + tenorVal);
    document.getElementById('lblSewaNominal').innerText = 'Angsuran Tetap:';
    totalSewaGrafik = upFinal * tarif * tenorVal;
  }

  /* --- Tampilkan Hasil --- */
  document.getElementById('resUP').innerText          = 'Rp ' + upFinal.toLocaleString('id-ID');
  document.getElementById('resTaksiran').innerText    = 'Rp ' + Math.round(taksiran).toLocaleString('id-ID');
  document.getElementById('resSewaDesc').innerText    = sewaDesc;
  document.getElementById('resSewaNominal').innerText = '± Rp ' + Math.round(estimasiSewa).toLocaleString('id-ID') + unitWaktu;
  document.getElementById('resJatuhTempo').innerText  = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const panelHasil = document.getElementById('panelHasil');
  panelHasil.style.display = 'block';
  panelHasil.scrollIntoView({ behavior: 'smooth' });

  /* --- Grafik Donat --- */
  const ctx = document.getElementById('loanChart').getContext('2d');
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Uang Diterima', 'Total Sewa'],
      datasets: [{
        data: [upFinal, totalSewaGrafik],
        backgroundColor: ['#008444', '#ffcc00'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: c => c.label + ': Rp ' + Math.round(c.raw).toLocaleString('id-ID'),
          },
        },
      },
      cutout: '65%',
    },
  });

  updateCounter();
  resetFeedback();
}

/* ===== RATING / FEEDBACK ===== */

/**
 * Set rating bintang dan tampilkan konfirmasi.
 * @param {number} n - nilai 1–5
 */
function setRating(n) {
  document.querySelectorAll('#starContainer span').forEach((s, i) => {
    s.classList.toggle('selected', i < n);
  });
  alert('Terima kasih! Rating ' + n + ' bintang Anda telah terekam.');
}

/**
 * Reset tampilan bintang ke kondisi awal.
 */
function resetFeedback() {
  document.querySelectorAll('#starContainer span').forEach(s => s.classList.remove('selected'));
}


/* =========================================================
   CICIL EMAS — Data & Logika
   ========================================================= */

// Harga emas Galeri 24 per denominasi (Rupiah) — update berkala
const hargaEmas = {
    0.5: 1476000,
      1: 2814000,
      2: 5560000,
      5: 13799000,
     10: 27524000,
     25: 68440000,
     50: 136771000,
    100: 273408000,
    250: 681840000,
    500: 1363678000,
   1000: 2727354000,
};

let currentMargin    = 0.0092;
let customDPRupiah   = 0;
const adminFee       = 50000;
const dpRate         = 0.15;  // DP minimal 15%

/**
 * Format angka ke string Rupiah tanpa desimal.
 * @param {number} n
 * @returns {string}
 */
function formatIDR(n) {
  return Math.floor(n).toLocaleString('id-ID');
}

/**
 * Ganti margin dan render ulang tabel.
 * @param {number} val  - nilai margin desimal (misal 0.0092)
 * @param {HTMLElement} btn - tombol yang diklik
 */
function switchMargin(val, btn) {
  currentMargin = val;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}

/**
 * Handler input DP tambahan — format angka dan render ulang tabel.
 * @param {string} val - nilai raw dari input
 */
function handleDPInput(val) {
  const clean = val.replace(/\D/g, '');
  if (clean) {
    document.getElementById('dp-rupiah-input').value = parseInt(clean).toLocaleString('id-ID');
  }
  customDPRupiah = parseInt(clean) || 0;
  renderTable();
}

/**
 * Render tabel simulasi cicil emas berdasarkan margin & DP saat ini.
 */
function renderTable() {
  const tbody = document.getElementById('simulation-table');
  if (!tbody) return;

  const info = document.getElementById('dp-info-text');
  tbody.innerHTML = '';

  [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000].forEach(denom => {
    const tunai    = hargaEmas[denom];
    const dpMin    = tunai * dpRate;
    const dpPakai  = customDPRupiah > dpMin ? customDPRupiah : dpMin;
    const totalDP  = dpPakai + adminFee;
    const pinjaman = tunai - dpPakai;
    const bunga    = tunai * currentMargin; // bunga flat per bulan dihitung dari harga tunai

    const row = document.createElement('tr');
    let html = `
      <td>${denom >= 1 ? denom : '0,5'} Gram</td>
      <td>${formatIDR(totalDP)}</td>
      <td class="val-pinjaman">${formatIDR(pinjaman)}</td>`;

    [3, 6, 12, 18, 24, 36].forEach(tenor => {
      html += `<td>${formatIDR(pinjaman / tenor + bunga)}</td>`;
    });

    row.innerHTML = html;
    tbody.appendChild(row);
  });

  if (info) {
    info.innerText = customDPRupiah > 0
      ? `Menggunakan DP Rp ${formatIDR(customDPRupiah)} (atau minimal 15% per item)`
      : 'Menggunakan standar minimal DP 15% per item';
  }
}

/* ===== INISIALISASI ===== */
window.addEventListener('load', () => {
  // Tampilkan tanggal update pada halaman Cicil Emas
  const dateEl = document.getElementById('date-display');
  if (dateEl) {
    dateEl.innerText = 'Last Update: ' + new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }
});
