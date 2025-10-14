import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useRef, useEffect, useState } from 'react';
import { setLanguage } from "../../store/splices/settingsSlice";

import './choosingComponent.scss';
const ChooseComponent = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { i18n, t } = useTranslation();
    const [lang, setLang] = useState(i18n.language);

    const changeLanguage = async () => {
        const nextLang = lang === 'ru' ? 'en' : 'ru';
        await i18n.changeLanguage(nextLang);   // дождаться фактической смены
        dispatch(setLanguage(nextLang));
        setLang(nextLang);                     // триггер перерендера
    };

    return (
        <>
            <h1>{t("SelectAnItem")}</h1>
            <div className="chooseContainer">
                <button className="chooseButton" onClick={() => navigate('/video')}>{t('AppUsmButton')}</button>
                <button className="chooseButton" onClick={() => navigate('/audio')}>{t('AppAwbAdxButton')}</button>
                <button className="chooseButton" onClick={() => changeLanguage()}>Язык/Language</button>
            </div>

        </>
    )
}

export default ChooseComponent