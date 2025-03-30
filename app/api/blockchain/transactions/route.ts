import { NextRequest, NextResponse } from "next/server";
import { polygon, polygonAmoy } from "viem/chains";

// Basic type for PolygonScan API response (adjust based on actual response structure)
interface PolygonScanTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  gasUsed: string;
  gasPrice: string;
  isError: string; // "0" for success, "1" for error
}

interface PolygonScanApiResponse {
  status: string;
  message: string;
  result: PolygonScanTx[];
}

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

// Map chain IDs to PolygonScan API URLs
const explorerApiUrls: { [chainId: number]: string } = {
  [polygon.id]: "https://api.polygonscan.com/api",
  [polygonAmoy.id]: "https://api-amoy.polygonscan.com/api",
};

export async function GET(request: NextRequest) {
  if (!POLYGONSCAN_API_KEY) {
    console.error("PolygonScan API key is not configured.");
    return NextResponse.json(
      { error: "Server configuration error", details: "API key missing." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chainIdStr = searchParams.get("chainId");

  if (!address) {
    return NextResponse.json(
      { error: "Missing required parameter", details: "Address is required." },
      { status: 400 }
    );
  }

  const chainId = chainIdStr ? parseInt(chainIdStr, 10) : polygon.id; // Default to Polygon mainnet
  const apiUrl = explorerApiUrls[chainId];

  if (!apiUrl) {
    return NextResponse.json(
      {
        error: "Unsupported network",
        details: `Chain ID ${chainId} not supported.`,
      },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "50", // Limit to last 50 transactions for now
    sort: "desc",
    apikey: POLYGONSCAN_API_KEY,
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`PolygonScan API request failed: ${response.statusText}`);
    }

    const data: PolygonScanApiResponse = await response.json();

    if (data.status !== "1" && data.message !== "No transactions found") {
      // Handle potential API errors reported in the JSON response
      console.error("PolygonScan API Error:", data.message, data.result);
      throw new Error(
        data.message || "Failed to fetch transactions from PolygonScan"
      );
    }

    // Ensure result is always an array, even if no transactions found
    const transactions = Array.isArray(data.result) ? data.result : [];

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch transaction history", details: message },
      { status: 500 }
    );
  }
}
