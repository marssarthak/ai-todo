"use client";

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, AlertTriangle, Info, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatUnits } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

// Match the backend response type
interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  gasUsed: string;
  gasPrice: string;
  isError: string;
}

// Map chain IDs to explorer URLs
const explorerUrls: { [chainId: number]: string } = {
  [polygon.id]: "https://polygonscan.com/tx",
  [polygonAmoy.id]: "https://amoy.polygonscan.com/tx",
};

function TransactionRow({ tx, chainId }: { tx: Transaction; chainId: number }) {
  const explorerUrl = explorerUrls[chainId];
  const timeAgo = formatDistanceToNow(new Date(parseInt(tx.timeStamp) * 1000), {
    addSuffix: true,
  });
  const valueInEth = formatUnits(BigInt(tx.value), 18); // Format value from Wei to Ether/Matic
  const isError = tx.isError === "1";

  const truncateAddress = (address: string) =>
    `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  return (
    <TableRow className={isError ? "bg-destructive/10" : ""}>
      <TableCell>
        <a
          href={explorerUrl ? `${explorerUrl}/${tx.hash}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-500 hover:underline"
        >
          {truncateAddress(tx.hash)}
          {explorerUrl && <ExternalLink className="ml-1 h-3 w-3" />}
        </a>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{timeAgo}</TableCell>
      <TableCell>{truncateAddress(tx.from)}</TableCell>
      <TableCell>{truncateAddress(tx.to)}</TableCell>
      <TableCell className="text-right">{`${parseFloat(valueInEth).toFixed(
        6
      )} MATIC`}</TableCell>
      {/* Add more cells if needed e.g., Status */}
    </TableRow>
  );
}

export function TransactionHistory() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedWallet = wallets.find((wallet) => wallet.address);
  const numericChainId = connectedWallet
    ? parseInt(connectedWallet.chainId.split(":")[1])
    : null;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!ready || !authenticated || !connectedWallet || !numericChainId) {
        setTransactions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          address: connectedWallet.address,
          chainId: numericChainId.toString(),
        });
        const response = await fetch(
          `/api/blockchain/transactions?${params.toString()}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || `API error: ${response.statusText}`
          );
        }
        const data: Transaction[] = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load transaction history."
        );
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [ready, authenticated, connectedWallet?.address, numericChainId]); // Refetch when address or chain changes

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your last 50 transactions on the connected network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && error && (
            <Alert variant="destructive" className="text-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Transactions</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && !authenticated && (
            <Alert variant="default" className="text-sm">
              <Info className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                Connect your wallet to view transaction history.
              </AlertDescription>
            </Alert>
          )}
          {!isLoading &&
            !error &&
            authenticated &&
            transactions.length === 0 && (
              <Alert variant="default" className="text-sm">
                <Info className="h-4 w-4" />
                <AlertTitle>No Transactions</AlertTitle>
                <AlertDescription>
                  No recent transactions found for this address on the selected
                  network.
                </AlertDescription>
              </Alert>
            )}
          {!isLoading && !error && authenticated && transactions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  {/* Add more headers if needed */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TransactionRow
                    key={tx.hash}
                    tx={tx}
                    chainId={numericChainId!}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
