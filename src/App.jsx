import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import './App.css'

import Loading from './Components/loadingComponent/loadingComponent';
import ChooseComponent from './Components/choosingComponent/choosingComponent';

const VideoConverterImport = lazy(() => import('./Components/VideoComponent/videoImportComponent'));
//const VideoConverterShow = lazy(() => import('./Components/videoShowComponent'));

const AudioComponent = lazy(() => import('./Components/audioComponent/audioComponent'));

const App = () => {

  const settings = useSelector((state) => state.settings);
  const lang = settings.language;

  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, []);

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