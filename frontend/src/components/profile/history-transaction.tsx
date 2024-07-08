import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '@/components/ui/loader';

interface Transaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
  }

const TransactionHistory = () => {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_KEY = 'U4HKZNIB8D9XKQK3RN5X81MIDZK9SNM4QB';  // Замените на ваш API ключ

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=account&action=txlist&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`
        );
        setTransactionHistory(response.data.result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, []);

  if (loading) {
    return <Loader variant="blink" />;
  }

  return (
    <div>
      <h3>Transaction History</h3>
      {transactionHistory.length > 0 ? (
        <ul>
          {transactionHistory.map((tx: Transaction) => (
            <li key={tx.hash}>
              <p>From: {tx.from}</p>
              <p>To: {tx.to}</p>
              <p>Value: {tx.value} Wei</p>
              {/* Другие поля транзакции */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default TransactionHistory;
