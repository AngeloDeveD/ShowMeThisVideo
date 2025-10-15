import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setOpenFolder } from "../../store/splices/settingsSlice";
import { useTranslation } from "react-i18next";

export default function OpenFolderComponent() {

    //const [merged, isMerged] = useState(false);
    const settings = useSelector((state) => state.settings);
    const dispatch = useDispatch();

    const { t } = useTranslation();

    const openFolder = settings.openFolder;

    const HandleOpenFolderSelector = (e) => {
        dispatch(setOpenFolder(e.target.checked));
    }

    useEffect(() => {
        console.log(`Открыть папку после завершения: ${openFolder}`);
    }, [openFolder]);

    return (
        <>
            <div className="">
                <input type="checkbox" id="openFolder" name="openFolder" checked={openFolder} onChange={HandleOpenFolderSelector} />
                <label htmlFor="openFolder">{t("OpenFolderAfterCompletion")}</label>
            </div>
        </>
    );
}