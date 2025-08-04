// Card validation mechanics for Vetrolisci

export function validateCards(grid) {
  const newGrid = [...grid];
  let validatedCount = 0;

  // Check each position for potential validation
  for (let i = 0; i < 9; i++) {
    const card = newGrid[i];
    const requiredValue = i + 1; // Position 0 needs value 1, position 1 needs value 2, etc.

    if (card && card.faceUp && card.value === requiredValue && !card.validated) {
      // Check if there's a face-down card underneath to validate
      if (card.stackedCard) {
        newGrid[i] = { ...card, validated: true };
        validatedCount++;
      } else {
        // Face-up card in correct position is automatically validated
        newGrid[i] = { ...card, validated: true };
        validatedCount++;
      }
    }
  }

  return { grid: newGrid, validatedCount };
}

export function canValidatePosition(position, grid) {
  const requiredValue = position + 1;
  const card = grid[position];
  
  return card && 
         card.faceUp && 
         card.value === requiredValue && 
         !card.validated;
}

export function getValidationStatus(grid) {
  const positions = [];
  
  for (let i = 0; i < 9; i++) {
    const card = grid[i];
    const requiredValue = i + 1;
    
    positions.push({
      position: i,
      requiredValue,
      hasCard: card !== null,
      cardValue: card?.value || null,
      isFaceUp: card?.faceUp || false,
      isValidated: card?.validated || false,
      canValidate: canValidatePosition(i, grid),
      hasStack: card?.stackedCard !== null
    });
  }
  
  return positions;
}

export function checkRoundEndConditions(grid) {
  const validationStatus = getValidationStatus(grid);
  const validatedCards = validationStatus.filter(pos => pos.isValidated);
  const totalCards = validationStatus.filter(pos => pos.hasCard);
  
  return {
    validatedCount: validatedCards.length,
    totalCards: totalCards.length,
    canEndRound: validatedCards.length >= 3, // Need at least 3 validated cards
    allPositionsFilled: totalCards.length === 9
  };
}

// Special card effects for validation
export function applySpecialCardEffects(card, grid, position) {
  if (!card.special) {
    return { grid, bonusPoints: 0 };
  }

  const newGrid = [...grid];
  let bonusPoints = 0;

  // Special cards add bonus spirals when validated
  if (card.validated) {
    // Count adjacent validated cards for bonus calculation
    const adjacentPositions = getAdjacentPositions(position);
    const validatedAdjacent = adjacentPositions.filter(pos => {
      const adjacentCard = newGrid[pos];
      return adjacentCard && adjacentCard.validated;
    });

    bonusPoints = validatedAdjacent.length; // 1 bonus point per adjacent validated card
  }

  return { grid: newGrid, bonusPoints };
}

function getAdjacentPositions(position) {
  const row = Math.floor(position / 3);
  const col = position % 3;
  const adjacent = [];

  // Check all 8 directions (including diagonals)
  for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
    for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
      if (deltaRow === 0 && deltaCol === 0) continue; // Skip self
      
      const newRow = row + deltaRow;
      const newCol = col + deltaCol;
      
      if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
        adjacent.push(newRow * 3 + newCol);
      }
    }
  }

  return adjacent;
}