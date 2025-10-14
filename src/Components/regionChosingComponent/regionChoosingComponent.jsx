import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRegion } from "../../store/splices/settingsSlice";
import { useTranslation } from "react-i18next";

export default function RegionChoosingComponent() {

    const settings = useSelector((state) => state.settings);
    const dispatch = useDispatch();

    const { t } = useTranslation();

    const region = settings.region;

    const HandleRegionSelector = (e) => {
        dispatch(setRegion(e.target.value));
    }

    useEffect(() => {
        console.log(`Выбранный регион: ${region}`);
    }, [region]);

    return (
        <>
            <div className="">
                <form className="RegionForm">
                    <label htmlFor="region-selector">{`${t("ChoosedRegion")}: `}</label>
                    <select
                        name="reg"
                        id="reg-select"
                        value={settings.region}
                        onChange={HandleRegionSelector}
                        className="RegionForm__select"
                    >
                        <option value="JP">{t("Japan")}</option>
                        <option value="CN">{t("China")}</option>
                        <option value="EFIGS">{`${t("EU/US")} PS4`}</option>
                        <option value="Steam">{`${t("EU/US")} Steam`}</option>
                    </select>
                </form>
            </div>
        </>
    );
}