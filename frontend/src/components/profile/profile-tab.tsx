import { Suspense } from 'react';
import cn from '@/utils/cn';
import ListCard from '@/components/ui/list-card';
import ParamTab, { TabPanel } from '@/components/ui/param-tab';
import TransactionSearchForm from '@/components/author/transaction-search-form';
import TransactionHistory from '@/components/author/transaction-history';
import CollectionCard from '@/components/ui/collection-card';
import { useLayout } from '@/lib/hooks/use-layout';
import { LAYOUT_OPTIONS } from '@/lib/constants';
import { useAccount, useBalance } from 'wagmi'
import React, { useState, useEffect } from 'react';
import axios from 'axios'
// static data
import { collections } from '@/data/static/collections';
import {
  authorWallets,
  authorNetworks,
  authorProtocols,
} from '@/data/static/author-profile';
import Loader from '@/components/ui/loader';

const tabMenu = [
  {
    title: 'Collection',
    path: 'collection',
  },
  {
    title: 'Portfolio',
    path: 'portfolio',
  },
  {
    title: 'History',
    path: 'history',
  },
];

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

export default function ProfileTab() {

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_KEY = 'U4HKZNIB8D9XKQK3RN5X81MIDZK9SNM4QB';  // Замените на ваш API ключ

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`
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

  const { address, isConnecting, isDisconnected } = useAccount()
  const { data: balance, isLoading } = useBalance({
    address: address,
  })

  const { layout } = useLayout();
  return (
    <Suspense fallback={<Loader variant="blink" />}>
      <ParamTab tabMenu={tabMenu}>
        <TabPanel className="focus:outline-none">
          <div
            className={cn(
              'grid gap-4 xs:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:gap-6 3xl:grid-cols-3 4xl:grid-cols-4',
              layout === LAYOUT_OPTIONS.RETRO
                ? 'md:grid-cols-2'
                : 'md:grid-cols-1',
            )}
          >
            {collections?.map((collection) => (
              <CollectionCard
                item={collection}
                key={`collection-key-${collection?.id}`}
              />
            ))}
          </div>
        </TabPanel>
        <TabPanel className="focus:outline-none">
          <div className="space-y-8 md:space-y-10 xl:space-y-12">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
              {authorWallets?.map((wallet) => (
                <ListCard
                  item={wallet}
                  key={`wallet-key-${wallet?.id}`}
                  variant="medium"
                />
              ))}
              Balance: {balance?.formatted} ETH
            </div>
            <div className="block">
              <h3 className="text-heading-style mb-3 uppercase text-gray-900 dark:text-white">
                Protocols
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {authorProtocols?.map((protocol) => (
                  <ListCard
                    item={protocol}
                    key={`protocol-key-${protocol?.id}`}
                    variant="large"
                  />
                ))}
              </div>
            </div>
            <div className="block">
              <h3 className="text-heading-style mb-3 uppercase text-gray-900 dark:text-white">
                Networks
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
                {authorNetworks?.map((network) => (
                  <ListCard
                    item={network}
                    key={`network-key-${network?.id}`}
                    variant="medium"
                  />
                ))}
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel className="focus:outline-none">
          <div className="space-y-8 xl:space-y-9">
            <TransactionSearchForm />
            <TransactionHistory />
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
        </TabPanel>
      </ParamTab>
    </Suspense>
  );
}
