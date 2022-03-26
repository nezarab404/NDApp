// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract NToken {
    using SafeMath for uint256;

    string public name = "Nezz Token";
    string public symbol = "Nezz";
    uint256 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from,address indexed to,uint256 value);

    constructor() public {
        totalSupply = 1000000 * (10**decimals); //the total supply is
        balanceOf[msg.sender] = totalSupply; //the one has created of the token have all of it's
        // the sender is the one how deploy the contract
    }

    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        require(_to != address(0));
        require(balanceOf[msg.sender] >= _value);
        balanceOf[msg.sender] = balanceOf[msg.sender].sub(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
}

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

    //  function sub(
    //     uint256 a,
    //     uint256 b,
    //     string memory errorMessage
    // ) internal pure returns (uint256) {
    //     unchecked {
    //         require(b <= a, errorMessage);
    //         return a - b;
    //     }
    // }
}
