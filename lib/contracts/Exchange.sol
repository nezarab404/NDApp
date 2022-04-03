// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./NToken.sol";

contract Exchange {
    using SafeMath for uint256;

    address public feeAccount; //the account who received fees
    uint256 public feePercent;
    address constant ETHER = address(0);
    uint256 public _orderCount;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public canceldOrders;
    mapping(uint256 => bool) public filledOrders;

    struct _Order {
        uint256 id;
        address user; //the person who made the order
        address tokenGet; //the address of the token they want to purchase
        uint256 amountGet; //the amount of the token they want to purchase
        address tokenGive; //the token they gonna use in the treat
        uint256 amountGive; //the amount they gonna give
        uint256 timestamp;
    }

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
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
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
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(NToken(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        _orderCount = _orderCount.add(1);
        orders[_orderCount] = _Order(
            _orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        emit Order(
            _orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        require(_order.id == _id);
        canceldOrders[_id] = true;
        emit Cancel(
            _id,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            _order.timestamp
        );
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= _orderCount);
        require(!filledOrders[_id]);
        require(!canceldOrders[_id]);
        _Order storage _order = orders[_id];
        _trade(_order);
        filledOrders[_id] = true;
    }

    function _trade(_Order storage _order) internal {
        ///Fee paid by the user that fills the order, a.k.a [msg.sender]
        // Fee deducted from _amountGet
        uint256 _feeAmount = _order.amountGive.mul(feePercent).div(100);

        //execute trade
        tokens[_order.tokenGet][msg.sender] = tokens[_order.tokenGet][
            msg.sender
        ].sub(_order.amountGet.add(_feeAmount));
        tokens[_order.tokenGet][_order.user] = tokens[_order.tokenGet][
            _order.user
        ].add(_order.amountGet);
        tokens[_order.tokenGet][feeAccount] = tokens[_order.tokenGet][
            feeAccount
        ].add(_feeAmount);
        tokens[_order.tokenGive][_order.user] = tokens[_order.tokenGive][
            _order.user
        ].sub(_order.amountGive);
        tokens[_order.tokenGive][msg.sender] = tokens[_order.tokenGive][
            msg.sender
        ].add(_order.amountGive);

        emit Trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            msg.sender,
            block.timestamp
        );
    }
}
