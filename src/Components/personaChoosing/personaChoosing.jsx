import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { setPersonaGame } from "../../store/splices/settingsSlice";

export default function PersonaChoosing() {

    const { t } = useTranslation();

    const settings = useSelector((state) => state.settings);
    const dispatch = useDispatch();

    const personaChoose = settings.personaChoose;

    const HandleRegionSelector = (e) => {
        dispatch(setPersonaGame(e.target.value));
        console.log(`Choosed: ${e.target.value}`);
    }

    useEffect(() => {
        console.log(`Total Game: ${personaChoose}`);
    }, []);

    return (
        <>
            <div className="">
                <form className="RegionForm">
                    <label htmlFor="region-selector">{`${t("GameChoosing")} `}</label>
                    <select
                        name="reg"
                        id="reg-select"
                        value={personaChoose}
                        onChange={HandleRegionSelector}
                        className="RegionForm__select"
                    >
                        <option value="P5R">Persona 5 Royal</option>
                        <option value="P5">Persona 5</option>
                        <option value="P4G">Persona 4 Golden</option>
                        <option value="P3R" disabled={true}>{"Persona 3 Reload (comming soon)"}</option>
                    </select>
                </form>
            </div>
        </>
    );
}