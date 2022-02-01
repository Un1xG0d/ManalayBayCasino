import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import HDWalletProvider from "@truffle/hdwallet-provider"
import maticjs from "@maticnetwork/maticjs"
import web3 from "@maticnetwork/maticjs-web3";
const { POSClient,use } = maticjs;
const { Web3ClientPlugin } = web3;

const owner = process.env.OWNER_ADDRESS;
const mnemonic = process.env.OWNER_MNEMONIC;

var app = express();app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: "*" }))

use(Web3ClientPlugin);

async function payout(winnings, winner) {
  winnings = winnings * 1000000000000000000;
  const posClient = new POSClient();
  await posClient.init({
      network: 'mainnet',
      version: 'v1',
      parent: {
        provider: new HDWalletProvider(mnemonic, "https://polygon-rpc.com/"),
        defaultConfig: {
          from : owner
        }
      },
      child: {
        provider: new HDWalletProvider(mnemonic, "https://polygon-rpc.com/"),
        defaultConfig: {
          from : owner
        }
      }
  });

  const erc20Token = posClient.erc20("0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4");
  let txHash = "";
  try {
    const result = await erc20Token.transfer(winnings.toString(), winner);
    txHash = await result.getTransactionHash();
  } catch (err) {
    console.log(err);
  }
  return txHash;
}

app.post("/", (req, res) => {
  let winnings = req.body.winnings;
  let winner = req.body.winner;
  console.log("\nStarting payout for: " + winner);
  const startPayout = async () => {
    let tx = await payout(winnings, winner);
    console.log("Payout complete: " + tx);
    res.json({"winner": winner, "amount": winnings, "tx": tx});
  }
  startPayout();
});
