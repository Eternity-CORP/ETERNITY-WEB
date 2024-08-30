'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import cn from '@/utils/cn';
import { PlusCircleOutlined, PaperClipOutlined, TeamOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import blockies from 'ethereum-blockies';
import { initOrbitDB, addMessage, getMessages } from '@/services/chatService';
import { useAccount } from 'wagmi';
import Image from 'next/image';

type Contact = {
  id: string;
  address: string;
  name: string;
};

type Group = {
  id: string;
  name: string;
  members: string[]; // массив адресов участников
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

  useEffect(() => {
    initOrbitDB().catch(console.error);
    if (address) {
      setCurrentUserAddress(address);
      loadFromLocalStorage(address);
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

  useEffect(() => {
    if (selectedContact || selectedGroup) {
      fetchMessages();
    }
  }, [selectedContact, selectedGroup]);

  useEffect(() => {
    if (currentUserAddress) {
      saveToLocalStorage();
    }
  }, [messages, selectedContact, contactList, groups, currentUserAddress]);

  useEffect(() => {
    const newAvatars: { [key: string]: string } = {};
    contactList.forEach(contact => {
      const canvas = blockies.create({ seed: contact.address });
      newAvatars[contact.address] = canvas.toDataURL();
    });
    setAvatars(newAvatars);
  }, [contactList]);

  const loadFromLocalStorage = (userAddress: string) => {
    const savedData = localStorage.getItem(`chatData_${userAddress}`);
    if (savedData) {
      const { messages: savedMessages, selectedContact: savedSelectedContact, contactList: savedContactList, groups: savedGroups } = JSON.parse(savedData);
      if (Array.isArray(savedContactList)) {
        setContactList(savedContactList);
      }
      if (Array.isArray(savedGroups)) {
        // Фильтруем группы, в которых пользователь является участником
        const userGroups = savedGroups.filter(group => group.members.includes(userAddress));
        setGroups(userGroups);
      }
      setMessages(savedMessages || {});
      setSelectedContact(savedSelectedContact || null);
    } else {
      setContactList([]);
      setGroups([]);
      setSelectedContact(null);
      setMessages({});
    }
  };

  const saveToLocalStorage = () => {
    if (currentUserAddress) {
      const dataToSave = {
        messages,
        selectedContact,
        contactList,
        groups
      };
      localStorage.setItem(`chatData_${currentUserAddress}`, JSON.stringify(dataToSave));
      
      // Сохраняем информацию о группах для всех участников
      groups.forEach(group => {
        group.members.forEach(member => {
          if (member !== currentUserAddress) {
            const memberData = localStorage.getItem(`chatData_${member}`);
            if (memberData) {
              const parsedData = JSON.parse(memberData);
              const updatedGroups = parsedData.groups ? 
                parsedData.groups.filter((g: Group) => g.id !== group.id).concat(group) :
                [group];
              localStorage.setItem(`chatData_${member}`, JSON.stringify({
                ...parsedData,
                groups: updatedGroups,
                messages: {
                  ...parsedData.messages,
                  [`group_${group.id}`]: messages[`group_${group.id}`] || []
                }
              }));
            }
          }
        });
      });
    }
  };

  const fetchMessages = async () => {
    if (selectedContact) {
      try {
        const chatId = getChatId(currentUserAddress, selectedContact.address);
        const fetchedMessages = await getMessages(chatId);
        setMessages(prevMessages => ({
          ...prevMessages,
          [chatId]: fetchedMessages
        }));
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    } else if (selectedGroup) {
      try {
        const chatId = `group_${selectedGroup.id}`;
        const fetchedMessages = await getMessages(chatId);
        setMessages(prevMessages => ({
          ...prevMessages,
          [chatId]: fetchedMessages
        }));
      } catch (error) {
        console.error('Failed to fetch group messages:', error);
      }
    }
  };
  
  const sendMessage = async () => {
    if (inputMessage.trim() && (selectedContact || selectedGroup)) {
      try {
        const chatId = selectedGroup 
          ? `group_${selectedGroup.id}`
          : getChatId(currentUserAddress, selectedContact!.address);
        const message = {
          from: currentUserAddress,
          to: selectedGroup ? selectedGroup.id : selectedContact!.address,
          text: inputMessage,
          timestamp: Date.now()
        };
        const hash = await addMessage(chatId, message);
        setMessages(prevMessages => ({
          ...prevMessages,
          [chatId]: [...(prevMessages[chatId] || []), { hash, payload: { value: message } }]
        }));
        setInputMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const addNewContact = () => {
    if (newContactAddress) {
      const newContact: Contact = {
        id: Date.now().toString(),
        address: newContactAddress,
        name: newContactName,
      };
      setContactList([...contactList, newContact]);
      setNewContactAddress('');
      setNewContactName('');
      setShowInput(false);
    }
  };

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
        members: [currentUserAddress]
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
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatId = (address1: string, address2: string) => {
    if (address2.startsWith('group_')) {
      return address2;
    }
    return [address1, address2].sort().join('_');
  };

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
                    "p-2 mb-2 rounded",
                    msg.payload.value.from === currentUserAddress
                      ? "bg-blue-100 dark:bg-blue-700 self-end"
                      : "bg-gray-100 dark:bg-gray-700"
                  )}>
                    {msg.payload.value.text}
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
              <Button className="ml-2" onClick={sendMessage}>Send</Button>
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
                    'flex items-center p-2 mb-2 rounded cursor-pointer',
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
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      {avatars[contact.address] && (
                        <Image
                          src={avatars[contact.address]}
                          alt={`${contact.address}'s avatar`}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <span className="truncate">
                      {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                    </span>
                  </div>
                </li>
              ))}
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={cn(
                    'flex items-center p-2 mb-2 rounded cursor-pointer',
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
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      <TeamOutlined />
                    </div>
                    <span className="truncate">{group.name}</span>
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
                    'flex items-center p-2 mb-2 rounded cursor-pointer',
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
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      {avatars[contact.address] && (
                        <Image
                          src={avatars[contact.address]}
                          alt={`${contact.address}'s avatar`}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                    </div>
                    <span className="truncate">
                      {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                    </span>
                  </div>
                </li>
              ))}
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={cn(
                    'flex items-center p-2 mb-2 rounded cursor-pointer',
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
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      <TeamOutlined />
                    </div>
                    <span className="truncate">{group.name}</span>
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

          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4">
                {selectedGroup 
                  ? `Group: ${selectedGroup.name}`
                  : selectedContact
                    ? `Chat with ${formatAddress(selectedContact.address)}`
                    : 'Select a contact or group'
                }
              </h2>
              {selectedGroup && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold">Members:</h3>
                  <ul className="list-disc list-inside">
                    {selectedGroup.members.map((member) => (
                      <li key={member}>{formatAddress(member)}</li>
                    ))}
                  </ul>
                  <input
                    type="text"
                    className="w-full p-2 mt-2 border border-gray-200 dark:border-gray-800 rounded"
                    placeholder="Add member (address)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addMemberToGroup(selectedGroup.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                        saveToLocalStorage(); // Сохраняем изменения сразу после добавления участника
                      }
                    }}
                  />
                </div>
              )}
              <div className="mb-4 space-y-4">
                {(selectedContact || selectedGroup) && messages[getChatId(currentUserAddress, selectedContact?.address || `group_${selectedGroup!.id}`)]?.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[70%] p-3 rounded-lg",
                      msg.payload.value.from === currentUserAddress
                        ? "ml-auto bg-blue-500 text-white"
                        : "mr-auto bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    )}
                  >
                    <p>{msg.payload.value.text}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      msg.payload.value.from === currentUserAddress
                        ? "text-blue-200"
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {formatMessageTime(msg.payload.value.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center">
              <PaperClipOutlined className="mr-2 text-gray-500" />
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button 
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg" 
                onClick={sendMessage}
              >
                Send
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;