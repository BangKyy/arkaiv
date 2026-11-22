// Indonesian interface strings (primary language, PRD section 10).
// Keep every user-facing string here so English can be added in V2 as en.js.
export default {
  siteName: 'Arkaiv',
  siteTagline: 'Direktori Studio Desain Surabaya',
  siteDescription:
    'Peta direktori studio desain dan agensi kreatif di Surabaya. Temukan studio berdasarkan lokasi dan spesialisasi.',

  nav: {
    home: 'Beranda',
    explore: 'Jelajahi peta',
    submit: 'Daftarkan studio kamu',
    submitShort: 'Daftarkan studio',
    main: 'Navigasi utama',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
  },

  footer: 'Direktori Studio Desain Surabaya 2027',

  sampleBanner: 'Data contoh: studio di peta ini fiktif dan hanya untuk pengembangan.',

  filter: {
    label: 'Filter kategori',
    all: 'Semua',
    clear: 'Hapus filter',
    active: (n) => `${n} kategori aktif`,
  },

  list: {
    heading: 'Daftar studio',
    count: (shown, total) => (shown === total ? `${total} studio` : `${shown} dari ${total} studio`),
    empty: 'Tidak ada studio yang cocok dengan filter ini.',
    expand: 'Tampilkan daftar',
    collapse: 'Sembunyikan daftar',
    panelToggle: 'Panel daftar',
  },

  map: {
    label: 'Peta studio desain Surabaya',
    legend: 'Keterangan',
    legendPin: 'Ikon pin menunjukkan kategori utama studio. Warna pin adalah warna penanda studio.',
    cluster: (n) => `${n} studio di sekitar sini, perbesar`,
    pin: (name, category) => `${name}, ${category}`,
    errorTitle: 'Peta tidak dapat dimuat.',
    errorBody: 'Daftar studio tetap bisa dipakai di bawah ini.',
    retry: 'Coba lagi',
    boundaryNote: 'Batas wilayah disederhanakan.',
  },

  card: {
    viewProfile: 'Lihat profil',
    close: 'Tutup',
  },

  profile: {
    direct: 'Direct',
    directLabel: (name) => `Buka halaman ${name}`,
    sectionEyebrow: (n) => `Bagian ${String(n).padStart(2, '0')}`,
    sections: {
      about: 'Tentang',
      people: 'Tim',
      specialty: 'Spesialisasi',
      approach: 'Pendekatan & Proses',
      projects: 'Portofolio & Dokumentasi',
      contact: 'Kontak',
    },
    archive: 'Arsip',
    archiveYears: '2026 - 2027',
    copyLink: 'Salin tautan',
    copied: 'Tautan disalin',
    founded: 'Berdiri',
    type: 'Jenis',
    step: (n) => `Langkah ${n}`,
    specialtyNote: 'Kategori utama ditandai warna penuh. Tag dengan bergaris adalah spesialisasi bebas dari studio.',
    internship: 'Internship',
    all: 'Semua',
    seeMore: 'Lihat lebih lanjut',
    team: 'Tim',
    portfolio: 'Portofolio',
    address: 'Alamat',
    area: 'Wilayah',
    website: 'Website',
    instagram: 'Instagram',
    email: 'Email',
    phone: 'Telepon',
    whatsapp: 'WhatsApp',
    hours: 'Jam operasional',
    googleMaps: 'Google Maps',
    openMaps: 'Buka di Google Maps',
    newTab: '(membuka tab baru)',
    lastVerified: (date) => `Terakhir diverifikasi pada tanggal ${date}`,
  },

  notFound: {
    title: 'Halaman tidak ditemukan',
    report: 'Laporkan jika halaman bermasalah',
    reportSubject: 'Laporan halaman bermasalah',
    reportBody: (url) => `Halo arkaiv,\n\nHalaman ini tidak ditemukan atau bermasalah:\n${url}\n\nKeterangan tambahan:\n`,
    home: 'Kembali ke beranda',
  },
}
