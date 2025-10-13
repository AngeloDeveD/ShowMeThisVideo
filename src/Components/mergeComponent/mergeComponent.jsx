import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMerged } from "../../store/splices/settingsSlice";

export default function MergeComponent() {

    //const [merged, isMerged] = useState(false);
    const settings = useSelector((state) => state.settings);
    const dispatch = useDispatch();

    const merged = settings.merged;

    const HandleMergedSelector = (e) => {
        dispatch(setMerged(e.target.checked));
    }

    useEffect(() => {
        console.log(`Объединить видео с аудио: ${merged}`);
    }, [merged]);

    return (
        <>
            <div className="">
                <input type="checkbox" id="merged" name="merged" checked={merged} onChange={HandleMergedSelector} />
                <label htmlFor="merged">Объединить видео с аудио</label>
            </div>
        </>
    );
}