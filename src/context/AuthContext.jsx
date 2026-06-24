// AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { app } from '../firebase'
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const auth = getAuth();
// 1. Create the context box
const AuthContext = createContext(null);

// 2. Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        console.log('user loggedin', user);
      } else {
        setUser(null);
        console.log('user logged out', user);
      }

      setLoading(false);

    });
  }, [])

  // const login = (userData) => {
  //   setUser(userData); // Sets the logged-in user data
  // };

  const logout = async() => {
    await signOut(auth);
  };

  return (
    // 3. Expose the state and actions via the value prop
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Create a custom hook for cleaner consumption - two method two export
//via arrow function
// export const useAuth = () => useContext(AuthContext);

// via regular normal function
export function useAuth() {
  return useContext(AuthContext);
}