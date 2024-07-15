'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import cn from '@/utils/cn';
import { PlusCircleOutlined, PaperClipOutlined } from '@ant-design/icons';

// Пример контактов с аватарами
const contacts = [
  { id: 1, name: 'Alice', avatar: '/avatars/alice.png' },
  { id: 2, name: 'Bob', avatar: '/avatars/bob.png' },
  { id: 3, name: 'Charlie', avatar: '/avatars/charlie.png' },
];

const ChatPage = () => {
  const [contactList, setContactList] = useState(contacts);
  const [selectedContact, setSelectedContact] = useState(contactList[0]);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [resizing, setResizing] = useState(false);

  const addNewContact = () => {
    if (newContactAddress) {
      const newContact = {
        id: contactList.length + 1,
        name: newContactAddress,
        avatar: '/avatars/default.png', // Путь к изображению по умолчанию
      };
      setContactList([...contactList, newContact]);
      setNewContactAddress('');
      setShowInput(false);
    }
  };

  const handleMouseDown = () => {
    setResizing(true);
  };

  const handleMouseMove = (e: any) => {
    if (resizing) {
      setSidebarWidth(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setResizing(false);
  };

  return (
    <div className="h-screen overflow-hidden flex" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Left column: Contacts list */}
      <div
        className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <button
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setShowInput(!showInput)}
          >
            <PlusCircleOutlined />
          </button>
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
                selectedContact.id === contact.id
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
              onClick={() => setSelectedContact(contact)}
            >
              <img
                src={contact.avatar}
                alt={`${contact.name}'s avatar`}
                className="w-8 h-8 rounded-full mr-2"
              />
              {contact.name}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="w-1 bg-gray-200 cursor-col-resize"
        onMouseDown={handleMouseDown}
      ></div>

      {/* Right column: Chat window */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">
            Chat with {selectedContact.name}
          </h2>
          {/* Example messages */}
          <div className="mb-4">
            <div className="p-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded">
              Hello, how are you?
            </div>
            <div className="p-2 mb-2 bg-blue-100 dark:bg-blue-700 rounded self-end">
              I'm fine, thanks!
            </div>
          </div>
        </div>

        {/* Message input */}
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
    </div>
  );
};

export default ChatPage;
