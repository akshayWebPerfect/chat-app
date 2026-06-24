import { useAuth } from '../context/AuthContext';
import React, { useRef, useState, useEffect } from 'react';
import {
  collection, //get main table/collection name
  query, // for Building the Search Filter
  where, // for Building the Search Filter
  getDocs, // get all documents or data of a collection
  getDoc, // get a specific document or data of a collection
  doc, // use for create docs
  setDoc,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";


function ChatBox() {
    const { user } = useAuth();
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactName, setContactName] = useState("");    
    const [contactPhone, setContactPhone] = useState("");
    const [myContacts, setMyContacts] = useState([]);
    const [selectChat, setSelectedChat] = useState(null);
    const [selectChatRoom, setSelectedChatRoom] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState(null);
    const [participantNames, setParticipantNames] = useState({});
    const [allUsers, setAllUsers] = useState(null);
    const [unknownuser, setUnknownuser] = useState(true);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    };

    useEffect(() => {
        if (selectChat) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    }, [selectChat]);

    useEffect(() => {
        const container = messagesContainerRef.current;

        const handleScroll = () => {
            const bottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 50;

            setIsAtBottom(bottom);

            if (bottom) {
                setShowNewMessageBtn(false);
            }
        };

        container?.addEventListener("scroll", handleScroll);

        return () => {
            container?.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        if (!messages.length) return;

        if (isAtBottom) {
            scrollToBottom();
        } else {
            setShowNewMessageBtn(true);
        }
    }, [messages]);

    const openChat = async (contact_list) => {
        setSelectedChat(contact_list);
        const chatRoomId = generateChatRoomId(user.uid, contact_list.uid);
        setSelectedChatRoom(chatRoomId);

        const existsInContacts = myContacts.some(contact => contact.uid === contact_list.uid);
        setUnknownuser(existsInContacts);

    }

    // generate chatroom ID
    const generateChatRoomId = (uid1, uid2) => {
        return [uid1, uid2].sort().join("_");
    };


    // Create converstaion 
    const createConversation = async(e) => {
        e.preventDefault();

        if (!messageInput.trim() || !selectChat) return;
        // if (!selectChat) {
        //     alert('Please select a contact first to start a chat.');
        //     return;
        // }
        try{

            // 1. Generate the unique, sorted Room ID
            const chatRoomId = generateChatRoomId(user.uid, selectChat.uid);
            // console.log('chatRoomId', chatRoomId);

            // 2. Get the main conversation document
            const conversationRef = doc(db, "conversations", chatRoomId);

            // 3. get the messages subcollection inside that specific room
            const messagesSubCollectionRef = collection(db, "conversations", chatRoomId, "messages");

            // 4. Create or update the main conversation room metadata
            await setDoc(conversationRef, {
                participants: [user.uid, selectChat.uid],
                lastMessage: messageInput,
                lastMessageTimestamp: serverTimestamp(), // Firebase server-side timestamp
                // Optional: Tracking who sent the last message
                lastSenderId: user.uid
            }, { merge: true }); // Crucial! Keeps the participants array safe on future updates

            // 5. Add the actual chat message with an auto-generated ID
            await addDoc(messagesSubCollectionRef, {
                senderId: user.uid,
                receiverId: selectChat.uid,
                text: messageInput,
                timestamp: serverTimestamp()
            });

            console.log("Message sent successfully!");
            setMessageInput('');
        } catch(error){
            console.log("error", error);
        }

    }


    // Reset add contact form 
    const cancelAddContact = () =>{
        setContactName('');
        setContactPhone('');
        setShowAddContact(false);
    }
    
    const loadConversations = async () => {
    
        try {
            // Get the conversations colelctiosn 
            const conversationsCollection = collection(db, "conversations");

            // Get all conversations where have current user id in participants columns
            const q = query(
                conversationsCollection,
                where("participants", "array-contains", user.uid)
            );

            const getNewConversationlistener = onSnapshot(q, (snapshot) => {
                const fetchedConvo = snapshot.docs.map(messageDocFolder => ({
                    id: messageDocFolder.id,
                    ...messageDocFolder.data()
                }));

                console.log("Real-time conversations updated:", fetchedConvo);
                setConversations(fetchedConvo); 
                // loadConversations();

            }, (error) => {
                console.log("Error stream listening to conversations:", error);
            });

            return () => {
                console.log("conversations Changed: Cleaning up old conversations listener...");
                getNewConversationlistener();
            };

            // Run the query and get the data folder
            // const docsFolder = await getDocs(q);

            // // Structerd the data in javascript object and with sort from old to new
            // const conversations = docsFolder.docs.map(doc => ({ 
            //     id: doc.id, 
            //     ...doc.data() 
            // })).sort((a, b) =>
            //     b.lastMessageTimestamp?.toMillis() -
            //     a.lastMessageTimestamp?.toMillis()
            // );
            
            // // if conversations empty  
            // if (!conversations) {
            //     console.log("No conversations found for this user");
            //     setConversations(null); // Reset state to an empty list
            //     return;
            // }

            // // if conversations not empty  
            // setConversations(conversations); 

        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    useEffect(() => {
        console.log('check')
        loadConversations();
    }, [selectChat, user?.uid]);


    // Get all the conversations
    // useEffect(() => {
    //     const conversationsRef = collection(db, "conversations");
    //     // setConversations

    //     // 2. Query rooms where the user is a participant, sorted by newest message first
    //     const q = query(
    //         conversationsRef,
    //         where("participants", "array-contains", user.uid),
    //         orderBy("lastMessageTimestamp", "desc")
    //     );

    //     const querySnapshot = getDocs(q);

    //     // If user empty or not found
    //     if (querySnapshot.empty) {
    //         console.log("conversations is empty");
    //         return;
    //     }
    //     console.log("conversations not empty");

    //     const mapedData = querySnapshot.docs.map(docsFolderasdoc => ({
    //         id: docsFolderasdoc.id,
    //         ...docsFolderasdoc.data()
    //     }));

    //     console.log("conversations data", mapedData);

    //     // // if user Found
    //     // const foundUser = querySnapshot.docs[0]; // get the very firt records 
    //     // const foundUserData = foundUser.data(); 

    // })

    // Real-time listener for current chat messages
    useEffect(() => {
        // check user is authenticated or selected chat is not empty 
        if(!selectChat?.uid){
            setMessages([]);
            return;
        }

        // generate the chatRoomID based on the selected chat fro getting converstation 
        const chatRoomId = generateChatRoomId(user.uid, selectChat.uid);
        console.log("Listening to room:", chatRoomId);

        // Get the Target message collection 
        const messageSubColl = collection(db, "conversations", chatRoomId, "messages");

        //change the message order oldest -> newest
        const q = query(messageSubColl, orderBy("timestamp", "asc"));

        const getNewMessageslistener = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(messageDocFolder => ({
                id: messageDocFolder.id,
                ...messageDocFolder.data()
            }));

            console.log("Real-time messages updated:", fetchedMessages);
            setMessages(fetchedMessages); // Update state to trigger automatic UI re-render


        }, (error) => {
            console.log("Error stream listening to messages:", error);
        });

        return () => {
            console.log("Chat Changed: Cleaning up old message listener...");
            getNewMessageslistener();
        };

    }, [selectChat, user?.uid]);


    // add new contact form 
    const addContact = async () => {

        // 1. empty field validations 
        if (!contactName.trim()) {
            alert("Name is required");
            return;
        }

        if (!contactPhone.trim()) {
            alert("Phone number is required");
            return;
        }

        // 2. check user not itself
        if (contactPhone === user.phoneNumber) {
            alert("You cannot add yourself");
            return;
        }

        // 3. check user registered or not on this app
        // process collection -> query -> getdocs -> check usersdata 

        // Get the colection first which target
        const getColection = collection(db, "users");

        // Building the Search Filter using (query and where)
        const q = query(
            getColection,
            where("phoneNumber", "==", contactPhone)
        );

        // run the query and get docs data
        const querySnapshot = await getDocs(q);

        // If user empty or not found
        if (querySnapshot.empty) {
            alert("User is not registered on this app");
            return;
        }

        // if user Found
        const foundUser = querySnapshot.docs[0]; // get the very firt records 
        const foundUserData = foundUser.data();  // convert binary file into a clean JavaScript object       

        // next Check duplicate contact in list

        // db->collection->docsid->subcollection->docsid
        const contactSubCollection = doc(
            db,
            "users",
            user.uid,
            "contacts",
            foundUserData.uid
        );

        // get contactSubCollection's docs data 
        const existing = await getDoc(contactSubCollection);
        
        // check contact exists or not 
        if (existing.exists()) {
            alert("Contact already added");
            return;
        }
        
        // create if not exists contact
        await setDoc(contactSubCollection, {
            uid: foundUserData.uid,
            customName: contactName,
            phoneNumber: foundUserData.phoneNumber,
            createdAt: Date.now()
        }); 

        alert("Contact added");
        cancelAddContact();
        loadContacts();


    }

    useEffect(() => {
        console.log('loadContacts function ready to run');
        loadContacts();
    }, []);

    // get all users 
    const getAllUsers = async() =>{
        const usersRef = collection(db, "users");
        const usersDocRef = await getDocs(usersRef);
        const usersMapedData = usersDocRef.docs.map(docsFolderasdoc => ({
            id: docsFolderasdoc.id,
            ...docsFolderasdoc.data()
        }));

        setAllUsers(usersMapedData);
        console.log({usersMapedData});

        // const userdataSnapshot = onSnapshot(usersRef, (snapshot) => {
        //     const usersMappedData = snapshot.docs.map(docFolder => ({
        //         id: docFolder.id,
        //         ...docFolder.data()
        //     }));
            
        //     setAllUsers(usersMappedData);
        //     console.log("Users database auto-updated:", usersMappedData);
        // }, (error) => {
        //     console.error("Real-time sync error:", error);
        // });

        // setAllUsers(usersMapedData);
        // console.log({usersMapedData});

        //  return () => userdataSnapshot();
    }

    useEffect(() => {
        getAllUsers();
    }, []);

    const loadContacts = async () => {        
        // Get the contacts subcellection path
        const contactsDubcollection = collection(db, "users", user.uid, "contacts");

        // get all docs of this contacts collection
        const docsFolder = await getDocs(contactsDubcollection);
        
        const mapedData = docsFolder.docs.map(docsFolderasdoc => ({
            id: docsFolderasdoc.id,
            ...docsFolderasdoc.data()
        }));

        // console.log(mapedData);
        setMyContacts(mapedData);
    }


    useEffect(() => {
        const loadNames = async () => {
            const newNames = {};

            for (const chat of conversations) {
            const name = await getParticipantName(chat);
                newNames[chat.id] = name;
            }

            setParticipantNames(newNames);
        };

        if (conversations) loadNames();
    }, [conversations]);

    const getParticipantName = async(conversation) => {

        let name;
        const participants = conversation?.participants;
        const otherUser = participants.find(id => id !== user?.uid);
        const snap = await getDoc(doc(db, "users", otherUser));

        if (snap.exists()) {
            name = snap.data().displayName;
        }

        return name;
    };


    // const getPersonName = (chat) => {
    //     console.log({chat});
    //     return "hello";
    // }
    // useEffect(() => {
    //     getPersonName(chat);
    // }, []);

    return (
        <>
            <h2>Chat Box- { user.displayName}  {user.phoneNumber}</h2>
            <div className="container mx-auto">
            <div className="min-w-full border rounded lg:grid lg:grid-cols-4">
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
                        </div>

                        { 
                            conversations?.map((chat, index) => {
                                const friendUid = chat?.participants?.find(id => id !== user?.uid);  // Find the friend's UID (the one that is NOT yours)
                                const matchingContact = myContacts.find(contact => contact.id === friendUid); // Cross-reference with your loaded 'myContacts' state array
                                const displayName = matchingContact ? matchingContact?.customName : "Unknown User";

                                const userData = allUsers.find(users => users.id == friendUid);
                                const photoURL = userData?.photoURL;

                                // update the reciverid if unknown user 
                                // const unknownData = allUsers.find(users => users.id == friendUid);
                                const unknown = matchingContact ? matchingContact : userData;

                                return(
                                    <li
                                        className={`${friendUid === selectChat?.uid ? 'bg-gray-100 focus:outline-none' : ''} flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none`}
                                        key={chat.id}
                                        onClick={() => openChat(unknown)}
                                    >
                                        {
                                            photoURL ?
                                                <img className="object-cover w-10 h-10 border border-1 border-gray-400 rounded-full" src={photoURL} alt="username" />
                                            :
                                                <div className="w-10 h-10 border border-1 border-gray-400 rounded-full bg-gray-300 flex items-center justify-center">
                                                    {displayName?.charAt(0).toUpperCase()}
                                                </div>
                                        }

                                        <div className="ml-3 text-left">
                                            <p className="font-semibold">
                                                {displayName}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {chat?.lastMessage}
                                            </p>
                                        </div>
                                        

                                        
                                        
                                    </li>
                                );
                            })
                        }
                        
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
                        </li>  */}
                    </ul>
                </div>



                {/* center bar */}
                <div className="lg:col-span-2 lg:block">
                    <div className="w-full">
                        <div className="relative flex items-center p-3 border-b border-gray-300">
                            <img className="object-cover w-10 h-10 rounded-full"
                                src="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg" alt="username" />
                            <span className="block ml-2 font-bold text-gray-600">{selectChat?.customName || "Select a Contact"}</span>
                            <span className="absolute w-3 h-3 bg-green-600 rounded-full left-10 top-3">
                            </span>
                        </div>
                            
                        {/* <div 
                            className="relative w-full p-6 overflow-y-auto h-[40rem]"
                        > */}
                        {selectChat ? (
                            <div 
                                ref={messagesContainerRef}
                                className="relative w-full p-6 overflow-y-auto h-[40rem] messages-container space-y-2"
                            >
                                {unknownuser ? "" : "Unknown"}
                                {messages.map((msg) => {

                                    // Determine if you sent the message or received it
                                    const isMe = msg.senderId === user.uid;

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs px-4 py-2 rounded-lg shadow text-sm ${
                                                isMe 
                                                    ? 'bg-blue-500 text-white rounded-br-none' 
                                                    : 'bg-white text-gray-800 rounded-bl-none'
                                            }`}>
                                                <p>{msg.text}</p>
                                                
                                                {/* Check if Firebase server timestamp has completed loading */}
                                                <span className={`block text-[10px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                </span>
                                            </div>
                                        </div>
                                    );

                                    {showNewMessageBtn && (
                                        <button
                                            onClick={() => {
                                                scrollToBottom();
                                                setShowNewMessageBtn(false);
                                            }}
                                            className="fixed bottom-24 right-10 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
                                        >
                                            New Messages ↓
                                        </button>
                                    )}

                                })}

                                <div ref={messagesEndRef} />

                            </div>
                        ) : (
                            <div className="relative w-full p-6 overflow-y-auto h-[40rem] messages-container space-y-2">
                                <span>Select a contact from the sidebar to start chatting!</span>
                            </div>
                        )}
                        {/* </div> */}
                        <form onSubmit={createConversation}>
                            <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
                                <input 
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Message"
                                    className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                                />
                                {/* <button>
                                    
                                </button> */}
                                <button 
                                    type="submit"
                                    // onClick={createConversation}
                                >
                                    <svg className="w-5 h-5 text-gray-500 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                {/* Right bar */}
                <div className="border-l border-gray-300 lg:col-span-1">
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
                        
                        <div className="flex items-center justify-between px-2 mt-2 pb-5 border-b border-gray-300">
                            <h2 className="text-lg text-gray-600">My Conatcts</h2>

                            <button
                                onClick={() => setShowAddContact(true)}
                                className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600"
                            >
                                +
                            </button>
                        </div>
                        
                        {myContacts.map((contact_list) => {

                            const userData = allUsers.find(users => users.id == contact_list.id);
                            const photoURL = userData?.photoURL;

                            return(
                                
                                <li key={contact_list.id}
                                    onClick={() => openChat(contact_list)}
                                    className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none"
                                >
                                    {/* <div className=""> */}
                                        {
                                            photoURL ?
                                                <img className="object-cover w-10 h-10 border border-1 border-gray-400 rounded-full" src={photoURL} alt="username" />
                                            :
                                                <div className="w-10 h-10 rounded-full border border-1 border-gray-400 bg-gray-300 flex items-center justify-center">
                                                    {contact_list.customName?.charAt(0).toUpperCase()}
                                                </div>
                                        }

                                        <div className="ml-3 text-left">
                                            <p className="font-semibold">
                                                {contact_list.customName}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                {contact_list.phoneNumber}
                                            </p>
                                        </div>

                                    {/* </div> */}

                                    {/* <img className="object-cover w-10 h-10 rounded-full"
                                    src="https://cdn.pixabay.com/photo/2018/09/12/12/14/man-3672010__340.jpg" alt="username" />
                                    <div className="w-full">
                                        <div className="flex flex-col text-left">
                                            <span className="block ml-2 font-semibold text-gray-600">{contact_list.customName}</span>
                                            <span className="block ml-2 text-xs text-gray-600">{contact_list.phoneNumber}</span>
                                        </div>
                                    </div> */}
                                </li>
                            )
                        })}
                        
                    </ul>
                </div>
            </div>
            </div>


            {showAddContact && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">

                        <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>

                        <div className="space-y-4">

                            <input
                                type="text"
                                placeholder="Custom Name"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />

                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />

                            <div className="flex justify-end gap-2">

                                <button
                                    onClick={cancelAddContact}
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


export default ChatBox
