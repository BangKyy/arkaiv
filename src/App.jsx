import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useMatch } from 'react-router'
import { MotionConfig } from 'motion/react'
import DirectoryProvider from './state/DirectoryProvider'
import GlobalHeader from './components/GlobalHeader'
import GlobalFooter from './components/GlobalFooter'
import LoadingBar from './components/LoadingBar'
import Explore from './pages/Explore'
import StudioListPanel from './pages/StudioListPanel'
import StudioProfile from './pages/StudioProfile'
import About from './pages/About'
import Submit from './pages/Submit'
import NotFound from './pages/NotFound'
import { useDirectory } from './state/directory'
import { Loading } from './lib/progress'
import t from './i18n/id'

// Admins only, so visitors never download it.
const Admin = lazy(() => import('./pages/Admin'))

/**
 * Information architecture (PRD section 8): four destinations; the homepage introduces
 * the directory (Figma "Home Page").
 *   /                Home ("Beranda"): the About page
 *   /peta            Explore: map + list + filters + summary card
 *   /studio/:slug    Studio profile, a page of its own (stable URL, QR target)
 *   /daftar          Submit, correct or remove a studio (?koreksi=<slug>, ?hapus=<slug>)
 *   /admin           Review queue for those submissions (admins only, not linked)
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<About />} />
        <Route path="peta" element={<Explore />}>
          <Route index element={<StudioListPanel />} />
        </Route>
        <Route path="studio/:slug" element={<StudioProfile />} />
        {/* About lived at /tentang before it became the homepage. */}
        <Route path="tentang" element={<Navigate to="/" replace />} />
        <Route path="daftar" element={<Submit />} />
        <Route
          path="admin"
          element={
            <Suspense fallback={<Loading />}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function Shell() {
  const isExplore = Boolean(useMatch('/peta'))

  return (
    <MotionConfig reducedMotion="user">
      <DirectoryProvider>
        <div className="app">
          <LoadingBar />
          <a className="skip-link" href="#main">
            Lewati ke konten
          </a>
          {isExplore ? <ExploreHeader /> : <GlobalHeader />}
          <main id="main" className={isExplore ? 'main main--explore' : 'main main--page'}>
            <Outlet />
            {!isExplore && <GlobalFooter />}
          </main>
        </div>
      </DirectoryProvider>
    </MotionConfig>
  )
}

/** The map page's header carries the studio search (Figma SearchBar=True). */
function ExploreHeader() {
  const { filters, setQuery } = useDirectory()
  return (
    <GlobalHeader
      search={{
        value: filters.query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: t.search.placeholder,
        'aria-label': t.search.label,
      }}
    />
  )
}
