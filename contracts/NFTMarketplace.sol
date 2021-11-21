// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <=0.8.10;


/*
Ideally We should be using some libraries for development of such contract, 
like openzepplins ERC721 and ERC721Metadata extentions, Counter utility for counters,
 to make the contract as safe as possible, but using those will reduce the code we will write on our own,
 which defies the purpose why we are making this project.
 that is why I have decided to write all the code and not use any interface or contract extentions.
 */

contract NFTMarketplace {

// name and symbol for the contract. 
    string public name;
    string public symbol;
 
//  owner of the contract who will be recieving the royalties for every sale made on this marketplace.
// the owner is set as the msg.sender using the constructor.
// and can be changed using changeContractOwner  function.
    address private _owner;
    
    // counter to assign the tokenId for each new token minted;
    uint counter;
    
    // this stores wether the metadata for the token  that is it's tokenURL is already minted or not
    // it is useful to avoid same image or token to be minted twice.
    mapping(string => bool) private _isTokenMinted;

// mapps the tokenId to tokens owners and tokens urls [that is in our case the ipfs hash];
    mapping(uint => address) private _owners;
    mapping(uint => string) private _tokenUrls;
    
    // stores the prices for the tokens that are on sale
   // if for any token, the price is 0 that means the token is not for sale
    mapping(uint => uint) private _forSaleTokenPrices;
    
    // we set the name and symbol of the contract and also the msg.sender is autommatically saved as the owner of the contract.
    constructor (string memory _name,string memory _symbol)  {
        name = _name;
        symbol = _symbol;
        _owner = msg.sender;
    }
    
    
    // only owner modifier to prevent some functionality of the functions to be accessible onlt to the owner of the contract.
    modifier onlyOwner () {
        require(msg.sender == _owner);
        _;
    }
    
    

    // only takes the token metadata the tokenId and tokenOwner is automatically set using counter and the transaction caller
    function mint(string memory _tokenUrl) public returns(uint tokenID) {
        
        // this avoids duplicating the same tokenUrl to be minted more than once and assures the uniqness of the tokens.
        require(!_isTokenMinted[_tokenUrl],"This token is already minted");

        tokenID = counter;
        _owners[tokenID] = msg.sender;
        _tokenUrls[tokenID] = _tokenUrl;
        _isTokenMinted[_tokenUrl] = true;

        counter++;
        return tokenID;
    }
    

    // setting token for sale the price must be more than 0, and only owners can sell their token.
    function setForSale(uint _tokenId,uint _sellPrice) public {
        require(_sellPrice > 0,"Invalid selling price");
        require(_owners[_tokenId] == msg.sender,"Only token owners can put tokens for sale");
        require(_forSaleTokenPrices[_tokenId] == 0, "The token is already for sale");
        
        _forSaleTokenPrices[_tokenId] = _sellPrice;
    }
    
    // to buy the token all the internal state changes are called first then the transfer functions
    // are called to avoid reentrency.
    function buy(uint _tokenId) public payable {
        
        uint _tokenPrice = _forSaleTokenPrices[_tokenId];
        
        require(_tokenPrice>0,"The token is not for sale");
        require(msg.value >= _tokenPrice,"The provided value is insufficient");
        
        address payable _previousOwner = payable(_owners[_tokenId]);
        address payable _newOwner = payable(msg.sender);
        address payable _contractOwner = payable(_owner);
        uint royalty = _tokenPrice * 5/100;
        _owners[_tokenId] = msg.sender;
        
        if(msg.value > _tokenPrice) {
            _newOwner.transfer(msg.value - _tokenPrice);
        }
        _contractOwner.transfer(royalty);
        _previousOwner.transfer(_tokenPrice - royalty);
        
    }
    
    // returns the selling price of the token that is on sale
    // if the token is not on sale it returns 0, insted of sending the error.
    function getTokenPrice(uint _tokenId) public view  returns(uint) {
         return  _forSaleTokenPrices[_tokenId];
    }
    

    // returns the token url that is the ipfs hash of the token image
    function getTokenUrl(uint _tokenId) public view returns(string memory) {
       string memory tokenUrl = _tokenUrls[_tokenId];
        return tokenUrl;
    }
    

    // to change the contract owner. this address will be recieving the royalties for any sell made on this contract
    function changeContractOwner(address _newContractOwner) public onlyOwner {
        _owner = _newContractOwner;
    }
    

    // returns the total number of the tokens minted 
    function getNumberOfTokens() public view returns(uint) {
        return counter;
    } 

    // returns the tokenOwner;
    function getTokenOwner(uint _tokenId) public view returns(address) {
        return _owners[_tokenId];
    }

 } 