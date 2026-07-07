// src/services/tronExplorer.js
const TRONGRID_BASE = 'https://api.shasta.trongrid.io';
const USDT_SHASTA_CONTRACT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const verifyTransactionConfirmed = async (txHash, attempts = 5, delayMs = 3000) => {
  for (let i = 0; i < attempts; i++) {
    await wait(delayMs);
    try {
      const res = await fetch(`${TRONGRID_BASE}/wallet/gettransactioninfobyid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: txHash }),
      });
      const data = await res.json();
      if (data && data.receipt && data.receipt.result === 'SUCCESS') {
        return true;
      }
      if (data && data.receipt && data.receipt.result) {
        // Confirmed but failed (e.g. REVERT), stop polling early
        return false;
      }
    } catch (err) {
      console.warn('Confirmation check failed, retrying:', err);
    }
  }
  return false; // never confirmed within the polling window
};

export const fetchOnChainHistory = async (address) => {
  if (!address) return [];

  try {
    const url = `${TRONGRID_BASE}/v1/accounts/${address}/transactions/trc20?limit=15&contract_address=${USDT_SHASTA_CONTRACT}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('TronGrid request failed');

    const data = await res.json();
    const txs = (data.data || []).map((tx) => ({
      id: tx.transaction_id,
      direction: tx.to === address ? 'in' : 'out',
      counterparty: tx.to === address ? tx.from : tx.to,
      amount: (Number(tx.value) / Math.pow(10, tx.token_info?.decimals || 6)).toFixed(2),
      symbol: tx.token_info?.symbol || 'USDT',
      timestamp: tx.block_timestamp,
    }));

    return txs;
  } catch (err) {
    console.warn('On-chain history fetch failed:', err);
    return [];
  }
};