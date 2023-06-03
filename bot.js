require('dotenv').config();
const { TwitterApi } = require("twitter-api-v2");
const { ethers, Contract } = require('ethers');
const fs = require('fs');

const rpcURL = process.env.RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcURL);

const CONTRACT_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
const CONTRACT_ABI = JSON.parse(fs.readFileSync('contract-abi.json'));

const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Note: USDC uses 6 decimal places
const TRANSFER_THRESHOLD = 100000000000;

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});

const bearer = new TwitterApi(process.env.BEARER_TOKEN);

const twitterClient = client.readWrite; 
const twitterBearer = bearer.readOnly;

const main = async () => {
  const name = await contract.name();
  console.log(`Whale tracker started!\nListening for large transfers on ${name}`);

  contract.on('Transfer', async (from, to, amount, data) => {
    // Note: not all ERC-20 tokens index `amount`
    // Use this instead of Ethers.js query filters
    // https://docs.ethers.io/v5/concepts/events/
    if (amount.toNumber() >= TRANSFER_THRESHOLD) {
      try {
        const formattedAmount = ethers.utils.formatUnits(amount, 6, { commify: true });
        await twitterClient.v2.tweet(`🐋🐋🐋Whale alert 🚨 ${formattedAmount} USDC transferred to address ${to} https://etherscan.io/tx/${data.transactionHash}`);
        console.log("Tweet sent successfully!");
      } catch (e) {
        console.log(e);
      }
    }
  });
};

main();

