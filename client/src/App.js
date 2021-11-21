import React, { Component } from "react";
import "./App.css";
import NFTMarketplace from "./contracts/NFTMarketplace.json";
import getWeb3 from "./getWeb3";

// using ipfs-api with infura public network for uploading images to the ipfs
const IPFS = require("ipfs-api");
const ipfs = new IPFS({ host: "ipfs.infura.io", port: 5001, protocol: "https" });


class App extends Component {
  state = {  web3: null, accounts: null, contract: null, totalTokens: 0 };
  
  // initialise web3 and the contract.
  componentDidMount = async () => {
    try{
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = NFTMarketplace.networks[networkId];
      const instance = new web3.eth.Contract(
        NFTMarketplace.abi,
        "0x932E3A5C656ea9278f3CEd2F213db985A400D901",
      );

      this.setState({ web3, accounts, contract: instance });
      this.getTotalTokens();

    }catch(error){
      alert(`Failed to load web3`);
    console.log(error);

    }
  }

  // added a random imageHash so the UI looks little bit good when there is no image to show
  constructor(props) {
    super(props);
    this.state = {
      buffer: null,
      imageHash: "QmSsDpzKmFRxU4mq7MdajqTL6P4urW1oPZoY1eDPwUAJyS",
      totalTokens: 0,
      tokenSellingPrice : 0,
      tokenOwner: 0,
    }
  }


  // process the file for ipfs this function is called once the image is selected before the submit buttin is pressed the image is processed;
  computeFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      console.log(Buffer(reader.result));
    this.setState({buffer: Buffer(reader.result)});
    }
  }

  // uploads the image to ipfs and adds the imageHash to the NFTMarketplace as a new token with the caller as the owner.
  // It returns the tokenId of the new token, and the total number of tokens is also updated 
  onSubmit = async (event) => {
    event.preventDefault()
    console.log("Submitting file to ipfs...")
    ipfs.add(this.state.buffer, async  (err, result) => {
      console.log("Uploading file");
      console.log(err, result);
      if(err) {
        console.error(err);
        return;
      }
      this.setState({imageHash: result[0].hash});
      const { accounts , contract} = this.state;
      var newTokenId =  await contract.methods.mint(this.state.imageHash).send({from: accounts[0]});
      console.log(newTokenId);
      this.getTotalTokens();
  });
  }

  // To update the total numbe of tokens minted. 
  getTotalTokens = async () => {
    const { accounts , contract} = this.state;
    var _totalTokens =  await contract.methods.getNumberOfTokens().call();
    console.log(_totalTokens);
    this.setState({totalTokens: _totalTokens});
  }


  // gets the tokenUrl from the contract and updates the image also the owner of the contract is fetched and set. 
  getToken = async (event) => {
    event.preventDefault();
    console.log(event.target.tokenId.value);
    const { accounts , contract} = this.state;
    const tokenId = event.target.tokenId.value;
    var tokenHash =  await contract.methods.getTokenUrl(tokenId).call();
    var owner =  await contract.methods.getTokenOwner(tokenId).call();
    console.log(tokenHash);
    this.setState({imageHash: tokenHash,tokenOwner: owner});
  }

  // sets the token for sale with given price.
  sellToken = async (event) => {
    event.preventDefault();
    const { accounts , contract} = this.state;
    console.log(`Selling token ${event.target.tokenId.value} for price ${event.target.price.value}`);
     const result =  await contract.methods.setForSale(event.target.tokenId.value,event.target.price.value).send({from: accounts[0]});
    console.log(result);
  }

  // to buy the token which is on sale.
  buyToken = async (event) => {
    event.preventDefault();
    const { accounts , contract} = this.state;
    console.log(`Buying token ${event.target.tokenId.value} for price ${event.target.price.value}`);
     const result =  await contract.methods.buy(event.target.tokenId.value).send({from: accounts[0],value : event.target.price.value});
    console.log(result);
  }
 
  // gets the selling price of the token returns 0 if the token is not on sale
  getSellingPrice = async (event) => {
    event.preventDefault();
    console.log(event.target.tokenId.value);
    const { accounts , contract} = this.state;
    var sellingPrice =  await contract.methods.getTokenPrice(event.target.tokenId.value).call();
    console.log(sellingPrice);
    this.setState({tokenSellingPrice: sellingPrice});
  }


  render() {
   if(!this.state.web3) {
     return <div>Loading web3...</div>
   }
    return (
      <div className="App">
        <h1>NFT Marketplace</h1>
        <img src={`https://ipfs.infura.io/ipfs/${this.state.imageHash}`}/>
        <h3>Total Tokens: {this.state.totalTokens}</h3>
        <form onSubmit={this.onSubmit}>
        <h2>Upload new Token</h2>
        <input type="file" onChange={this.computeFile}/>
        <input type="submit" />
          </form> 
        <br/>

        <form onSubmit={this.getToken}>
          <h2>Get Token</h2>
         
        <label >Token Id: </label>
          <input type="number" id="tokenId" />
          <h3>Token Owner: {this.state.tokenOwner}</h3>
          <input type="submit" />
        </form>
        

        <form onSubmit={this.sellToken}>
          <h2>Sell Token</h2>
        <label for="tokenId">Token Id: </label>
          <input type="number" id="tokenId"/>
          <br/>
          <br/>
          <label for="price">Price: </label>
          <input type="number" id="price"/>
          <br/>
          <br/>

          <input type="submit" />
        </form>

        <form onSubmit={this.getSellingPrice}>
          <h2>Get Selling Price</h2>
        <label for="tokenId">Token Id: </label>
          <input type="number" id="tokenId"/>
          <br/>
          <h3>Selling Price:{this.state.tokenSellingPrice}</h3>
          <input type="submit" />
        </form>

        <form onSubmit={this.buyToken}>
          <h2>Buy Token</h2>
        <label for="tokenId">Token Id: </label>
          <input type="number" id="tokenId"/>
          <br/>
          <br/>
          <label for="price">Price:</label>
          <input type="number" id="price"/>
          <br/>
          <br/>
          <input type="submit" />
        </form>
        <br/>
          <br/>
          <br/>
          <br/>
      </div>
    );
  }
}

export default App;
