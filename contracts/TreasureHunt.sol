// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TreasureHunt {
    uint8 public constant GRID_SIZE = 10;
    uint8 public constant TOTAL_POSITIONS = GRID_SIZE * GRID_SIZE;

    address public owner;
    uint8 public treasurePosition;
    mapping(address => uint8) public playerPositions;
    bool public gameEnded;

    event MoveMade(address indexed player, uint8 newPosition);
    event TreasureMoved(uint8 newTreasurePosition);
    event Winner(address indexed winner, uint256 prize);

    constructor() {
        owner = msg.sender;
        treasurePosition = uint8(uint256(keccak256(abi.encodePacked(block.number))) % TOTAL_POSITIONS);
    }

    function move(uint8 newPosition) external payable {
        require(!gameEnded, "Game has ended");
        require(newPosition < TOTAL_POSITIONS, "Invalid position");
        require(msg.value > 0, "ETH required to move");

        uint8 playerPosition = playerPositions[msg.sender];

        // Special cases: multiple of 5 or prime number
        bool specialMove = false;

        if (newPosition % 5 == 0) {
            // Move the treasure to a random adjacent position
            treasurePosition = getRandomAdjacentPosition(treasurePosition);
            specialMove = true;
        }

        if (isPrime(newPosition)) {
            // Move the treasure to a random position
            treasurePosition = getRandomPosition();
            specialMove = true;
        }

        if (!specialMove) {
            // Only check adjacency if it's not a special move
            require(isAdjacent(playerPosition, newPosition), "Can only move to adjacent positions");
        }

        playerPositions[msg.sender] = newPosition;
        emit MoveMade(msg.sender, newPosition);

        // Check for win condition
        if (newPosition == treasurePosition) {
            gameEnded = true;
            uint256 prize = (address(this).balance * 90) / 100;
            payable(msg.sender).transfer(prize);
            emit Winner(msg.sender, prize);
        }
    }

    function isAdjacent(uint8 position1, uint8 position2) internal pure returns (bool) {
        // Calculate the row and column for each position
        uint8 row1 = position1 / GRID_SIZE;
        uint8 col1 = position1 % GRID_SIZE;
        uint8 row2 = position2 / GRID_SIZE;
        uint8 col2 = position2 % GRID_SIZE;

        // Check if the positions are adjacent
        if (
            (row1 == row2 && (col1 == col2 + 1 || col1 + 1 == col2)) ||
            (col1 == col2 && (row1 == row2 + 1 || row1 + 1 == row2))
        ) {
            return true;
        }

        return false;
    }

    function isPrime(uint8 number) internal pure returns (bool) {
        if (number <= 1) return false;
        if (number == 2 || number == 3) return true;
        if (number % 2 == 0 || number % 3 == 0) return false;
        for (uint8 i = 5; i * i <= number; i += 6) {
            if (number % i == 0 || number % (i + 2) == 0) return false;
        }
        return true;
    }

    function getRandomPosition() internal view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % TOTAL_POSITIONS);
    }

    function getRandomAdjacentPosition(uint8 position) internal view returns (uint8) {
        uint8[4] memory adjacents;
        uint8 count = 0;

        if (position % GRID_SIZE != 0) adjacents[count++] = position - 1; // left
        if (position % GRID_SIZE != GRID_SIZE - 1) adjacents[count++] = position + 1; // right
        if (position / GRID_SIZE != 0) adjacents[count++] = position - GRID_SIZE; // up
        if (position / GRID_SIZE != GRID_SIZE - 1) adjacents[count++] = position + GRID_SIZE; // down

        return adjacents[uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % count)];
    }
}
