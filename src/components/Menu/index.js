import './Menu.css'
import { useNavigate } from "react-router-dom"

const Menu = () => {

    const navigate = useNavigate()

    return (
        <div className='stocks-container-header'>
                <h2 onClick={() => navigate('/')}>
                    Stocks
                </h2>
                <h2 onClick={() => navigate('/dividends')}>
                    Dividends
                </h2>
        </div>
    )
}

export default Menu