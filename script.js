import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYTv3_YHFDcJIsOYXmNGkl1bLpt6IMIbk",
    authDomain: "netflix-only-win.firebaseapp.com",
    databaseURL: "https://netflix-only-win-default-rtdb.firebaseio.com",
    projectId: "netflix-only-win",
    storageBucket: "netflix-only-win.firebasestorage.app",
    messagingSenderId: "951719931998",
    appId: "1:951719931998:web:a83532a0445b97a70a44cf",
    measurementId: "G-TH42BYKMES"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'pembayaran_netflix_v2'); 

const members = [
    { id: 1, name: "Eunike Sangka", role: "KETUA", img: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" },
    { id: 2, name: "Gad Saung", role: "Anak Bawang ji Kodong", img: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" },
    { id: 3, name: "Alfa Septiano", role: "Anak Bawang ji Kodong", img: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" },
    { id: 4, name: "Joshua Saung", role: "Anak Bawang ji Kodong", img: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" },
    { id: 5, name: "Yemima Surya", role: "Anak Bawang ji Kodong", img: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" }
];

const startDate = new Date(2025, 8, 5); 
const totalMonths = 13; 
const PRICE_ADMIN = 100000;
const PRICE_MEMBER = 21500;
const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const memberList = document.getElementById('member-list');
if(memberList) {
    memberList.innerHTML = ''; 
    members.forEach(member => {
        const priceLabel = member.id === 1 ? "Rp 100.000" : "Rp 21.500";
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${member.img}" alt="${member.name}" class="avatar">
            <h3>${member.name}</h3>
            <span class="role">${member.role}</span>
            <div style="margin-bottom:10px; font-weight:bold; color:var(--success); font-size:0.9rem;">Tagihan: ${priceLabel}</div>
            <a href="https://wa.me/?text=Halo%20${member.name},%20jangan%20lupa%20transfer%20Netflix%20sebesar%20${priceLabel}%20ya!" target="_blank" class="contact-btn"><i class="fab fa-whatsapp"></i> Ingatkan</a>
        `;
        memberList.appendChild(card);
    });
}

let globalPaymentData = {}; 

onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    globalPaymentData = data || {}; 
    renderTable(); 
}, (error) => {
    console.error("Firebase Error:", error);
    const tableBody = document.getElementById('payment-rows');
    if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data. Cek koneksi atau Rules Firebase.</td></tr>`;
});

function renderTable() {
    const paymentTableBody = document.getElementById('payment-rows');
    if(!paymentTableBody) return;
    
    paymentTableBody.innerHTML = ''; 

    // Hitung Total Target: 1 Admin (100k) + 4 Member (21.5k) = 186.000
    const TARGET_TOTAL = PRICE_ADMIN + (4 * PRICE_MEMBER);

    for (let i = 0; i < totalMonths; i++) {
        let currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);

        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const dateString = currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let statusHTML = '<div class="status-indicators">';
        let paidCount = 0;
        let currentTotalMoney = 0;

        members.forEach(m => {
            let isPaid = false;
            if (globalPaymentData[monthKey] && globalPaymentData[monthKey][m.id]) {
                isPaid = true;
            }

            if(isPaid) {
                paidCount++;
                currentTotalMoney += (m.id === 1) ? PRICE_ADMIN : PRICE_MEMBER;
                statusHTML += `<div class="dot paid btn-toggle" data-month="${monthKey}" data-id="${m.id}" title="${m.name}: Lunas">${m.name.charAt(0)}</div>`;
            } else {
                statusHTML += `<div class="dot unpaid btn-toggle" data-month="${monthKey}" data-id="${m.id}" title="${m.name}: Belum Bayar">${m.name.charAt(0)}</div>`;
            }
        });
        statusHTML += '</div>';

        // === LOGIC PROGRESS BAR ===
        // Hitung persentase (0 - 100)
        let percent = Math.round((currentTotalMoney / TARGET_TOTAL) * 100);
        if(percent > 100) percent = 100; // Jaga-jaga agar tidak lewat

        // Tentukan class warna (merah default, hijau jika 100%)
        const progressClass = percent === 100 ? 'progress-fill full' : 'progress-fill';
        const isFullPaid = paidCount === 5; 

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="color: var(--primary-red); font-weight:500">${monthName}</td>
            <td>${dateString}</td>
            <td class="col-status">${statusHTML}</td> 
            <td class="money-cell">
                <strong style="color: ${isFullPaid ? 'var(--success)' : 'var(--text-white)'}; font-size: 1.1rem;">
                    ${formatIDR(currentTotalMoney)}
                </strong>
                
                <div class="progress-wrapper">
                    <div class="progress-track">
                        <div class="${progressClass}" style="width: ${percent}%"></div>
                    </div>
                    <small class="progress-text">${percent}% Terkumpul</small>
                </div>
            </td>
        `;
        paymentTableBody.appendChild(row);
    }

    document.querySelectorAll('.btn-toggle').forEach(dot => {
        dot.addEventListener('click', function() {
            const mKey = this.getAttribute('data-month');
            const mId = this.getAttribute('data-id');
            updatePaymentStatus(mKey, mId);
        });
    });
}

function updatePaymentStatus(monthKey, memberId) {
    let updatedData = {...globalPaymentData};
    if (!updatedData[monthKey]) updatedData[monthKey] = {};
    if (updatedData[monthKey][memberId]) {
        updatedData[monthKey][memberId] = false;
    } else {
        updatedData[monthKey][memberId] = true;
    }
    set(dbRef, updatedData)
        .then(() => { console.log("Data saved"); })
        .catch((error) => { alert("Gagal update data. Cek koneksi."); });
}

const slides = document.querySelectorAll('.hero-bg-slider .slide');
let currentSlide = 0;
const slideInterval = 5000;
function nextSlide() {
    if(slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}
if(slides.length > 0) setInterval(nextSlide, slideInterval);