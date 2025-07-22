// Draft phase mechanics for Vetrolisci
import { dealRoundCards } from '../data/cards.js'

export const DraftPhase = {
  REVEAL: 'reveal',
  PICK: 'pick', 
  COMPLETE: 'complete'
}

export function initializeDraftPhase(deck, roundNumber) {
  try {
    const { roundCards, remainingDeck } = dealRoundCards(deck, roundNumber)
    
    // Determine pick order based on round: whoever finished last round starts next
    // Round 1: P1>P2>P2>P1, Round 2: P2>P1>P1>P2, Round 3: P1>P2>P2>P1
    const pickOrder = roundNumber % 2 === 1 ? [0, 1, 1, 0] : [1, 0, 0, 1]
    
    return {
      phase: DraftPhase.REVEAL,
      revealedCards: roundCards,
      playerHands: [[], []], // Each player's selected cards
      pickOrder, // Alternating pick order based on round
      currentPickIndex: 0,
      remainingDeck,
      completedPicks: 0
    }
  } catch (error) {
    throw new Error(`Failed to initialize draft phase: ${error.message}`)
  }
}

export function getCurrentPickingPlayer(draftState) {
  if (draftState.phase !== DraftPhase.PICK || draftState.currentPickIndex >= draftState.pickOrder.length) {
    return null
  }
  
  return draftState.pickOrder[draftState.currentPickIndex]
}

export function canPlayerPick(draftState, playerIndex) {
  const currentPlayer = getCurrentPickingPlayer(draftState)
  return draftState.phase === DraftPhase.PICK && currentPlayer === playerIndex
}

export function pickCard(draftState, playerIndex, cardId) {
  if (!canPlayerPick(draftState, playerIndex)) {
    throw new Error('It is not this player\'s turn to pick')
  }

  const cardIndex = draftState.revealedCards.findIndex(card => card.id === cardId)
  if (cardIndex === -1) {
    throw new Error('Card not found in revealed cards')
  }

  const selectedCard = draftState.revealedCards[cardIndex]
  
  // Create new state
  const newDraftState = {
    ...draftState,
    revealedCards: draftState.revealedCards.filter(card => card.id !== cardId),
    playerHands: draftState.playerHands.map((hand, index) => 
      index === playerIndex ? [...hand, selectedCard] : hand
    ),
    currentPickIndex: draftState.currentPickIndex + 1,
    completedPicks: draftState.completedPicks + 1
  }

  // Check if draft phase is complete
  if (newDraftState.completedPicks >= 4) {
    newDraftState.phase = DraftPhase.COMPLETE
  }

  return {
    draftState: newDraftState,
    selectedCard,
    pickingPlayer: playerIndex
  }
}

export function getDraftPhaseStatus(draftState) {
  const currentPlayer = getCurrentPickingPlayer(draftState)
  const remainingPicks = draftState.pickOrder.length - draftState.currentPickIndex
  
  return {
    phase: draftState.phase,
    currentPickingPlayer: currentPlayer,
    remainingPicks,
    cardsRemaining: draftState.revealedCards.length,
    playerHands: draftState.playerHands,
    isComplete: draftState.phase === DraftPhase.COMPLETE
  }
}

export function startPickPhase(draftState) {
  if (draftState.phase !== DraftPhase.REVEAL) {
    throw new Error('Cannot start pick phase: not in reveal phase')
  }

  return {
    ...draftState,
    phase: DraftPhase.PICK
  }
}

// Get the next cards each player will pick (for UI hints)
export function getUpcomingPickOrder(draftState) {
  const upcoming = []
  
  for (let i = draftState.currentPickIndex; i < draftState.pickOrder.length; i++) {
    upcoming.push({
      pickNumber: i + 1,
      playerIndex: draftState.pickOrder[i],
      isCurrent: i === draftState.currentPickIndex
    })
  }
  
  return upcoming
}