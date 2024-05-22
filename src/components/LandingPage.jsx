import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, updateDoc, getDoc, doc, setDoc, addDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faCartShopping} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/LandingPage.css';

const LandingPage = ({ auth }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [nameValue, setNameValue] = useState('');
    const [dateValue, setDateValue] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [action, setAction] = useState('add');
    const [categoryValue, setCategoryValue] = useState('');

    useEffect(() => {
        // Obtener la cantidad de dinero del usuario de la base de datos al cargar la página
        const fetchUserBalance = async () => {
            try {
                const user = auth.currentUser;
                if (user) { // Verificar que currentUser no sea null
                    const db = getFirestore();
                    const userDocRef = doc(db, 'users', user.uid); // Acceder a uid solo si user no es null
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUserBalance(userDocSnap.data().balance || 0);
                    } else {
                        console.log('No se encontró el documento del usuario');
                    }
                } else {
                    console.log('Usuario no autenticado');
                }
            } catch (error) {
                console.error('Error al obtener la cantidad de dinero del usuario:', error);
            }
        };
    
        if (isLoggedIn) {
            fetchUserBalance();
        }
    }, [isLoggedIn, auth.currentUser]);

    useEffect(() => {
        // Obtener las transacciones del usuario de la base de datos en tiempo real
        const fetchTransactions = async () => {
            try {
                const user = auth.currentUser;
                if (user) { // Verificar que currentUser no sea null
                    const db = getFirestore();
                    const transactionsRef = collection(db, 'transactions');
                    const querySnapshot = await getDocs(query(transactionsRef, where('userId', '==', user.uid)));
                    const transactionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTransactions(transactionsData);
                } else {
                    console.log('Usuario no autenticado');
                }
            } catch (error) {
                console.error('Error al obtener las transacciones del usuario:', error);
            }
        };
    
        if (isLoggedIn) {
            fetchTransactions();
        }
    
        // Establecer el listener en tiempo real para las transacciones
        const user = auth.currentUser;
        if (user) { // Verificar que currentUser no sea null
            const db = getFirestore();
            const transactionsRef = collection(db, 'transactions');
            const querySnapshot = query(transactionsRef, where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(querySnapshot, (snapshot) => {
                const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTransactions(transactionsData);
            });
    
            return () => {
                // Detener el listener cuando el componente se desmonta
                unsubscribe();
            };
        }
    }, [isLoggedIn, auth.currentUser]);

    const handleGoogleLogin = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(() => {
                console.log('Usuario autentificado');
                setIsLoggedIn(true);
            })
            .catch((error) => {
                console.error('Error durante el inicio de sesión con Google:', error);
            });
    };

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                console.log('Usuario desconectado');
                setIsLoggedIn(false);
            })
            .catch((error) => {
                console.error('Error durante el cierre de sesión:', error);
            });
    };

    const openModal = (actionType) => {
        setIsModalOpen(true);
        setAction(actionType);
    };   

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (event) => {
        const value = event.target.value;
        if (/^\d*\.?\d*$/.test(value)){
            setInputValue(value);
        }
    };

    const handleNameChange = (event) => {
        const value = event.target.value.toUpperCase();
        setNameValue(value);
    };

    const handleDateChange = (event) => {
        const value = event.target.value;
        setDateValue(value);
    };

    const handleCategoryChange = (event) => {
        const value = event.target.value;
        setCategoryValue(value);
    };

    const fetchUserBalance = async () => {
        try {
            const user = auth.currentUser;
            if (user) { // Verificar que currentUser no sea null
                const db = getFirestore();
                const userDocRef = doc(db, 'users', user.uid); // Acceder a uid solo si user no es null
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserBalance(userDocSnap.data().balance || 0);
                } else {
                    console.log('No se encontró el documento del usuario');
                }
            } else {
                console.log('Usuario no autenticado');
            }
        } catch (error) {
            console.error('Error al obtener la cantidad de dinero del usuario:', error);
        }
    };
    
    useEffect(() => {
        if (isLoggedIn) {
            fetchUserBalance();
        }
    }, [isLoggedIn, auth.currentUser]);
    
    const addBalance = async () => {
        try {
            // Verifica que todos los campos estén completos
            if (!nameValue || !dateValue || !inputValue || !categoryValue) {
                toast.error('Please fill in all fields.');
                return;
            }
    
            const db = getFirestore();
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                await updateDoc(userDocRef, {
                    balance: userBalance + parseFloat(inputValue),
                });
            } else {
                // Si el documento no existe, crear uno nuevo
                await setDoc(userDocRef, {
                    balance: parseFloat(inputValue),
                });
            }
            
            // Agregar la transacción
            const transactionsCollectionRef = collection(db, 'transactions');
            await addDoc(transactionsCollectionRef, {
                userId: auth.currentUser.uid,
                name: nameValue,
                date: dateValue,
                category: categoryValue,
                amount: parseFloat(inputValue),
            });
    
            // Después de agregar el saldo, actualiza automáticamente el balance del usuario
            fetchUserBalance();
    
            // Mostrar notificación de éxito
            toast.success('Balance added successfully!');
            
            // Restablecer los valores de los inputs
            setNameValue('');
            setDateValue('');
            setInputValue('');
            setCategoryValue('');
    
            closeModal(); // Cerrar el modal después de actualizar la cantidad de dinero
        } catch (error) {
            console.error('Error al agregar balance:', error);
            // Mostrar notificación de error
            toast.error('An error occurred while adding balance.');
        }
    };  
    
    const subtractBalance = async () => {
        try {
            // Verifica que todos los campos estén completos
            if (!nameValue || !dateValue || !inputValue || !categoryValue) {
                toast.error('Please fill in all fields.');
                return;
            }
    
            const db = getFirestore();
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
    
            if (userDocSnap.exists()) {
                await updateDoc(userDocRef, {
                    balance: userBalance - parseFloat(inputValue), // Restar en lugar de sumar
                });
            } else {
                // Si el documento no existe, crear uno nuevo
                await setDoc(userDocRef, {
                    balance: -parseFloat(inputValue), // Restar en lugar de sumar
                });
            }
    
            // Agregar la transacción
            const transactionsCollectionRef = collection(db, 'transactions');
            await addDoc(transactionsCollectionRef, {
                userId: auth.currentUser.uid,
                name: nameValue,
                date: dateValue,
                category: categoryValue,
                amount: -parseFloat(inputValue), // Restar en lugar de sumar
            });
    
            // Después de restar el saldo, actualiza automáticamente el balance del usuario
            fetchUserBalance();
    
            // Mostrar notificación de éxito
            toast.success('Balance subtracted successfully!');
    
            // Restablecer los valores de los inputs
            setNameValue('');
            setDateValue('');
            setInputValue('');
            setCategoryValue('');
    
            closeModal(); // Cerrar el modal después de actualizar la cantidad de dinero
        } catch (error) {
            console.error('Error al restar balance:', error);
            // Mostrar notificación de error
            toast.error('An error occurred while subtracting balance.');
        }
    };    

    return (
        <>
            {isLoggedIn ? (
                <>
                    <button className='return-button' onClick={handleLogout}>Log out</button>
                    <div className='glass-container'>
                        <div className='Balance'>
                            <h1>Squirrel Expense Tracker</h1>
                            <h2>Total Balance</h2>
                            <h1 className='Money'>${userBalance.toFixed(2)}</h1>
                        </div>
                        <div>
                            <h2>Transactions</h2>
                            {transactions.map(transaction => (
                                <div className={`card ${transaction.amount >= 0 ? 'add-transaction' : 'subtract-transaction'}`} key={transaction.id}>
                                    <div className="cardglow"></div>
                                    <div className='cardbody'>
                                        <p>{transaction.name}</p>
                                        <p style={{marginTop:'-0.5rem'}}>{transaction.date}</p>
                                        <p style={{fontSize:'1.8rem', marginTop:'-1rem'}}>{transaction.category}</p>
                                        <p className={`${transaction.amount >= 0 ? 'pos' : 'neg'}`}>${transaction.amount.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className='open-modal-add' onClick={() => openModal('add')}><FontAwesomeIcon className='Bill' icon={faMoneyBill}/></button>
                    <button className='open-modal-spend' onClick={() => openModal('subtract')}><FontAwesomeIcon className='Bill' icon={faCartShopping}/></button>
                    {isModalOpen && (
                        <div className='modal'>
                            <div className='modal-content'>
                                <span className='close-modal' onClick={closeModal}>&times;</span>
                                <h2>Enter Details</h2>
                                <div>
                                    <label htmlFor="name">Concept:</label>
                                    <input
                                        type='text'
                                        id='name'
                                        value={nameValue}
                                        onChange={handleNameChange}
                                        placeholder='Enter concept'
                                        required
                                        autoComplete='off'
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date">Date:</label>
                                    <input
                                        type='date'
                                        id='date'
                                        value={dateValue}
                                        onChange={handleDateChange}
                                        placeholder='Enter a date'
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="amount">Amount:</label>
                                    <input
                                        type='text'
                                        id='amount'
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        placeholder='Enter balance'
                                        required
                                        autoComplete='off'
                                    />
                                </div>
                                <div>
                                    <label htmlFor="category">Category:</label>
                                    <br/>
                                    <br/>
                                    <select
                                        id='category'
                                        value={categoryValue}
                                        onChange={handleCategoryChange}
                                        required
                                    >
                                        <option value='' disabled>Select a category</option>
                                        <option value='🍱'>Food</option>
                                        <option value='🕺'>Entertainment</option>
                                        <option value='👚'>Clothes</option>
                                        <option value='🐶'>Pet</option>
                                        <option value='👨‍⚕️'>Health</option>
                                        <option value='🚕'>Transport</option>
                                        <option value='🧑‍🏫'>Education</option>
                                        <option value='🛫'>Trips</option>
                                        <option value='💰'>Savings</option>
                                        <option value='💸'>Others</option>
                                    </select>
                                </div>
                                <button className={action === 'add' ? 'add-button' : 'subtract-button'} onClick={action === 'add' ? addBalance : subtractBalance} disabled={!inputValue || !categoryValue}>{action === 'add' ? 'Add Balance' : 'Subtract Balance'}</button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className='Title'>
                    <h1>Squirrel Expense Tracker</h1>
                    <button onClick={handleGoogleLogin}>
                        Login with
                        <span>
                        <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262" width="30">
                            <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                            <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                            <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                            <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                        </svg>
                        </span>
                    </button>
                </div>
            )}
        </>
    );
};

export default LandingPage;
