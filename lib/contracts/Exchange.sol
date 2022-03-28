// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./NToken.sol";

contract Exchange{
    using SafeMath for uint;

    address public feeAccount; //the account who received fees
    uint256 public feePercent;
    address constant ETHER = address(0);
    mapping (address=>mapping(address=>uint256)) public tokens;

    event Deposit(address _token, address _user, uint256 _amount, uint256 _balance);

    constructor (address _feeAccount, uint256 _feePercent){
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    fallback()  external{
        revert();
    }

    function depositEther() payable public{
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value); 
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token,uint _amount) public {
        require(_token != ETHER); //don't allow ether deposits
        require(NToken(_token).transferFrom(msg.sender, address(this), _amount)); //send tokens to this contract
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount); //manage deposit - update balance
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]); //emit event
    }

}

//TODO:
//[x] set the fee account
//[x] deposit tokens
//[] withdraw tokens
//[x] deposit ether
//[] withdraw ether
//[] check balances
//[] make order
//[] cancel order
//[] fill order
//[] charge fees