import { useState } from 'react'
import { LoginForm } from '../Connect'
import './Home.css'
import Logon from '../Logon'
import bgImg from '../../assets/homeBackground.jpeg'

const Home = ({ onLogin }) => {

    const [logonClicked, setLogonClicked] = useState(false)

    const handleLogon = () => {
        setLogonClicked(true)
    }

    const handleLogin = () => {
        setLogonClicked(false);
    }

    return (
        <div className="home-container" style={ {
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
            } } >
            <h1 className="home-title">Yield Management</h1>
            {logonClicked ? (
                <div className="home-intro">
                <button className="home-button" onClick={handleLogin}>
                    Login
                </button>
                <Logon />
                </div>
            ) : (
                <div className="home-intro">
                    <button className="home-button" onClick={handleLogon}>
                        Logon
                    </button>
                    <LoginForm onLogin={onLogin} />
                </div>
            )
            }
        </div>
    )
}

export default Home