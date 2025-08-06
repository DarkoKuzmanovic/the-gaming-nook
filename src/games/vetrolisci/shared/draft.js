// Draft phase mechanics for Vetrolisci
// Card dealing is now handled externally before calling initializeDraftPhase

export const DraftPhase = {
  REVEAL: "reveal",
  PICK: "pick",
  COMPLETE: "complete",
};

export function initializeDraftPhase(turnCards, pickOrder) {
  try {
    return {
      phase: DraftPhase.PICK, // Start directly in pick phase for automatic card revealing
      revealedCards: turnCards,
      pickOrder, // Dynamic pick order passed from server
      currentPickIndex: 0,
      remainingDeck: [], // Not used in turn-based dealing
      completedPicks: 0,
    };
  } catch (error) {
    throw new Error(`Failed to initialize draft phase: ${error.message}`);
  }
}

export function getCurrentPickingPlayer(draftState) {
  if (draftState.phase !== DraftPhase.PICK || draftState.currentPickIndex >= draftState.pickOrder.length) {
    return null;
  }

  return draftState.pickOrder[draftState.currentPickIndex];
}

export function canPlayerPick(draftState, playerIndex) {
  const currentPlayer = getCurrentPickingPlayer(draftState);
  return draftState.phase === DraftPhase.PICK && currentPlayer === playerIndex;
}

export function pickCard(draftState, playerIndex, cardId) {
  if (!canPlayerPick(draftState, playerIndex)) {
    throw new Error("It is not this player's turn to pick");
  }

  const cardIndex = draftState.revealedCards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found in revealed cards");
  }

  const selectedCard = draftState.revealedCards[cardIndex];

  // Create new state
  const newDraftState = {
    ...draftState,
    revealedCards: draftState.revealedCards.filter((card) => card.id !== cardId),
    currentPickIndex: draftState.currentPickIndex + 1,
    completedPicks: draftState.completedPicks + 1,
  };

  // Check if draft phase is complete
  if (newDraftState.completedPicks >= 4) {
    newDraftState.phase = DraftPhase.COMPLETE;
  }

  return {
    draftState: newDraftState,
    selectedCard,
    pickingPlayer: playerIndex,
  };
}

export function getDraftPhaseStatus(draftState) {
  const currentPlayer = getCurrentPickingPlayer(draftState);
  const remainingPicks = draftState.pickOrder.length - draftState.currentPickIndex;

  return {
    phase: draftState.phase,
    currentPickingPlayer: currentPlayer,
    remainingPicks,
    cardsRemaining: draftState.revealedCards.length,
    isComplete: draftState.phase === DraftPhase.COMPLETE,
  };
}

export function startPickPhase(draftState) {
  if (draftState.phase !== DraftPhase.REVEAL) {
    throw new Error("Cannot start pick phase: not in reveal phase");
  }

  return {
    ...draftState,
    phase: DraftPhase.PICK,
  };
}

// Get the next cards each player will pick (for UI hints)
export function getUpcomingPickOrder(draftState) {
  const upcoming = [];

  for (let i = draftState.currentPickIndex; i < draftState.pickOrder.length; i++) {
    upcoming.push({
      pickNumber: i + 1,
      playerIndex: draftState.pickOrder[i],
      isCurrent: i === draftState.currentPickIndex,
    });
  }

  return upcoming;
}