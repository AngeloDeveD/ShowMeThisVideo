import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Router } from 'react-router-dom';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Loading from './Components/loadingComponent'

const VideoConverterImport = lazy(() => import('./Components/videoImportComponent'));
const VideoConverterShow = lazy(() => import('./Components/videorShowComponent'));

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='app'>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path='/' element={<VideoConverterImport />} />
            <Route path="*" element={<div>Страница не найдена</div>} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App
