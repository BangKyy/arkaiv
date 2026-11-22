import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes, useMatch } from 'react-router'
import { MotionConfig } from 'motion/react'
import DirectoryProvider from './state/DirectoryProvider'
import GlobalHeader from './components/GlobalHeader'
import GlobalFooter from './components/GlobalFooter'
import Explore from './pages/Explore'
import StudioListPanel from './pages/StudioListPanel'
import StudioProfile from './pages/StudioProfile'
import About from './pages/About'
import Submit from './pages/Submit'
import NotFound from './pages/NotFound'
import { isSample } from './lib/studios'
import t from './i18n/id'

// Admins only, so visitors never download it.
const Admin = lazy(() => import('./pages/Admin'))

/**
 * Information architecture (PRD section 8): four destinations, map first.
 *   /                Explore: map + list + filters + summary card
 *   /studio/:slug    Studio profile, in the Explore layout (stable URL, QR target)
 *   /tentang         About
 *   /daftar          Submit, correct or remove a studio (?koreksi=<slug>, ?hapus=<slug>)
 *   /admin           Review queue for those submissions (admins only, not linked)
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route element={<Explore />}>
          <Route index element={<StudioListPanel />} />
          <Route path="studio/:slug" element={<StudioProfile />} />
        </Route>
        <Route path="tentang" element={<About />} />
        <Route path="daftar" element={<Submit />} />
        <Route
          path="admin"
          element={
            <Suspense fallback={null}>
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
  const homeMatch = useMatch('/')
  const profileMatch = useMatch('/studio/:slug')
  const isExplore = Boolean(homeMatch || profileMatch)

  return (
    <MotionConfig reducedMotion="user">
      <DirectoryProvider>
        <div className="app">
          <a className="skip-link" href="#main">
            Lewati ke konten
          </a>
          <GlobalHeader menuDock={isExplore ? 'bar' : 'bottom'} />
          {isSample && <p className="sample-banner">{t.sampleBanner}</p>}
          <main id="main" className={isExplore ? 'main main--explore' : 'main main--page'}>
            <Outlet />
            {!isExplore && <GlobalFooter />}
          </main>
        </div>
      </DirectoryProvider>
    </MotionConfig>
  )
}
