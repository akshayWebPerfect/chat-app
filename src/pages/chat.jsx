import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";



function Chat() {
    const { user } = useAuth();
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactPhone, setContactPhone] = useState("");
    const [contactName, setContactName] = useState("");

    const [chatList, setChatList] = useState([]);
    
    const [selectedContact, setSelectedContact] = useState(null);

    const [unsubscribeChat, setUnsubscribeChat] = useState(null);

    const [currentChatId, setCurrentChatId] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    
    // get current users contacts 
    const [contacts, setContacts] = useState([]);

   
    const listenMessages = (chatId) => {

        const messagesRef = collection(
            db,
            "chats",
            chatId,
            "messages"
        );

        const q = query(
            messagesRef,
            orderBy("createdAt", "asc")
        );

        return onSnapshot(q, (snapshot) => {

            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setMessages(msgs);

        });
    };

    const openChat = async (contact) => {

        setSelectedContact(contact);

        const chatId =
            user.uid < contact.uid
                ? `${user.uid}_${contact.uid}`
                : `${contact.uid}_${user.uid}`;

        setCurrentChatId(chatId);

        if (unsubscribeChat) {
            unsubscribeChat();
        }

        const unsubscribe = listenMessages(chatId);

        setUnsubscribeChat(() => unsubscribe);
    };

    useEffect(() => {

        return () => {
            if (unsubscribeChat) {
                unsubscribeChat();
            }
        };

    }, [unsubscribeChat]);


    //     if (!message.trim()) return;

    //     if (!currentChatId) {
    //         alert("Select a contact");
    //         return;
    //     }

    //     console.log(currentChatId);
    //     console.log(message);
    // };
    const sendMessage = async () => {

        if (!message.trim()) return;

        if (!currentChatId) {
            alert("Select a contact");
            return;
        }

        try {

            const chatRef = doc(db, "chats", currentChatId);

            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {

                await setDoc(
                    chatRef,
                    {
                        participants: [
                            user.uid,
                            selectedContact.uid
                        ],
                        lastMessage: message,
                        lastMessageAt: Date.now()
                    },
                    { merge: true }
                );
            }

            await addDoc(
                collection(
                    db,
                    "chats",
                    currentChatId,
                    "messages"
                ),
                {
                    senderId: user.uid,
                    text: message,
                    createdAt: Date.now()
                }
            );

            await setDoc(
                chatRef,
                {
                    lastMessage: message,
                    lastMessageAt: Date.now()
                },
                { merge: true }
            );

            setMessage("");

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        console.log('test');
        if (user?.uid) {
            loadContacts();
        }
    }, [user?.uid]);

    const loadContacts = async () => {
        try {
            const contactsRef = collection(
                db,
                "users",
                user.uid,
                "contacts"
            );

            const snapshot = await getDocs(contactsRef);

            const contactsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setContacts(contactsList);

        } catch (error) {
            console.error(error);
        }
    };

    const addContact = async () => {
        try {

            // Step 1: Required fields validation

            if (!contactPhone.trim()) {
                alert("Phone number is required");
                return;
            }

            if (!contactName.trim()) {
                alert("Contact name is required");
                return;
            }

            // Step 2: Self check

            if (contactPhone === user.phoneNumber) {
                alert("You cannot add yourself");
                return;
            }

            // Step 3: Phone length validation

            if (contactPhone.length < 10) {
                alert("Invalid phone number");
                return;
            }

            // Step 4: Search Firestore

            const usersRef = collection(db, "users");

            const q = query(
                usersRef,
                where("phoneNumber", "==", contactPhone)
            );

            const querySnapshot = await getDocs(q);

            // Step 5: User not found

            if (querySnapshot.empty) {
                alert("User is not registered on this app");
                return;
            }

            // Step 6: Found user

            const foundUser = querySnapshot.docs[0];
            const foundUserData = foundUser.data();

            // Step 7: Check duplicate contact

            const contactRef = doc(
                db,
                "users",
                user.uid,
                "contacts",
                foundUserData.uid
            );

            const existing = await getDoc(contactRef);

            if (existing.exists()) {
                alert("Contact already added");
                return;
            }

            // Step 8: Save contact

            await setDoc(contactRef, {
                uid: foundUserData.uid,
                customName: contactName,
                phoneNumber: foundUserData.phoneNumber,
                createdAt: Date.now()
            });

            // Refresh contacts list
            await loadContacts();

            alert("Contact added");
            setShowAddContact(false);

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <h2>Chat App - {user.displayName}</h2>
            <div className="container mx-auto">
            <div className="min-w-full border rounded lg:grid lg:grid-cols-3">
                {/* Left bar  */}
                <div className="border-r border-gray-300 lg:col-span-1">
                    <div className="mx-3 my-3">
                        <div className="relative text-gray-600">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            viewBox="0 0 24 24" className="w-6 h-6 text-gray-300">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </span>
                        <input type="search" className="block w-full py-2 pl-10 bg-gray-100 rounded outline-none" name="search"
                            placeholder="Search" required />
                        </div>
                    </div>

                    <ul className="overflow-auto h-[32rem]">
                        
                        <div className="flex items-center justify-between px-2 my-2">
                            <h2 className="text-lg text-gray-600">Chats</h2>

                            <button
                                onClick={() => setShowAddContact(true)}
                                className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600"
                            >
                                +
                            </button>
                        </div>

                        {contacts.map((contact) => (
                            <li key={contact.id} onClick={() => openChat(contact)}>
                                <div className="flex items-center px-3 py-3 border-b border-gray-300">

                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        {contact.customName?.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="ml-3">
                                        <p className="font-semibold">
                                            {contact.customName}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {contact.phoneNumber}
                                        </p>
                                    </div>

                                </div>
                            </li>
                        ))}

                        {/* <li>
                            <a
                                className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
                                <img className="object-cover w-10 h-10 rounded-full"
                                src="https://cdn.pixabay.com/photo/2018/09/12/12/14/man-3672010__340.jpg" alt="username" />
                                <div className="w-full pb-2">
                                <div className="flex justify-between">
                                    <span className="block ml-2 font-semibold text-gray-600">Jhon Don</span>
                                    <span className="block ml-2 text-sm text-gray-600">25 minutes</span>
                                </div>
                                <span className="block ml-2 text-sm text-gray-600">bye</span>
                                </div>
                            </a>
                            <a
                                className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out bg-gray-100 border-b border-gray-300 cursor-pointer focus:outline-none">
                                <img className="object-cover w-10 h-10 rounded-full"
                                src="https://cdn.pixabay.com/photo/2016/06/15/15/25/loudspeaker-1459128__340.png" alt="username" />
                                <div className="w-full pb-2">
                                <div className="flex justify-between">
                                    <span className="block ml-2 font-semibold text-gray-600">Same</span>
                                    <span className="block ml-2 text-sm text-gray-600">50 minutes</span>
                                </div>
                                <span className="block ml-2 text-sm text-gray-600">Good night</span>
                                </div>
                            </a>
                            <a
                                className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
                                <img className="object-cover w-10 h-10 rounded-full"
                                src="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg" alt="username" />
                                <div className="w-full pb-2">
                                <div className="flex justify-between">
                                    <span className="block ml-2 font-semibold text-gray-600">Emma</span>
                                    <span className="block ml-2 text-sm text-gray-600">6 hour</span>
                                </div>
                                <span className="block ml-2 text-sm text-gray-600">Good Morning</span>
                                </div>
                            </a>
                        </li> */}
                    </ul>
                </div>
                {/* Right bar */}
                <div className="hidden lg:col-span-2 lg:block">
                    <div className="w-full">
                        <div className="relative flex items-center p-3 border-b border-gray-300">
                        <img className="object-cover w-10 h-10 rounded-full"
                            src="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg" alt="username" />
                        <span className="block ml-2 font-bold text-gray-600">{selectedContact?.customName || "Select a Contact"}</span>
                        <span className="absolute w-3 h-3 bg-green-600 rounded-full left-10 top-3">
                        </span>
                        </div>
                        <div className="relative w-full p-6 overflow-y-auto h-[40rem]">
                        <ul className="space-y-2">
                            {/* <li className="flex justify-start">
                            <div className="relative max-w-xl px-4 py-2 text-gray-700 rounded shadow">
                                <span className="block">Hi</span>
                            </div>
                            </li>
                            <li className="flex justify-end">
                            <div className="relative max-w-xl px-4 py-2 text-gray-700 bg-gray-100 rounded shadow">
                                <span className="block">Hiiii</span>
                            </div>
                            </li>
                            <li className="flex justify-end">
                            <div className="relative max-w-xl px-4 py-2 text-gray-700 bg-gray-100 rounded shadow">
                                <span className="block">how are you?</span>
                            </div>
                            </li>
                            <li className="flex justify-start">
                            <div className="relative max-w-xl px-4 py-2 text-gray-700 rounded shadow">
                                <span className="block">Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                </span>
                            </div>
                            </li> */}

                            {messages.map((msg) => (
                                <li
                                    key={msg.id}
                                    className={
                                        msg.senderId === user.uid
                                            ? "flex justify-end"
                                            : "flex justify-start"
                                    }
                                >
                                    <div
                                        className={
                                            msg.senderId === user.uid
                                                ? "relative max-w-xl px-4 py-2 text-gray-700 bg-gray-100 rounded shadow"
                                                : "relative max-w-xl px-4 py-2 text-gray-700 rounded shadow"
                                        }
                                    >
                                        <span className="block">
                                            {msg.text}
                                        </span>
                                    </div>
                                </li>

                            ))}
                        </ul>
                        </div>

                        <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
                        

                        <input 
                            type="text"
                            placeholder="Message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                        />
                        {/* <button>
                            
                        </button> */}
                        <button type="button" onClick={sendMessage}>
                            <svg className="w-5 h-5 text-gray-500 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20" fill="currentColor">
                            <path
                                d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>


            {showAddContact && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">

                        <h2 className="text-xl font-semibold mb-4">Add Contact</h2>

                        <div className="space-y-4">

                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />

                            <input
                                type="text"
                                placeholder="Custom Name"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />

                            <div className="flex justify-end gap-2">

                                <button
                                    onClick={() => setShowAddContact(false)}
                                    className="px-4 py-2 border rounded"
                                >Cancel</button>

                                <button
                                    onClick={addContact}
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                >Add Contact</button>

                            </div>
                        </div>
                    </div>
                </div>
            )}


        </>
    )
}


export default Chat
