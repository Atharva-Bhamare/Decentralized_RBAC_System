const contractAddress = "0xc00F4d45936e0537D606Bc65cC0E8d2C052aC553";

let provider;
let signer;
let contract;

async function initContract() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    const response = await fetch("abi.json");
    const data = await response.json();

    contract = new ethers.Contract(contractAddress, data.abi, signer);
}