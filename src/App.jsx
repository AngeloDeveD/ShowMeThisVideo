import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css'

import Loading from './Components/loadingComponent';
import ChooseComponent from './Components/choosingComponent';

const VideoConverterImport = lazy(() => import('./Components/videoImportComponent'));
const VideoConverterShow = lazy(() => import('./Components/videoShowComponent'));

const AudioComponent = lazy(() => import('./Components/audioComponent'));

const App = () => {
  return (
    <>
      <div className='app'>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path='/' element={<ChooseComponent />} />
            <Route path='/video' element={<VideoConverterImport />} />
            <Route path='/audio' element={<AudioComponent />} />
            <Route path="*" element={<Navigate to={'/'} replace={true} />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}

export default App