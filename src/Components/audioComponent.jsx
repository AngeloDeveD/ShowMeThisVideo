import { useNavigate } from "react-router-dom";

export default function AudioComponent() {

    const navigate = useNavigate();

    return (
        <>
            <h1>Контент в разработке</h1>
            <button className="chooseButton" onClick={() => navigate("/")}>Вернуться</button>
        </>
    );
}