const Web3  = require("web3");
const { abi, bytecode } = require("./metadata");

async function main() {
  const network = process.env.ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,
    ),
  );
 
  const signer = web3.eth.accounts.privateKeyToAccount(
    '0x' + process.env.SIGNER_PRIVATE_KEY,
  );
  
  web3.eth.accounts.wallet.add(signer);


  const contract = new web3.eth.Contract(abi);
  contract.options.data = bytecode;
  const deployTx = contract.deploy();
  const deployedContract = await deployTx
    .send({
      from: signer.address,
      gas: await deployTx.estimateGas({from:signer.address}),
    })
    .once("transactionHash", (txhash) => {
      console.log(`Mining deployment transaction ...`);
      console.log(`https://${network}.etherscan.io/tx/${txhash}`);
    });

  console.log(`Deployed contract address is => ${deployedContract.options.address}`);
  const status = await ApproveToken(deployedContract.options.address)

  if(status){
    AddLiquidity(deployedContract.options.address)
  }

}
const uniwapRouterABI = [{
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountTokenDesired", type: "uint256" },
      { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
      { internalType: "uint256", name: "amountETHMin", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "addLiquidityETH",
    outputs: [
      { internalType: "uint256", name: "amountToken", type: "uint256" },
      { internalType: "uint256", name: "amountETH", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  }];

const AddLiquidity = async (token)=>{
    const deadlinetime = Number((new Date().getTime() + 1200000) / 1000 ).toFixed(0);
    const network = process.env.ETHEREUM_NETWORK;
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,),
    );
    console.log(deadlinetime, token)
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.SIGNER_PRIVATE_KEY); 
    const routerContract = new web3.eth.Contract(uniwapRouterABI, process.env.UNISWAPROUTER_ADDRESS);
    const data = await routerContract.methods.addLiquidityETH(token, "1000000000000000000", "1000000000000000000", "10000000000000000", account.address, deadlinetime)
    const gas = await routerContract.methods.addLiquidityETH(token, "1000000000000000000", "1000000000000000000", "10000000000000000", account.address, deadlinetime).estimateGas({from: account.address,  value: web3.utils.toWei('0.01', 'ether')})

    const gasPrice = await web3.eth.getGasPrice();
    const txCount = await web3.eth.getTransactionCount(account.address);
 
    const tx = {
        from: account.address,
        to: process.env.UNISWAPROUTER_ADDRESS,
        value: web3.utils.toWei('0.01', 'ether'),
        nonce: web3.utils.toHex(txCount),
        gas: web3.utils.toHex(gas),
        gasPrice: web3.utils.toHex(gasPrice),
        data: data.encodeABI(), 
    };
    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("Liquidity added", receipt)
}

const ApproveToken = async (token)=>{
    const network = process.env.ETHEREUM_NETWORK;
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,),
    );
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.SIGNER_PRIVATE_KEY); 
    const routerContract = new web3.eth.Contract(abi, token);
    const data = await routerContract.methods.approve(process.env.UNISWAPROUTER_ADDRESS, "1000000000000000000")
    const gas = await routerContract.methods.approve(process.env.UNISWAPROUTER_ADDRESS, "1000000000000000000").estimateGas({from: account.address})
    const gasPrice = await web3.eth.getGasPrice();
    const txCount = await web3.eth.getTransactionCount(account.address);
  
   
    const tx = {
        from: account.address,
        to: token,
        nonce: web3.utils.toHex(txCount),
        gas: web3.utils.toHex(gas),
        gasPrice: web3.utils.toHex(gasPrice),
        data: data.encodeABI(), 
    };

    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("Token Approved",receipt.status)
    return receipt ? receipt.status : false
}

require("dotenv").config();
main();
