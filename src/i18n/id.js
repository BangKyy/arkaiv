// Indonesian interface strings (primary language, PRD section 10).
// Keep every user-facing string here so English can be added in V2 as en.js.
export default {
  siteName: 'Arkaiv',
  siteTagline: 'Direktori Studio Desain Surabaya',
  siteDescription:
    'Peta direktori studio desain dan agensi kreatif di Surabaya. Temukan studio berdasarkan lokasi dan spesialisasi.',

  nav: {
    explore: 'Jelajahi peta',
    about: 'Tentang',
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
    back: 'Kembali ke daftar',
    sections: {
      about: 'Tentang',
      people: 'Tim',
      specialty: 'Spesialisasi',
      approach: 'Pendekatan & proses',
      projects: 'Proyek',
      contact: 'Kontak',
    },
    sectionsNav: 'Bagian profil',
    address: 'Alamat',
    area: 'Wilayah',
    website: 'Situs web',
    instagram: 'Instagram',
    email: 'Email',
    whatsapp: 'WhatsApp',
    openMaps: 'Buka di Google Maps',
    newTab: '(membuka tab baru)',
    lastVerified: 'Terakhir diverifikasi',
    report: 'Ada data yang salah? Ajukan koreksi',
    removal: 'Pemilik studio? Minta listing dihapus',
    notFound: 'Studio tidak ditemukan.',
    notFoundBody: 'Tautan ini mungkin sudah berubah atau studio sudah tidak terdaftar.',
  },

  notFound: {
    title: 'Halaman tidak ditemukan',
    back: 'Kembali ke peta',
  },
}
