// 1. Username?

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import cn from '@/utils/cn';
import { PlusCircleOutlined, PaperClipOutlined, TeamOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import blockies from 'ethereum-blockies';

type Contact = {
  id: number;
  address: string;
  name: string;
};

const contacts: Contact[] = [
  { id: 1, address: '0x1234567890abcdef1234567890abcdef12345678', name: '' },
  { id: 2, address: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4', name: '' },
  { id: 3, address: '0x9876543210abcdef9876543210abcdef98765432', name: '' },
];

const ChatPage = () => {
  const [contactList, setContactList] = useState<Contact[]>(contacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [resizing, setResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addNewContact = () => {
    if (newContactAddress) {
      const newContact: Contact = {
        id: contactList.length + 1,
        address: newContactAddress,
        name: newContactName,
      };
      setContactList([...contactList, newContact]);
      setNewContactAddress('');
      setNewContactName('');
      setShowInput(false);
    }
  };

  const handleMouseDown = (e: any) => {
    if (!isMobile) {
      setResizing(true);
      setStartX(e.clientX);
    }
  };

  const handleMouseMove = (e: any) => {
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
    alert('Group creation is not yet implemented!');
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
                <div className="p-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded">
                  Hello, how are you?
                </div>
                <div className="p-2 mb-2 bg-blue-100 dark:bg-blue-700 rounded self-end">
                  I'm fine, thanks!
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center">
              <PaperClipOutlined className="mr-2" />
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded"
                placeholder="Type your message here..."
              />
              <Button className="ml-2">Send</Button>
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
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" onClick={addGroup}>
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
                  onClick={() => setSelectedContact(contact)}
                  title={contact.address}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      {typeof document !== 'undefined' && (
                        <img
                          src={blockies.create({ seed: contact.address }).toDataURL()}
                          alt={`${contact.address}'s avatar`}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                    </div>
                    <span className="truncate">
                      {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                    </span>
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
              <h2 className="text-lg font-semibold">Contacts</h2>
              <div className="flex items-center space-x-2">
                <button
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowInput(!showInput)}
                >
                  <PlusCircleOutlined />
                </button>
                <button
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={addGroup}
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
                  onClick={() => setSelectedContact(contact)}
                  title={contact.address}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                      {typeof document !== 'undefined' && (
                        <img
                          src={blockies.create({ seed: contact.address }).toDataURL()}
                          alt={`${contact.address}'s avatar`}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                    </div>
                    <span className="truncate">
                      {contact.name ? `${contact.name} (${formatAddress(contact.address)})` : formatAddress(contact.address)}
                    </span>
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
                Chat with {selectedContact?.address || 'Select a contact'}
              </h2>
              <div className="mb-4">
                <div className="p-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded">
                  Hello, how are you?
                </div>
                <div className="p-2 mb-2 bg-blue-100 dark:bg-blue-700 rounded self-end">
                  I'm fine, thanks!
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center">
              <PaperClipOutlined className="mr-2" />
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded"
                placeholder="Type your message here..."
              />
              <Button className="ml-2">Send</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;
