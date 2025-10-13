import { Link, useNavigate } from "react-router-dom"

const ChooseComponent = () => {

    const navigate = useNavigate();

    return (
        <>
            <h1>Выберите пункт</h1>
            <button className="chooseButton" onClick={() => navigate('/video')}>.USM видео</button>
            <button className="chooseButton" onClick={() => navigate('/audio')}>.AWB/ADX аудио</button>
        </>
    )
}

export default ChooseComponent