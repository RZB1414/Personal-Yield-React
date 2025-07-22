import { getAllDividends } from "../../services/dividends"
import { getStocksList, stockData } from "../../services/stocks"
import './Connect.css';
import { getCurrentUser, loginUser } from '../../services/login'
import { useState } from 'react';

let filteredDividends = [];
let dividends = [];
let stocks = [];
let updated = [];
let decryptedDividends = [];
let password = '';

const fetchDividendsStocks = async () => {
    const userId = sessionStorage.getItem('userId')
    stocks = [];
    updated = [];
    dividends = [];
    filteredDividends = [];
    decryptedDividends = [];
    try {
        stocks = await getStocksList(userId);
        
        updated = await Promise.all(
            stocks.map(async (stock) => {             
                const stockDataResult = await stockData(stock.symbol)             
                
                return {
                    ...stock,
                    currentPrice: stockDataResult["stock info: "]?.currentPrice ?? 0,
                    dayPriceChangePercent: stockDataResult["stock info: "]?.dayPriceChangePercent ?? 0
                };
            })
        )
        
        const passwordKey = password
        const allDividends = await getAllDividends(userId, passwordKey)
        if (allDividends && allDividends.unfilteredDividends) {

            const includedDividends = [
                "NOTA",
                "RENDIMENTO RENDA FIXA",
                "CARTAO DE CREDITO",
                "CASHBACK CARTAO",
            ];


            filteredDividends = allDividends.unfilteredDividends.filter(
                dividend => includedDividends.includes(dividend.ticker)
            )

            dividends = allDividends
        }
        else {
            console.warn('No dividends available');
            filteredDividends = []
            dividends = []
        }
    } catch (error) {
        console.error('Error fetching Data:', error);
    }
}

const LoginForm = ({ onLogin }) => {
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setMessage("Preencha todos os campos.");
            return;
        }
        try {
            // Hash da senha antes de enviar
            const hashedPassword = await hashPassword(form.password);
            const loginData = {
                email: form.email,
                password: hashedPassword
            };
            const response = await loginUser(loginData);
            const userData = await getCurrentUser();
            password = form.password; // Armazenar a senha em uma variável global
            sessionStorage.setItem('userId', userData.id);
            console.log(sessionStorage);
            

            setMessage("Login realizado com sucesso!");

            if (onLogin) onLogin(response);

            setForm({ email: "", password: "" });
        } catch (error) {
            setMessage("Erro ao fazer login. Verifique suas credenciais.");
        }
    };

    return (
        <form className="formLog" onSubmit={handleSubmit}>
            <h2>Login</h2>
            <input
                className="inputLog"
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
            />
            <input
                className="inputLog"
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
            />
            <button className="submitButton" type="submit">Entrar</button>
            {message && <p>{message}</p>}
        </form>
    );
};

export { fetchDividendsStocks, LoginForm, filteredDividends, dividends, stocks, updated, decryptedDividends }