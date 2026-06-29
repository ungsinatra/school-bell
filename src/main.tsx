import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import MainPage from './render/components/pages/main/main.tsx'
import ReferencePage from './render/components/pages/reference/reference.tsx'
import SettingsPage from './render/components/pages/settings/settings.tsx'
import StreamsPage from './render/components/pages/streams/streams.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} children={[
          <Route path="/" element={<MainPage />} />,
          <Route path="/streams/:id" element={<StreamsPage />} />,
          <Route path="/reference" element={<ReferencePage />} />,
          <Route path="/settings" element={<SettingsPage />} />,
        ]} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
