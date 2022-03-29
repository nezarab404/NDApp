// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./NToken.sol";

contract Exchange {
    using SafeMath for uint256;

    address public feeAccount; //the account who received fees
    uint256 public feePercent;
    address constant ETHER = address(0);
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );
    event Withdraw(
        address _token,
        address _user,
        uint256 _amount,
        uint256 _balance
    );

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    fallback() external {
        revert();
    }

    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount);
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        payable(msg.sender).transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != ETHER); //don't allow ether deposits
        require(
            NToken(_token).transferFrom(msg.sender, address(this), _amount)
        ); //send tokens to this contract
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount); //manage deposit - update balance
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]); //emit event
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender]>= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(NToken(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token,address _user)public view returns(uint256) {
        return tokens[_token][_user];
    }

}

//TODO:
//[x] set the fee account
//[x] deposit tokens
//[x] withdraw tokens
//[x] deposit ether
//[x] withdraw ether
//[] check balances
//[] make order
//[] cancel order
//[] fill order
//[] charge fees
