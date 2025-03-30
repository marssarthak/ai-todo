import MainLayout from "@/components/layout/MainLayout";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import { WalletConnect } from "@/components/blockchain/WalletConnect";
import { WalletStatus } from "@/components/blockchain/WalletStatus";
import { TransactionHistory } from "@/components/blockchain/TransactionHistory";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex justify-end mb-4">
        <WalletStatus />
        <WalletConnect />
      </div>
      {/* <div className="mb-6">
        <TransactionHistory />
      </div> */}
      <TaskDashboard />
    </MainLayout>
  );
}
