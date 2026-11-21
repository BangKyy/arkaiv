import { Link } from 'react-router'
import { usePageMeta } from '../lib/hooks'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import { CategoryBox, RegionBox, StepBox } from '../components/LabeledBox'
import { ArrowUpRight } from '../components/icons'
import bookImage from '../assets/book-placeholder.png'

// FR-12: what the project is, how studios are chosen, how to be listed or corrected.
// Layout and copy follow the Figma "Tentang Direktori" screens (desktop, tablet, mobile).
// Inclusion rules mirror PRD section 11 (Proposed).
export default function About() {
  usePageMeta('Tentang', 'Tentang Arkaiv, direktori studio desain Surabaya, dan cara studio dipilih.')

  return (
    <article className="about">
      <header className="about__hero">
        <div className="about__inner">
          <p className="about__eyebrow">Tentang direktori</p>
          <h1 className="about__title">
            Arsip hidup studio desain di <span className="about__title-accent">Surabaya.</span>
          </h1>
          <p className="about__lede">
            Direktori ini memetakan studio dan agensi kreatif di Surabaya berdasarkan lokasi dan
            spesialisasi, supaya mahasiswa desain dan komunitas kreatif bisa menemukan referensi
            profesional di kota sendiri.
          </p>
          <Button as={Link} to="/" size="xl" icon={ArrowUpRight} className="about__cta">
            Jelajahi peta virtual
          </Button>
        </div>
      </header>

      <section className="about__book" aria-labelledby="about-book">
        <div className="about__inner about__book-inner">
          <div className="about__book-media">
            {/* Placeholder from the Figma file until the book photo is ready. */}
            <img src={bookImage} alt="" width="1024" height="1024" />
          </div>
          <div className="about__book-text">
            <p className="about__eyebrow">Pendamping buku cetak</p>
            <h2 id="about-book" className="about__book-title">
              Buku Direktori Studio Desain ADGI Surabaya
            </h2>
            <p className="about__book-body">
              Situs ini adalah versi digital dari buku direktori, tugas akhir Muhammad Nur Falzin
              (D4 Desain Grafis), yang didukung ADGI Surabaya Chapter melalui program Surabaya Design
              Census. Setiap studio di buku punya kode QR menuju profilnya di sini. Setelah buku
              dicetak, koreksi data dilakukan di situs ini.
            </p>
          </div>
        </div>
      </section>

      <div className="about__sections">
        <section className="about__inner about__section" aria-labelledby="about-criteria">
          <SectionHeading eyebrow="Bagian 01" id="about-criteria">
            Siapa yang dapat masuk direktori?
          </SectionHeading>
          <div className="about__criteria">
            <StepBox label="Kriteria A" watermark="A">
              Studio atau agensi yang berbasis di Surabaya.
            </StepBox>
            <StepBox label="Kriteria B" watermark="B">
              Aktif di minimal satu kategori yang tercantum.
            </StepBox>
            <StepBox label="Kriteria C" watermark="C">
              Punya website atau Instagram yang menampilkan karya 12 bulan terakhir.
            </StepBox>
          </div>
          <p className="about__note">
            Setiap data diverifikasi sebelum tampil: alamat dan titik peta, tautan yang aktif, serta
            kategori berdasarkan karya studio. Tanggal verifikasi terakhir tercantum di setiap profil.
            Kontak langsung (email, WhatsApp) hanya ditampilkan dengan persetujuan studio.
          </p>
        </section>

        <section className="about__inner about__section" aria-labelledby="about-codes">
          <SectionHeading eyebrow="Bagian 02" id="about-codes">
            Cara membaca kode
          </SectionHeading>
          <div className="about__codes">
            <CategoryBox size="lg" />
            <RegionBox />
          </div>
        </section>

        <section className="about__inner about__section" aria-labelledby="about-join">
          <SectionHeading eyebrow="Bagian 03" id="about-join">
            Ingin daftar atau koreksi?
          </SectionHeading>
          <p className="about__join-text">
            Studio bisa mendaftar, memperbarui data, atau meminta listing dihapus. Semua pengajuan
            ditinjau dulu sebelum tampil, dan permintaan koreksi atau penghapusan ditanggapi dalam 7
            hari.
          </p>
          <div className="about__actions">
            <Button as={Link} to="/daftar" size="xl" icon={ArrowUpRight}>
              Yuk daftarkan studio kamu
            </Button>
            <Button as={Link} to="/daftar?jenis=koreksi" variant="outlined" size="xl" icon={ArrowUpRight}>
              Ajukan koreksi
            </Button>
          </div>
        </section>
      </div>
    </article>
  )
}
