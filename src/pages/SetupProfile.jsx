import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../firebase";

const storage = getStorage();

export default function SetupProfile() {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");

    const [imageFile, setImageFile] = useState(null);
    const [photoURL, setPhotoURL] = useState("");
    const [uploading, setUploading] = useState(false);

    // Pass your logged-in user object and the image file here
    // async function saveUserImage(userResponse, imageFile) {
    //     const userId = userResponse.uid; // Extracts "vogKYOxrNRNbAUWIuO2g8LJF9Rq2"

    //     try {
    //         // 1. Point to storage location: users/vogKYOxrNRNbAUWIuO2g8LJF9Rq2/avatar.jpg
    //         const storageRef = ref(storage, `users/${userId}/avatar.jpg`);

    //         // 2. Upload file binary
    //         const snapshot = await uploadBytes(storageRef, imageFile);
            
    //         // 3. Extract access URL
    //         const imageURL = await getDownloadURL(snapshot.ref);

    //         // 4. Save into Firestore profile mapping to matching UID
    //         const userDocRef = doc(db, "users", userId);
    //         await setDoc(userDocRef, {
    //         displayName: userResponse.displayName,
    //         phoneNumber: userResponse.phoneNumber,
    //         photoURL: imageURL,
    //         updatedAt: new Date()
    //         }, { merge: true }); // Merge preserves other existing fields

    //         return imageURL;
    //     } catch (error) {
    //         console.error("Storage upload chain failed:", error);
    //     }
    // }
    
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.uid) return;

            try {
                const docRef = doc(db, "users", user.uid); //go to db -> collection -> under collection userid folder
                const docSnap = await getDoc(docRef); //get that folder documents

                if (docSnap.exists()) {
                    const data = docSnap.data(); // get that documents data if above contitions true

                    setDisplayName(data.displayName || "");
                    setEmail(data.email || "");
                    setPhotoURL(data.photoURL || "");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            }
        };

        loadProfile();
    }, [user]);

    // Handle client-side image selection and local preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPhotoURL(URL.createObjectURL(file)); // Show temporary local preview
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            alert("Display Name is required");
            return;
        }

        setUploading(true); // Disable button while uploading

        try {
            
            let finalPhotoURL = photoURL; // Fallback to current image URL if no new file is chosen

            // If a new image file was selected, convert it to Base64 text
            if (imageFile) {
                finalPhotoURL = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(imageFile); // Converts file to base64 string
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                });
            }
            // i know the user id so just add if not have , just update if have , for this use setDoc to add/update
            await setDoc( // first delete all data and then set the provided
                doc(db, "users", user.uid), //define docs with db anme - collections name - colection userid
                {                           // STE THE data here what i want to add/update
                    uid: user.uid,
                    phoneNumber: user.phoneNumber,
                    displayName,
                    email,
                    photoURL: finalPhotoURL, 
                },
                { merge: true } // update only sending data and not wipe out rest data of this collections without this just just the sending data and delete rest
            );

            await updateProfile(user, {displayName: displayName});
             
            alert("Profile saved successfully");
            setImageFile(null);
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false); // Enable submit button again
        }
    };

    return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
            Complete Your Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* NEW: Profile Image Upload UI Circle */}
            <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-2">
                    <img 
                        src={photoURL || "https://placehold.co/600x400"} 
                        alt="Profile preview" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                    />
                </div>
                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors border border-blue-200">
                    Choose Image
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                    />
                </label>
            </div>

            <div className="text-left">
                <label className="block mb-2 font-medium">
                Display Name
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                />
            </div>

            <div className="text-left">
                <label className="block mb-2 font-medium">
                    Email (Optional)
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
                />
            </div>

            <div className="text-left">
                <label className="block mb-2 font-medium">
                    Phone Number
                </label>

                <input
                    type="text"
                    value={user?.phoneNumber || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                />
            </div>

            <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
                {uploading ? "Saving Profile..." : "Save Profile"}
            </button>
        </form>
        </div>
    </div>
    );
}