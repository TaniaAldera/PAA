let selectedProduct = "";
let currentType = 'perhiasan';
let currentMode = 'taksir';
let currentMerek = 'galeri24';
let myChart = null;

const STL_PERHIASAN = 2271391;
const STL_GALERI24  = 2400000; // STL Galeri 24 lebih tinggi
const STL_ANTAM     = 2271391; // mengikuti STL perhiasan
const STL_UBS       = 2271391; // mengikuti STL perhiasan

function getSTLBatangan() {
    if (currentMerek === 'galeri24') return STL_GALERI24;
    if (currentMerek === 'antam')    return STL_ANTAM;
    return STL_UBS;
}

window.onload = function() {
    let currentCount = localStorage.getItem('digitaksir_usage') || 0;
    document.getElementById('countDisplay').innerText = currentCount;
    updateMerekInfo();
};

function updateCounter() {
    let count = parseInt(localStorage.getItem('digitaksir_usage') || 0);
    count++;
    localStorage.setItem('digitaksir_usage', count);
    document.getElementById('countDisplay').innerText = count;
}

function selectProduct(prod) {
    selectedProduct = prod;
    document.getElementById('productSelection').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    updateTenor();
}

function goBack() {
    document.getElementById('productSelection').style.display = 'block';
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('panelHasil').style.display = 'none';
    resetFeedback();
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('btnModeTaksir').classList.toggle('active', mode === 'taksir');
    document.getElementById('btnModeInputUP').classList.toggle('active', mode === 'inputUP');
    document.getElementById('sectionTaksir').classList.toggle('hidden', mode === 'inputUP');
    document.getElementById('sectionInputUP').classList.toggle('hidden', mode === 'taksir');
}

function switchType(type) {
    currentType = type;
    document.getElementById('btnPerhiasan').classList.toggle('active', type === 'perhiasan');
    document.getElementById('btnBatangan').classList.toggle('active', type === 'batangan');
    document.getElementById('formPerhiasan').classList.toggle('hidden', type === 'batangan');
    document.getElementById('formBatangan').classList.toggle('hidden', type === 'perhiasan');
}

function switchMerek(merek) {
    currentMerek = merek;
    document.getElementById('btnGaleri24').classList.toggle('active', merek === 'galeri24');
    document.getElementById('btnAntam').classList.toggle('active', merek === 'antam');
    document.getElementById('btnUbs').classList.toggle('active', merek === 'ubs');
    updateMerekInfo();
}

function updateMerekInfo() {
    const stl = getSTLBatangan();
    const labels = {
        galeri24: 'Galeri 24 — STL Khusus (lebih tinggi)',
        antam:    'ANTAM — STL mengikuti perhiasan',
        ubs:      'UBS — STL mengikuti perhiasan',
    };
    const el = document.getElementById('infoMerek');
    if (el) {
        el.innerText = labels[currentMerek] + ' | STL: Rp ' + stl.toLocaleString('id-ID') + '/gram';
    }
}

function updateTenor() {
    const tenor = document.getElementById('tenor');
    tenor.innerHTML = "";
    if (selectedProduct === "KCA") {
        tenor.add(new Option("120 Hari", "120"));
    } else if (selectedProduct === "FLEKSI") {
        [15, 30, 60].forEach(d => tenor.add(new Option(d + " Hari", d)));
    } else if (selectedProduct === "KRASIDA") {
        [6, 12, 18, 24, 36, 48].forEach(m => tenor.add(new Option(m + " Bulan", m)));
    }
}

function updateChart(up, sewaTotal) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    if (myChart) { myChart.destroy(); }
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Uang Diterima', 'Total Sewa'],
            datasets: [{
                data: [up, sewaTotal],
                backgroundColor: ['#008444', '#ffcc00'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        boxWidth: 12,
                        font: { size: 11 } 
                    } 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': Rp ' + Math.round(context.raw).toLocaleString('id-ID');
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function hitungTaksiran() {
    const STL = STL_PERHIASAN;
    let upFinal = 0;
    let taksiran = 0;
    let tenorVal = parseInt(document.getElementById('tenor').value);
    
    document.getElementById('beratPerhiasan').classList.remove('input-error');
    document.getElementById('inputNominalUP').classList.remove('input-error');

    if (currentMode === 'taksir') {
        if(currentType === 'perhiasan') {
            let berat = parseFloat(document.getElementById('beratPerhiasan').value) || 0;
            let karatValue = parseFloat(document.getElementById('kadar').value);
            
            if(berat <= 0 || berat > 1000) { 
                alert("Masukkan berat bersih yang valid (0.01 - 1000 gr)"); 
                document.getElementById('beratPerhiasan').classList.add('input-error');
                return; 
            }
            taksiran = berat * (karatValue / 24) * STL;
        } else {
            taksiran = parseFloat(document.getElementById('denominasi').value) * getSTLBatangan();
        }
        
        let plafon = (selectedProduct === "KRASIDA") ? 0.95 : 0.92; 
        if (selectedProduct === "FLEKSI" && tenorVal == 15) plafon = 0.96;
        
        let upRaw = taksiran * plafon;
        upFinal = Math.floor(upRaw / 1000) * 1000;
        document.getElementById('rowTaksiran').classList.remove('hidden');
        document.getElementById('titleUP').innerText = "Uang Pinjaman (UP)";
    } else {
        upFinal = parseFloat(document.getElementById('inputNominalUP').value) || 0;
        if(upFinal < 50000) { 
            alert("Minimal pinjaman adalah Rp 50.000"); 
            document.getElementById('inputNominalUP').classList.add('input-error');
            return; 
        }
        document.getElementById('rowTaksiran').classList.add('hidden');
        document.getElementById('titleUP').innerText = "Nominal Pinjaman";
    }

    let sewaDesc = "";
    let estimasiSewa = 0;
    let unitWaktu = "";
    let dt = new Date();
    let totalSewaUntukGrafik = 0;

    document.getElementById('sectionDetailKCA').classList.add('hidden');
    document.getElementById('bodyTabelKCA').innerHTML = "";

    if (selectedProduct === "KCA") {
        let tarifKCA = (upFinal > 20100000) ? 0.011 : 0.012;
        sewaDesc = (tarifKCA * 100).toFixed(1) + "% / 15 Hari";
        estimasiSewa = upFinal * tarifKCA;
        unitWaktu = " / 15 Hari";
        dt.setDate(dt.getDate() + 120);
        document.getElementById('lblSewaNominal').innerText = "Estimasi Sewa (Per 15 Hari):";
        totalSewaUntukGrafik = estimasiSewa * 8; 

        document.getElementById('sectionDetailKCA').classList.remove('hidden');
        let htmlTabel = "";
        for(let i = 1; i <= 8; i++) {
            let sewaAkumulasi = upFinal * tarifKCA * i;
            htmlTabel += `<tr><td>Ke-${i}</td><td>${i * 15}</td><td>Rp ${Math.round(sewaAkumulasi).toLocaleString('id-ID')}</td></tr>`;
        }
        document.getElementById('bodyTabelKCA').innerHTML = htmlTabel;

    } else if (selectedProduct === "FLEKSI") {
        sewaDesc = "0.07% / Hari";
        estimasiSewa = upFinal * 0.0007;
        unitWaktu = " / Hari";
        dt.setDate(dt.getDate() + tenorVal);
        document.getElementById('lblSewaNominal').innerText = "Estimasi Sewa:";
        totalSewaUntukGrafik = estimasiSewa * tenorVal;
    } else if (selectedProduct === "KRASIDA") {
        let tarifKrasida = 0.0125;
        if (tenorVal === 18 || tenorVal === 36) tarifKrasida = 0.013;
        else if (tenorVal === 48) tarifKrasida = 0.014;
        sewaDesc = (tarifKrasida * 100).toFixed(2) + "% / Bulan";
        estimasiSewa = (upFinal / tenorVal) + (upFinal * tarifKrasida);
        unitWaktu = " / Bulan";
        dt.setMonth(dt.getMonth() + tenorVal);
        document.getElementById('lblSewaNominal').innerText = "Angsuran Tetap:";
        totalSewaUntukGrafik = (upFinal * tarifKrasida) * tenorVal;
    }

    document.getElementById('resUP').innerText = "Rp " + upFinal.toLocaleString('id-ID');
    document.getElementById('resTaksiran').innerText = "Rp " + Math.round(taksiran).toLocaleString('id-ID');
    document.getElementById('resSewaDesc').innerText = sewaDesc;
    document.getElementById('resSewaNominal').innerText = "± Rp " + Math.round(estimasiSewa).toLocaleString('id-ID') + unitWaktu;
    document.getElementById('resJatuhTempo').innerText = dt.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    
    document.getElementById('panelHasil').style.display = 'block';
    document.getElementById('panelHasil').scrollIntoView({ behavior: 'smooth' });
    
    updateChart(upFinal, totalSewaUntukGrafik);
    updateCounter();
    resetFeedback();
}

function setRating(n) {
    const stars = document.querySelectorAll('#starContainer span');
    stars.forEach((s, index) => {
        s.classList.toggle('selected', index < n);
    });
    alert("Terima kasih! Rating " + n + " bintang Anda telah terekam.");
}

function resetFeedback() {
    const stars = document.querySelectorAll('#starContainer span');
    stars.forEach(s => s.classList.remove('selected'));
}
