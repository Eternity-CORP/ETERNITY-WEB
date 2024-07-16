// TODO
// 1. Сделать нормальную рассятжку списка контактов
// 2. Изменять формат имени при большой или маленькой ширине расстяжки
// 3. Сделать конпку создания групп
// 4. Добавление имени к адрессу(никнеймов), лучше сделать так что юзер сам себе выбирает никнейм, а он просто отображаеться у других.

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import cn from '@/utils/cn';
import { PlusCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import blockies from 'ethereum-blockies';

// Пример контактов с аватарами
const contacts = [
  { id: 1, address: '0x1234567890abcdef1234567890abcdef12345678' },
  { id: 2, address: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4' },
  { id: 3, address: '0x9876543210abcdef9876543210abcdef98765432' },
];

/// Импорт зависимостей и компонентов...

const ChatPage = () => {
  const [contactList, setContactList] = useState(contacts);
  const [selectedContact, setSelectedContact] = useState(contactList[0]);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [resizing, setResizing] = useState(false);
  const [startX, setStartX] = useState(0); // Для отслеживания начальной позиции X при изменении размера

  const addNewContact = () => {
    if (newContactAddress) {
      const newContact = {
        id: contactList.length + 1,
        address: newContactAddress,
      };
      setContactList([...contactList, newContact]);
      setNewContactAddress('');
      setShowInput(false);
    }
  };

  const handleMouseDown = (e: any) => {
    setResizing(true);
    setStartX(e.clientX); // Сохраняем начальную позицию X при нажатии
  };

  const handleMouseMove = (e: any) => {
    if (resizing) {
      const newWidth = sidebarWidth + (e.clientX - startX); // Вычисляем новую ширину на основе изменения позиции X
      setSidebarWidth(Math.max(300, Math.min(700, newWidth))); // Ограничиваем минимальное и максимальное значение ширины
      setStartX(e.clientX); // Обновляем начальную позицию X для следующего шага
    }
  };

  const handleMouseUp = () => {
    setResizing(false);
  };

  const formatAddress = (address: any) => {
    return address.slice(0, 6) + '...' + address.slice(address.length - 6);
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
            onMouseDown={handleMouseDown} // Добавляем обработчик на нажатие для изменения размера
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
              title={contact.address} // Show full address on hover
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
                <span className="truncate">{formatAddress(contact.address)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Перетаскиваемый бар */}
      <div
        className="w-1 bg-gray-200 cursor-col-resize"
        onMouseDown={handleMouseDown} // Добавляем обработчик на нажатие для изменения размера
        style={{ userSelect: resizing ? 'none' : 'initial' }} // Используем user-select для предотвращения выделения текста
      ></div>

      {/* Right column: Chat window */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">
            Chat with {selectedContact.address}
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
