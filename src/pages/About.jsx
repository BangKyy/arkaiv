import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { usePageMeta } from '../lib/hooks'
import { useIntro } from '../lib/intro'
import { inView, rise, stagger, unveil } from '../lib/motion'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import { CategoryBox, RegionBox, StepBox } from '../components/LabeledBox'
import { ArrowUpRight } from '../components/icons'
import bookImage from '../assets/book-placeholder.png'

// FR-12: what the project is, how studios are chosen, how to be listed or corrected.
// Layout and copy follow the Figma "Tentang Direktori" screens (desktop, tablet, mobile).
// Inclusion rules mirror PRD section 11 (Proposed).
export default function About() {
  // The homepage, so it keeps the site's own title and description.
  usePageMeta(null)
  const heroRef = useRef(null)
  useIntro(heroRef)
  // The image unrolls by clip-path, which is not a transform, so reduced motion is
  // honored here rather than by MotionConfig.
  const reduceMotion = useReducedMotion()

  return (
    <article className="about">
      <header ref={heroRef} className="about__hero">
        <div className="about__inner">
          <p className="about__eyebrow" data-intro="eyebrow">
            Tentang direktori
          </p>
          <h1 className="about__title" data-intro="title">
            Arsip hidup studio desain di{' '}
            <span className="about__title-accent" data-intro="scramble">
              Surabaya.
            </span>
          </h1>
          <p className="about__lede" data-intro="rise">
            Direktori ini memetakan studio dan agensi kreatif di Surabaya berdasarkan lokasi dan
            spesialisasi, supaya mahasiswa desain dan komunitas kreatif bisa menemukan referensi
            profesional di kota sendiri.
          </p>
          <Button as={Link} to="/peta" size="xl" icon={ArrowUpRight} className="about__cta" data-intro="rise">
            Jelajahi peta virtual
          </Button>
        </div>
      </header>

      <section className="about__book" aria-labelledby="about-book">
        <motion.div className="about__inner about__book-inner" {...inView} variants={stagger(0.2)}>
          <motion.div className="about__book-media" variants={reduceMotion ? undefined : unveil}>
            {/* Placeholder from the Figma file until the book photo is ready. */}
            <img src={bookImage} alt="" width="1024" height="1024" />
          </motion.div>
          <motion.div className="about__book-text" variants={stagger(0.1)}>
            <motion.p className="about__eyebrow" variants={rise}>
              Pendamping buku cetak
            </motion.p>
            <motion.h2 id="about-book" className="about__book-title" variants={rise}>
              Buku Direktori Studio Desain ADGI Surabaya
            </motion.h2>
            <motion.p className="about__book-body" variants={rise}>
              Situs ini adalah versi digital dari buku direktori, tugas akhir Muhammad Nur Falzin
              (D4 Desain Grafis), yang didukung ADGI Surabaya Chapter melalui program Surabaya Design
              Census. Setiap studio di buku punya kode QR menuju profilnya di sini. Setelah buku
              dicetak, koreksi data dilakukan di situs ini.
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      <div className="about__sections">
        <section className="about__inner about__section" aria-labelledby="about-criteria">
          <SectionHeading eyebrow="Bagian 01" id="about-criteria">
            Siapa yang dapat masuk direktori?
          </SectionHeading>
          <motion.div className="about__criteria" {...inView} variants={stagger(0.12)}>
            <StepBox label="Kriteria A" watermark="A">
              Studio atau agensi yang berbasis di Surabaya.
            </StepBox>
            <StepBox label="Kriteria B" watermark="B">
              Aktif di minimal satu kategori yang tercantum.
            </StepBox>
            <StepBox label="Kriteria C" watermark="C">
              Punya website atau Instagram yang menampilkan karya 12 bulan terakhir.
            </StepBox>
          </motion.div>
          <motion.p className="about__note" {...inView} variants={rise}>
            Setiap data diverifikasi sebelum tampil: alamat dan titik peta, tautan yang aktif, serta
            kategori berdasarkan karya studio. Tanggal verifikasi terakhir tercantum di setiap profil.
            Kontak langsung (email, WhatsApp) hanya ditampilkan dengan persetujuan studio.
          </motion.p>
        </section>

        <section className="about__inner about__section" aria-labelledby="about-codes">
          <SectionHeading eyebrow="Bagian 02" id="about-codes">
            Cara membaca kode
          </SectionHeading>
          <motion.div className="about__codes" {...inView} variants={stagger(0.15)}>
            <CategoryBox size="lg" />
            <RegionBox />
          </motion.div>
        </section>

        <section className="about__inner about__section" aria-labelledby="about-join">
          <SectionHeading eyebrow="Bagian 03" id="about-join">
            Ingin daftar atau koreksi?
          </SectionHeading>
          <motion.p className="about__join-text" {...inView} variants={rise}>
            Studio bisa mendaftar, memperbarui data, atau meminta listing dihapus. Semua pengajuan
            ditinjau dulu sebelum tampil, dan permintaan koreksi atau penghapusan ditanggapi dalam 7
            hari.
          </motion.p>
          <motion.div className="about__actions" {...inView} variants={rise}>
            <Button as={Link} to="/daftar" size="xl" icon={ArrowUpRight}>
              Yuk daftarkan studio kamu
            </Button>
            <Button as={Link} to="/daftar?jenis=koreksi" variant="outlined" size="xl" icon={ArrowUpRight}>
              Ajukan koreksi
            </Button>
          </motion.div>
        </section>
      </div>
    </article>
  )
}
