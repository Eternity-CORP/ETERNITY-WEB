'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/button';
import cn from '@/utils/cn';
import { PlusCircleOutlined, PaperClipOutlined, TeamOutlined, ArrowLeftOutlined, CloseOutlined, DeleteOutlined, EditOutlined, CheckOutlined, PictureOutlined } from '@ant-design/icons';
import blockies from 'ethereum-blockies';
import { initOrbitDB, getMessages, addMessage, editMessage as editMessageInOrbit, deleteMessage as deleteMessageFromOrbit, getChatId, addUser, getUsers, updateUnreadCount, getUnreadCounts, addGroup, getGroups, updateGroup, removeMemberFromGroup, saveUserContacts, getUserContacts } from '@/services/chatService';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app

type Contact = {
  id: string;
  address: string;
  name: string;
  unreadCount: number;
};

type Group = {
  id: string;
  name: string;
  members: string[];
  unreadCount: number;
  creator: string;
};

type Message = {
  hash: string;
  payload: {
    value: {
      from: string;
      to: string;
      text: string;
      timestamp: number;
    }
  }
};

const ImageViewer = ({ images, currentIndex, onClose, onNext, onPrev }: { 
  images: string[]; 
  currentIndex: 
  number; 
  onClose: () => void; 
  onNext: () => void; 
  onPrev: () => void }
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        onNext();
      } else if (event.key === 'ArrowLeft') {
        onPrev();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onPrev, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl">&times;</button>
      <button onClick={onPrev} className="absolute left-4 text-white text-4xl">&lt;</button>
      <img src={images[currentIndex]} alt="Full size" className="max-h-[90vh] max-w-[90vw] object-contain" />
      <button onClick={onNext} className="absolute right-4 text-white text-4xl">&gt;</button>
    </div>
  );
};

const ChatPage = () => {
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<{ [chatId: string]: any[] }>({});
  const [inputMessage, setInputMessage] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [currentUserAddress, setCurrentUserAddress] = useState('');
  const { address } = useAccount();
  const [avatars, setAvatars] = useState<{ [key: string]: string }>({});
  const [showInput, setShowInput] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [resizing, setResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const groupMembersRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedMessageText, setEditedMessageText] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editedContactName, setEditedContactName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  useEffect(() => {
    const initDB = async () => {
      await initOrbitDB();
      console.log('OrbitDB initialized');
      if (address) {
        await loadUserContacts(address);
      }
      const unreadCounts = await getUnreadCounts(address);
      setUnreadCounts(unreadCounts);
      const groups = await getGroups();
      setGroups(groups);
    };
    initDB();
    if (address) {
      setCurrentUserAddress(address);
    } else {
      // Очистка данных, если кошелек не подключен
      setContactList([]);
      setSelectedContact(null);
      setMessages({});
      setGroups([]);
      setSelectedGroup(null);
    }
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [address]);

  const loadUserContacts = async (userAddress: string) => {
    try {
      const userContacts = await getUserContacts(userAddress);
      const users = await getUsers();
      const contacts = userContacts.map((contactAddress: string) => ({
        id: contactAddress,
        address: contactAddress,
        name: users[contactAddress]?.name || '',
        unreadCount: 0
      }));
      setContactList(contacts);
      console.log('User contacts loaded:', contacts);
    } catch (error) {
      console.error('Failed to load user contacts:', error);
    }
  };

  const addNewContact = async () => {
    if (newContactAddress) {
      try {
        await addUser(newContactAddress, newContactName);
        const newContact = {
          id: newContactAddress,
          address: newContactAddress,
          name: newContactName,
          unreadCount: 0
        };
        setContactList(prevList => [...prevList, newContact]);
        await saveUserContacts(currentUserAddress, [...contactList.map(c => c.address), newContactAddress]);
        setNewContactAddress('');
        setNewContactName('');
        setShowInput(false);
      } catch (error) {
        console.error('Failed to add new contact:', error);
      }
    }
  };

  useEffect(() => {
    if (selectedContact || selectedGroup) {
      fetchMessages();
    }
  }, [selectedContact, selectedGroup]);

  useEffect(() => {
    const newAvatars: { [key: string]: string } = {};
    contactList.forEach(contact => {
      const canvas = blockies.create({ seed: contact.address });
      newAvatars[contact.address] = canvas.toDataURL();
    });
    groups.forEach(group => {
      group.members.forEach(member => {
        if (!newAvatars[member]) {
          const canvas = blockies.create({ seed: member });
          newAvatars[member] = canvas.toDataURL();
        }
      });
    });
    setAvatars(newAvatars);
  }, [contactList, groups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupMembersRef.current && !groupMembersRef.current.contains(event.target as Node)) {
        setShowGroupMembers(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleGroupMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGroupMembers(!showGroupMembers);
  };

  const fetchMessages = async () => {
    if (selectedContact || selectedGroup) {
      const chatId = getChatId(currentUserAddress, selectedContact?.address || `group_${selectedGroup!.id}`);
      try {
        const fetchedMessages = await getMessages(chatId);
        console.log('Fetched messages:', JSON.stringify(fetchedMessages, null, 2));
        setMessages(prevMessages => {
          const updatedMessages = {
            ...prevMessages,
            [chatId]: fetchedMessages.map((msg: any) => ({
              ...msg,
              payload: {
                value: {
                  ...msg.payload.value,
                  from: msg.payload.value.from,
                  text: msg.payload.value.text || '',
                  timestamp: msg.payload.value.timestamp || Date.now()
                }
              }
            }))
          };
          console.log('Updated messages state:', JSON.stringify(updatedMessages, null, 2));
          return updatedMessages;
        });
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 10) {
      alert('You can only upload up to 10 images at once');
      return;
    }
    setSelectedFiles(prevFiles => [...prevFiles, ...imageFiles].slice(0, 10));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (inputMessage.trim() || selectedFiles.length > 0) {
      const chatId = getChatId(currentUserAddress, selectedContact?.address || `group_${selectedGroup!.id}`);
      let imageUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file, index) => {
          formData.append('files', file);
        });
        try {
          const uploadResponse = await fetch('http://localhost:3001/api/upload-multiple', {
            method: 'POST',
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error('Upload failed');
          }
          const uploadResult = await uploadResponse.json();
          imageUrls = uploadResult.urls;
        } catch (error) {
          console.error('Failed to upload images:', error);
          alert('Failed to upload images. Please try again.');
          return;
        }
      }

      const newMessage = {
        from: currentUserAddress,
        to: selectedContact?.address || `group_${selectedGroup!.id}`,
        text: inputMessage.trim(),
        timestamp: Date.now(),
        imageUrls: imageUrls,
      };

      try {
        console.log('Sending message:', JSON.stringify(newMessage, null, 2));
        const messageHash = await addMessage(chatId, newMessage);
        console.log('Message sent, hash:', messageHash);
        setMessages(prevMessages => {
          const updatedMessages = {
            ...prevMessages,
            [chatId]: [...(prevMessages[chatId] || []), { hash: messageHash, payload: { value: newMessage } }]
          };
          console.log('Updated messages after sending:', JSON.stringify(updatedMessages[chatId], null, 2));
          return updatedMessages;
        });
        setInputMessage('');
        setSelectedFiles([]);

        // Обновляем список контактов после отправки сообщения
        const updatedContacts = await getUserContacts(currentUserAddress);
        const users = await getUsers();
        const newContactList = updatedContacts.map(address => ({
          id: address,
          address,
          name: users[address]?.name || '',
          unreadCount: 0
        }));
        setContactList(newContactList);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const updateUnreadCount = (chatId: string, recipient: string) => {
    const recipientData = JSON.parse(localStorage.getItem(`chatData_${recipient}`) || '{}');
    const updatedUnreadCounts = { ...recipientData.unreadCounts, [chatId]: (recipientData.unreadCounts?.[chatId] || 0) + 1 };
    localStorage.setItem(`chatData_${recipient}`, JSON.stringify({
      ...recipientData,
      unreadCounts: updatedUnreadCounts
    }));
  };

  const addChatForRecipient = (recipientAddress: string) => {
    const recipientData = JSON.parse(localStorage.getItem(`chatData_${recipientAddress}`) || '{}');
    const updatedContactList = recipientData.contactList || [];
    if (!updatedContactList.some((contact: Contact) => contact.address === currentUserAddress)) {
      updatedContactList.push({
        id: Date.now().toString(),
        address: currentUserAddress,
        name: '',
        unreadCount: 0
      });
    }
    localStorage.setItem(`chatData_${recipientAddress}`, JSON.stringify({
      ...recipientData,
      contactList: updatedContactList
    }));
  };

  const markAsRead = (chatId: string) => {
    setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
    const dataToSave = {
      messages,
      contactList,
      groups,
      unreadCounts
    };
    localStorage.setItem(`chatData_${currentUserAddress}`, JSON.stringify(dataToSave));
  };

  useEffect(() => {
    if (selectedContact) {
      const chatId = getChatId(currentUserAddress, selectedContact.address);
      markAsRead(chatId);
    } else if (selectedGroup) {
      const chatId = `group_${selectedGroup.id}`;
      markAsRead(chatId);
    }
  }, [selectedContact, selectedGroup]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      setResizing(true);
      setStartX(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizing) {
      const newWidth = sidebarWidth + (e.clientX - startX);
      setSidebarWidth(Math.max(300, Math.min(700, newWidth)));
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setResizing(false);
  };

  const formatAddress = (address: string) => {
    const minWidth = 300;
    const maxWidth = 700;
    const totalChars = 12;
    const visibleChars = Math.max(
      6,
      Math.floor(((sidebarWidth - minWidth) / (maxWidth - minWidth)) * (address.length - totalChars)) + 12
    );

    if (visibleChars >= address.length) {
      return address;
    }

    const start = address.slice(0, visibleChars / 2);
    const end = address.slice(address.length - visibleChars / 2);

    return `${start}...${end}`;
  };

  const addGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        members: [currentUserAddress],
        unreadCount: 0,
        creator: currentUserAddress
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowGroupInput(false);
    }
  };

  const addMemberToGroup = (groupId: string, memberAddress: string) => {
    setGroups(prevGroups => prevGroups.map(group => 
      group.id === groupId
        ? { ...group, members: Array.from(new Set([...group.members, memberAddress])) }
        : group
    ));
  };

  const removeMemberFromGroup = (groupId: string, memberAddress: string) => {
    setGroups(prevGroups => prevGroups.map(group => 
      group.id === groupId
        ? { ...group, members: group.members.filter(member => member !== memberAddress) }
        : group
    ));

    // Удаляем группу из данных удаленного пользователя
    const memberData = JSON.parse(localStorage.getItem(`chatData_${memberAddress}`) || '{}');
    if (memberData.groups) {
      memberData.groups = memberData.groups.filter((g: Group) => g.id !== groupId);
    }
    if (memberData.messages) {
      delete memberData.messages[`group_${groupId}`];
    }
    if (memberData.unreadCounts) {
      delete memberData.unreadCounts[`group_${groupId}`];
    }
    localStorage.setItem(`chatData_${memberAddress}`, JSON.stringify(memberData));

    // Обновляем данные текущего пльзователя
    const dataToSave = {
      messages,
      contactList,
      groups,
      unreadCounts
    };
    localStorage.setItem(`chatData_${currentUserAddress}`, JSON.stringify(dataToSave));
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'dd.MM.yyyy');
  };

  const getLastMessagePreview = (chatId: string) => {
    const chatMessages = messages[chatId];
    if (chatMessages && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.payload && lastMessage.payload.value) {
        const { text } = lastMessage.payload.value;
        
        if (typeof text === 'string' && text.trim() !== '') {
          return text.length > 20 ? text.substring(0, 20) + '...' : text;
        }
      }
    }
    return ''; // Возвращаем пусту строку, если нет сообщений или текст последнего сообщения пуст
  };

  const handleEditMessage = (msg: any) => {
    console.log('Editing message:', msg);
    setEditingMessage(msg);
    setEditedMessageText(msg.payload.value.text);
    setInputMessage(msg.payload.value.text);
  };

  const handleSaveEdit = async () => {
    if (editingMessage && inputMessage.trim()) {
      const chatId = getChatId(currentUserAddress, editingMessage.payload.value.to);
      try {
        console.log('Saving edited message:', inputMessage.trim());
        await editMessageInOrbit(chatId, editingMessage.hash, inputMessage.trim());
        console.log('Message edited successfully');
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages[chatId].map((msg) =>
            msg.hash === editingMessage.hash
              ? { ...msg, payload: { ...msg.payload, value: { ...msg.payload.value, text: inputMessage.trim() } } }
              : msg
          );
          return {
            ...prevMessages,
            [chatId]: updatedMessages
          };
        });
        setEditingMessage(null);
        setEditedMessageText('');
        setInputMessage('');
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const handleDeleteMessage = async (chatId: string, messageHash: string) => {
    try {
      console.log('Deleting message:', { chatId, messageHash });
      const result = await deleteMessageFromOrbit(chatId, messageHash);
      console.log('Delete result:', result);
      if (result.success) {
        setMessages((prevMessages) => {
          const updatedMessages = {
            ...prevMessages,
            [chatId]: prevMessages[chatId].filter((msg) => msg.hash !== messageHash)
          };
          return updatedMessages;
        });
      } else {
        console.error('Failed to delete message:', result.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const deleteContact = (contactId: string) => {
    setContactList(prevList => prevList.filter(contact => contact.id !== contactId));
    if (selectedContact?.id === contactId) {
      setSelectedContact(null);
    }
    const dataToSave = {
      messages,
      contactList: contactList.filter(contact => contact.id !== contactId),
      groups,
      unreadCounts
    };
    localStorage.setItem(`chatData_${currentUserAddress}`, JSON.stringify(dataToSave));
  };

  const startEditingContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditedContactName(contact.name);
  };

  const saveEditedContact = () => {
    if (editingContact) {
      setContactList(prevList => prevList.map(contact =>
        contact.id === editingContact.id
          ? { ...contact, name: editedContactName }
          : contact
      ));
      setEditingContact(null);
      setEditedContactName('');
      const dataToSave = {
        messages,
        contactList: contactList.map(contact =>
          contact.id === editingContact.id
            ? { ...contact, name: editedContactName }
            : contact
        ),
        groups,
        unreadCounts
      };
      localStorage.setItem(`chatData_${currentUserAddress}`, JSON.stringify(dataToSave));
    }
  };

  const openImageViewer = useCallback((images: string[], index: number) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setViewerOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentImages.length);
  }, [currentImages]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + currentImages.length) % currentImages.length);
  }, [currentImages]);

  return (
    <div className="h-screen overflow-hidden flex" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {isMobile ? (
        selectedContact ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
              <button onClick={() => setSelectedContact(null)} className="mr-4">
                <ArrowLeftOutlined />
              </button>
              <h2 className="text-lg font-semibold">
                Chat with {selectedContact.address}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="mb-4">
                {messages[getChatId(currentUserAddress, selectedContact.address)]?.map((msg, index) => (
                  <div key={index} className={cn(
                    "p-3 rounded-lg max-w-[40%]",
                    msg.payload.value.from === currentUserAddress
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  )}>
                    <p className="break-words">
                      {msg.payload.value.text || 'No text'}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      msg.payload.value.from === currentUserAddress
                        ? "text-blue-200"
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {formatMessageTime(msg.payload.value.timestamp)}
                    </p>
                    <p className="text-xs mt-1">
                      From: {msg.payload.value.from === currentUserAddress ? 'Me' : 'Other'}
                    </p>
                    {msg.payload.value.from === currentUserAddress && (
                      <div className="flex space-x-2 mt-2">
                        <button onClick={() => handleEditMessage(msg)} className="text-yellow-500 hover:text-yellow-700">
                          <EditOutlined />
                        </button>
                        <button onClick={() => handleDeleteMessage(getChatId(currentUserAddress, selectedContact.address), msg.hash)} className="text-red-500 hover:text-red-700">
                          <DeleteOutlined />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center">
              <PaperClipOutlined className="mr-2" />
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button className="ml-2" onClick={editingMessage ? handleSaveEdit : sendMessage}>
                {editingMessage ? 'Save Edit' : 'Send'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full border-r border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">Contacts</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setShowInput(!showInput)}>
                  <PlusCircleOutlined />
                </button>
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setShowGroupInput(!showGroupInput)}>
                  <TeamOutlined />
                </button>
              </div>
            </div>
            {showInput && (
              <div className="p-4">
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter wallet address..."
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter nickname..."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <Button onClick={addNewContact} className="w-full">
                  Add Contact
                </Button>
              </div>
            )}
            {showGroupInput && (
              <div className="p-4">
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button onClick={addGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            )}
            <ul className="flex-1 overflow-y-auto p-4">
              {contactList.map((contact) => (
                <li
                  key={contact.id}
                  className={cn(
                    'flex flex-col p-2 mb-2 rounded cursor-pointer relative',
                    selectedContact && selectedContact.id === contact.id
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                  onClick={() => setSelectedContact(contact)}
                  title={contact.address}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center overflow-hidden">
                      {avatars[contact.address] && (
                        <Image
                          src={avatars[contact.address]}
                          alt={`${contact.address}'s avatar`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessagePreview(getChatId(currentUserAddress, contact.address))}
                      </div>
                    </div>
                    {unreadCounts[getChatId(currentUserAddress, contact.address)] > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {unreadCounts[getChatId(currentUserAddress, contact.address)]}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={cn(
                    'flex flex-col p-2 mb-2 rounded cursor-pointer relative',
                    selectedGroup && selectedGroup.id === group.id
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedContact(null);
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
                      <TeamOutlined style={{ fontSize: '1.5rem' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{group.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessagePreview(`group_${group.id}`)}
                      </div>
                    </div>
                    {unreadCounts[`group_${group.id}`] > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {unreadCounts[`group_${group.id}`]}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <>
          <div
            className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800"
            style={{ width: sidebarWidth }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">Contacts & Groups</h2>
              <div className="flex items-center space-x-2">
                <button
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowInput(!showInput)}
                >
                  <PlusCircleOutlined />
                </button>
                <button
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowGroupInput(!showGroupInput)}
                >
                  <TeamOutlined />
                </button>
              </div>
            </div>
            {showInput && (
              <div className="p-4">
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter wallet address..."
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter nickname..."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <Button onClick={addNewContact} className="w-full">
                  Add Contact
                </Button>
              </div>
            )}
            {showGroupInput && (
              <div className="p-4">
                <input
                  type="text"
                  className="w-full p-2 mb-2 border border-gray-200 dark:border-gray-800 rounded"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button onClick={addGroup} className="w-full">
                  Create Group
                </Button>
              </div>
            )}
            <ul className="flex-1 overflow-y-auto p-4">
              {contactList.map((contact) => (
                <li
                  key={contact.id}
                  className={cn(
                    'flex flex-col p-2 mb-2 rounded cursor-pointer relative',
                    selectedContact && selectedContact.id === contact.id
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                  onClick={() => {
                    setSelectedContact(contact);
                    setSelectedGroup(null);
                  }}
                  title={contact.address}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center overflow-hidden">
                      {avatars[contact.address] && (
                        <Image
                          src={avatars[contact.address]}
                          alt={`${contact.address}'s avatar`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessagePreview(getChatId(currentUserAddress, contact.address))}
                      </div>
                    </div>
                    {unreadCounts[getChatId(currentUserAddress, contact.address)] > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {unreadCounts[getChatId(currentUserAddress, contact.address)]}
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={cn(
                    'flex flex-col p-2 mb-2 rounded cursor-pointer relative',
                    selectedGroup && selectedGroup.id === group.id
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedContact(null);
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
                      <TeamOutlined style={{ fontSize: '1.5rem' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{group.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessagePreview(`group_${group.id}`)}
                      </div>
                    </div>
                    {unreadCounts[`group_${group.id}`] > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {unreadCounts[`group_${group.id}`]}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="w-1 bg-gray-200 cursor-col-resize"
            onMouseDown={handleMouseDown}
            style={{ userSelect: resizing ? 'none' : 'initial' }}
          ></div>

          <div className="flex-1 flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4 cursor-pointer" onClick={toggleGroupMembers}>
                {selectedGroup ? `Group: ${selectedGroup.name}` : selectedContact ? `Chat with ${formatAddress(selectedContact.address)}` : 'Select a contact or group'}
              </h2>
              
              {showGroupMembers && selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div 
                    ref={groupMembersRef}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Group Members: {selectedGroup.name}</h3>
                      <button onClick={() => setShowGroupMembers(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <CloseOutlined style={{ fontSize: '1.5rem' }} />
                      </button>
                    </div>
                    <ul className="list-none p-0 space-y-4">
                      {selectedGroup.members.map((member) => (
                        <li key={member} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full mr-4 bg-gray-300 flex items-center justify-center overflow-hidden">
                              {avatars[member] && (
                                <Image
                                  src={avatars[member]}
                                  alt={`${member}'s avatar`}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              )}
                            </div>
                            <span className="text-lg">{formatAddress(member)}</span>
                          </div>
                          {selectedGroup.creator === currentUserAddress && member !== currentUserAddress && (
                            <button
                              onClick={() => removeMemberFromGroup(selectedGroup.id, member)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <DeleteOutlined style={{ fontSize: '1.2rem' }} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {selectedGroup.creator === currentUserAddress && (
                      <div className="mt-6">
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                          placeholder="Add member (address)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addMemberToGroup(selectedGroup.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 space-y-4">
                {(selectedContact || selectedGroup) && messages[getChatId(currentUserAddress, selectedContact?.address || `group_${selectedGroup!.id}`)]?.map((msg, index) => {
                  const chatId = getChatId(currentUserAddress, selectedContact?.address || `group_${selectedGroup!.id}`);
                  const isCurrentUser = msg.payload.value.from === currentUserAddress;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-end",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex-shrink-0">
                          {avatars[msg.payload.value.from] && (
                            <Image
                              src={avatars[msg.payload.value.from]}
                              alt={`${msg.payload.value.from}'s avatar`}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          )}
                        </div>
                      )}
                      <div className={cn("relative group max-w-[70%]")}>
                        {isCurrentUser && (
                          <div className="absolute -top-5 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => handleEditMessage(msg)} 
                              className="bg-white text-blue-500 rounded-md p-1.5 shadow-md transition duration-200 border border-blue-500 hover:bg-blue-100"
                            >
                              <EditOutlined style={{ fontSize: '14px' }} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMessage(chatId, msg.hash)} 
                              className="bg-white text-red-500 rounded-md p-1.5 shadow-md transition duration-200 border border-red-500 hover:bg-red-100"
                            >
                              <DeleteOutlined style={{ fontSize: '14px' }} />
                            </button>
                          </div>
                        )}
                        <div
                          className={cn(
                            "p-3 rounded-lg",
                            isCurrentUser
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white",
                            "break-words min-w-[120px]"
                          )}
                          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                          {msg.payload.value.imageUrls && msg.payload.value.imageUrls.length > 0 && (
                            <div className={`mb-2 grid gap-2 ${
                              msg.payload.value.imageUrls.length === 1 ? 'grid-cols-1' :
                              msg.payload.value.imageUrls.length === 2 ? 'grid-cols-2' :
                              msg.payload.value.imageUrls.length === 3 ? 'grid-cols-3' :
                              msg.payload.value.imageUrls.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
                            }`}>
                              {msg.payload.value.imageUrls.map((url: string, imgIndex: number) => (
                                <img
                                  key={imgIndex}
                                  src={url}
                                  alt={`Uploaded image ${imgIndex + 1}`}
                                  className="w-full h-auto object-cover rounded-lg cursor-pointer"
                                  onClick={() => openImageViewer(msg.payload.value.imageUrls!, imgIndex)}
                                />
                              ))}
                            </div>
                          )}
                          <p>{msg.payload.value.text}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isCurrentUser
                              ? "text-blue-200"
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {formatMessageTime(msg.payload.value.timestamp)}
                          </p>
                        </div>
                      </div>
                      {isCurrentUser && (
                        <div className="w-8 h-8 rounded-full ml-2 bg-gray-300 flex-shrink-0">
                          {avatars[currentUserAddress] && (
                            <Image
                              src={avatars[currentUserAddress]}
                              alt="Your avatar"
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex flex-col">
              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected file ${index + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <CloseOutlined style={{ fontSize: '10px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <PictureOutlined className="mr-2 text-gray-500" />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <PaperClipOutlined className="mr-2 text-gray-500" />
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingMessage ? "Edit your message..." : "Type your message here..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (editingMessage ? handleSaveEdit() : sendMessage())}
                />
                <Button 
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg" 
                  onClick={editingMessage ? handleSaveEdit : sendMessage}
                >
                  {editingMessage ? 'Save Edit' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {viewerOpen && (
        <ImageViewer
          images={currentImages}
          currentIndex={currentImageIndex}
          onClose={closeImageViewer}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </div>
  );
};

export default ChatPage;