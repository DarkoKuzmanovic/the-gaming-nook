// Card placement logic according to Pixies/Vetrolisci rules

export const PlacementScenario = {
  EMPTY_OR_FACE_DOWN: 'empty_or_face_down',
  DUPLICATE_NUMBER: 'duplicate_number',
  ALREADY_VALIDATED: 'already_validated'
}

export function determinePlacementScenario(card, grid) {
  const cardValue = card.value
  const targetIndex = cardValue - 1 // Cards 1-9 map to indices 0-8
  
  // Find if there's already a face-up card with this value
  const existingFaceUpCard = grid.find(gridCard => 
    gridCard && gridCard.faceUp && gridCard.value === cardValue
  )
  
  // Check if the value is already validated
  const isValidated = grid.some(gridCard => 
    gridCard && gridCard.faceUp && gridCard.value === cardValue && gridCard.validated
  )
  
  if (isValidated) {
    return PlacementScenario.ALREADY_VALIDATED
  } else if (existingFaceUpCard) {
    return PlacementScenario.DUPLICATE_NUMBER
  } else {
    return PlacementScenario.EMPTY_OR_FACE_DOWN
  }
}

export function getValidPlacementPositions(card, grid) {
  const scenario = determinePlacementScenario(card, grid)
  const targetIndex = card.value - 1
  
  switch (scenario) {
    case PlacementScenario.EMPTY_OR_FACE_DOWN:
      // Can only place on the target space (card number - 1)
      return [{
        index: targetIndex,
        valid: true,
        type: 'primary',
        description: grid[targetIndex] ? 'Place face-up on top' : 'Place face-up'
      }]
    
    case PlacementScenario.DUPLICATE_NUMBER:
      // Can place on target space (triggers choice dialog)
      return [{
        index: targetIndex,
        valid: true,
        type: 'primary',
        description: 'Choose which card to keep face-up'
      }]
    
    case PlacementScenario.ALREADY_VALIDATED:
      // Can place face-down on any empty space
      return grid.map((gridCard, index) => ({
        index,
        valid: gridCard === null,
        type: 'secondary',
        description: 'Place face-down'
      })).filter(pos => pos.valid)
    
    default:
      return []
  }
}

export function executeCardPlacement(card, targetIndex, grid, chosenCard = null) {
  const scenario = determinePlacementScenario(card, grid)
  const newGrid = [...grid]
  const targetPos = card.value - 1
  
  switch (scenario) {
    case PlacementScenario.EMPTY_OR_FACE_DOWN:
      if (targetIndex !== targetPos) {
        throw new Error('Invalid placement: must place on target space')
      }
      
      const existingCard = newGrid[targetPos]
      const newCard = {
        ...card,
        faceUp: true,
        validated: existingCard !== null, // Validated if placed on top of face-down card
        stackedCard: existingCard // Keep reference to card underneath
      }
      
      newGrid[targetPos] = newCard
      return { grid: newGrid, validated: newCard.validated }
    
    case PlacementScenario.DUPLICATE_NUMBER:
      if (targetIndex !== targetPos) {
        throw new Error('Invalid placement: must place on target space')
      }
      
      if (!chosenCard) {
        throw new Error('Must specify which card to keep face-up')
      }
      
      const existingFaceUpCard = newGrid[targetPos]
      let faceUpCard, stackedFaceDownCard
      
      if (chosenCard === 'new') {
        faceUpCard = { ...card, faceUp: true, validated: true }
        stackedFaceDownCard = { ...existingFaceUpCard, faceUp: false }
      } else {
        faceUpCard = { ...existingFaceUpCard, validated: true }
        stackedFaceDownCard = { ...card, faceUp: false }
      }
      
      faceUpCard.stackedCard = stackedFaceDownCard
      newGrid[targetPos] = faceUpCard
      
      return { grid: newGrid, validated: true }
    
    case PlacementScenario.ALREADY_VALIDATED:
      if (newGrid[targetIndex] !== null) {
        throw new Error('Invalid placement: space is occupied')
      }
      
      const newFaceDownCard = {
        ...card,
        faceUp: false,
        validated: false,
        stackedCard: null
      }
      
      newGrid[targetIndex] = newFaceDownCard
      return { grid: newGrid, validated: false }
    
    default:
      throw new Error('Unknown placement scenario')
  }
}

export function canValidateCard(card, position, grid) {
  // A face-down card can be validated if another card with matching space number is placed on top
  if (!card || card.faceUp) return false
  
  const spaceNumber = position + 1 // Position 0 = space 1, etc.
  return true // Any card can potentially be validated by placing matching space number on top
}

export function validateCard(cardToPlace, targetIndex, grid) {
  const spaceNumber = targetIndex + 1
  
  if (cardToPlace.value !== spaceNumber) {
    throw new Error('Card value must match space value for validation')
  }
  
  const existingCard = grid[targetIndex]
  if (!existingCard || existingCard.faceUp) {
    throw new Error('Can only validate face-down cards')
  }
  
  const newGrid = [...grid]
  const validatedCard = {
    ...cardToPlace,
    faceUp: true,
    validated: true,
    stackedCard: existingCard
  }
  
  newGrid[targetIndex] = validatedCard
  return { grid: newGrid, validated: true }
}



// Check if a player already has a validated card with the given number
export function hasValidatedCardWithNumber(grid, cardNumber) {
  return grid.some(gridCard => 
    gridCard && gridCard.faceUp && gridCard.value === cardNumber && gridCard.validated
  )
}

// Check if a player can pick a card based on validation rules
export function canPickCard(card, grid, revealedCards) {
  // If player doesn't have this number validated, they can pick it
  if (!hasValidatedCardWithNumber(grid, card.value)) {
    return { canPick: true, reason: null }
  }
  
  // Player has this number validated - check if all revealed cards would violate the rule
  const allCardsWouldViolate = revealedCards.every(revealedCard => 
    hasValidatedCardWithNumber(grid, revealedCard.value)
  )
  
  if (allCardsWouldViolate) {
    return { canPick: true, reason: 'all_cards_validated' }
  }
  
  return { canPick: false, reason: 'already_validated' }
}

// Get pickable cards from revealed cards based on validation rules
export function getPickableCards(grid, revealedCards) {
  return revealedCards.map(card => ({
    ...card,
    pickable: canPickCard(card, grid, revealedCards)
  }))
}