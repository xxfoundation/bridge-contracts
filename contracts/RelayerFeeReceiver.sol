//SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RelayerFeeReceiver is AccessControl {
    // Events
    event FeePaid(address indexed who, uint64 indexed nonce, uint256 indexed amount);

    // Constants
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Current relayer fee
    uint256 public currentFee;

    // Contract paused
    bool public paused;

    // Constructor
    constructor(uint256 _initFee, address admin, address relayer) {
        currentFee = _initFee;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RELAYER_ROLE, relayer);
    }

    // Modifiers

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // Admin functions

    // Pause the contract
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = true;
    }

    // Unpause the contract
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
    }

    // Admin can update the fee
    // The use case is if the relayer address has to be rotated,
    // the admin can first pause the contract, then set a new fee, new relayer
    // and finally unpause
    function adminSetFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        currentFee = newFee;
    }

    // Add relayer
    function addRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RELAYER_ROLE, relayer);
    }

    // Remove relayer
    function removeRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(RELAYER_ROLE, relayer);
    }

    // Admin can witdhraw the contract balance
    function withdraw(address dest) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = address(this).balance;
        require(amount > 0, "No balance to withdraw");
        payable(dest).transfer(amount);
    }

    // Relayer functions

    // Relayer can update the fee
    function setFee(uint256 newFee) external onlyRole(RELAYER_ROLE) notPaused() {
        currentFee = newFee;
    }

    // Public functions

    // Pay the relayer fee for a given nonce
    function payFee(uint64 nonce) external payable notPaused() {
        require(msg.value == currentFee, "Fee value is not correct");
        emit FeePaid(msg.sender, nonce, currentFee);
    }

    // Reject direct payments to contract iwthout a nonce
    receive() external payable {
        revert("No direct payments allowed");
    }
}
