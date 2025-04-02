import MainLayout from "@/components/layout/MainLayout";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import { TransactionHistory } from "@/components/blockchain/TransactionHistory";

export default function Home() {
  return (
    <MainLayout>
      {/* Wallet components have been moved to MainLayout */}
      {/* <div className="mb-6">
        <TransactionHistory />
      </div> */}
      <TaskDashboard />
    </MainLayout>
  );
}
