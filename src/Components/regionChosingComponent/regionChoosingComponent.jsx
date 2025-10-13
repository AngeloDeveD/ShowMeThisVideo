import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setRegion } from "../../store/splices/settingsSlice";

export default function RegionChoosingComponent() {

    const settings = useSelector((state) => state.settings);
    const dispatch = useDispatch();

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
                <form>
                    <label htmlFor="region-selector">Выбранный регион: </label>
                    <select
                        name="reg"
                        id="reg-select"
                        value={settings.region}
                        onChange={HandleRegionSelector}
                    >
                        <option value="JP">Япония</option>
                        <option value="CN">Китай</option>
                        <option value="EFIGS">Европа/США PS4</option>
                        <option value="Steam">Европа/США Steam</option>
                    </select>
                </form>
            </div>
        </>
    );
}