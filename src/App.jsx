import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Cargando from './components/Cargando';
import ParticlesComponent from './components/Particles';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import { initializeApp } from 'firebase/app';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [userAuthenticated, setUserAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const firebaseConfig = {
        apiKey: "AIzaSyDDQNx-24tgy1l9X6CTdFxLMjli01oenGU",
        authDomain: "squirrelexpensetracker.firebaseapp.com",
        projectId: "squirrelexpensetracker",
        storageBucket: "squirrelexpensetracker.appspot.com",
        messagingSenderId: "579144999097",
        appId: "1:579144999097:web:bea03bd5895182b97b3b68"
    };

    // Inicializa Firebase
    const app = initializeApp(firebaseConfig);

    // Obtiene el objeto de autenticación
    const auth = getAuth(app);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserAuthenticated(true);
            } else {
                setUserAuthenticated(false);
            }
        });

        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    return (
        <Router>
            {isLoading ? (
                <Cargando url="https://raw.githubusercontent.com/Damanger/Portfolio/main/public/Ardilla.webp" />
            ) : (
                <>
                    <ToastContainer />
                    <ParticlesComponent />
                    <Routes>
                        <Route path="/" element={<LandingPage auth={auth} />} />
                    </Routes>
                </>
            )}
        </Router>
    );
}

export default App;
