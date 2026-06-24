import { useAuth } from '../context/AuthContext';
import { useState, React, useEffect } from 'react';
import { app, db } from '../firebase'
import { useNavigate } from "react-router-dom";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const auth = getAuth();
// const appVerifier = window.recaptchaVerifier;

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(true);
  const testVerificationCode = "741852";



  const logout = (e) => {
    signOut(auth);
  }
  const sendotp = async (e) => {
      e.preventDefault();

      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });

      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);

      window.confirmationResult = confirmationResult; 
      setSent(false);
    };

  const verifyotp = async () => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid); //go to db -> collection -> under collection userid folder
      const userDocSnap = await getDoc(userDocRef); //get the data of that folder

      if (userDocSnap.exists()) {
        navigate("/chatbox");
      } else {
        navigate("/setup-profile");
      }
      
      // if (firebaseUser.displayName === ""){
      //   navigate("/setup-profile")
      // } else {
      //   navigate("/chat");
      // }
      
    } catch (error) {
      console.log("verify error", error);
    }
  };

  return (
    <>
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Login</h2>
        <form className="flex flex-col">

        {sent ?
          <>
          <input 
            type="text" 
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter Phone Number"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" />
          <button 
            onClick={sendotp}
            type="button"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">Login</button>
          <div id="recaptcha-container" />
          </>
         : 
          <>
          <input 
            type="number" 
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter Phone OTP"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" />
          <button 
            onClick={verifyotp}
            type="button"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">Verify OTP</button>
        </>
        
      }
        </form> 
      
      {user ?
        <button 
            onClick={logout}
            type="button"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">
              Log Out
        </button>
        :
        <h1>need to login</h1>
      }
       

      </div>
    </div>
    </>
  )
}


export default Login
