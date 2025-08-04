// Scoring system for Vetrolisci/Pixies game

export function calculatePlayerScore(grid, currentRound) {
  
  const score = {
    validatedNumbers: 0,
    symbols: 0,
    colorZone: 0,
    breakdown: {
      validatedCards: [],
      spirals: 0,
      crosses: 0,
      specialBonuses: 0,
      largestZone: { color: null, size: 0, points: 0 }
    }
  }

  // Get all face-up cards
  const faceUpCards = grid.filter(card => card && card.faceUp)
  
  // 8.1 Validated Card Numbers
  score.validatedNumbers = calculateValidatedNumbers(faceUpCards, score.breakdown)
  
  // 8.2 Symbol Points
  score.symbols = calculateSymbolPoints(faceUpCards, score.breakdown)
  
  // 8.3 Largest Color Zone Bonus
  score.colorZone = calculateColorZoneBonus(grid, currentRound, score.breakdown)
  
  return {
    total: score.validatedNumbers + score.symbols + score.colorZone,
    ...score
  }
}

function calculateValidatedNumbers(faceUpCards, breakdown) {
  const validatedCards = faceUpCards.filter(card => card.validated)
  breakdown.validatedCards = validatedCards.map(card => ({ value: card.value, color: card.color }))
  
  return validatedCards.reduce((sum, card) => sum + card.value, 0)
}

function calculateSymbolPoints(faceUpCards, breakdown) {
  let totalPoints = 0
  let specialBonuses = 0
  
  // Count scoring points from ALL face-up cards (not just validated ones)
  faceUpCards.forEach(card => {
    totalPoints += card.scoring || 0
  })
  
  // Calculate special card bonuses from ALL face-up special cards
  const specialCards = faceUpCards.filter(card => card.special)
  specialCards.forEach(specialCard => {
    const bonusSpirals = calculateSpecialCardBonus(specialCard, faceUpCards)
    specialBonuses += bonusSpirals
  })
  
  breakdown.spirals = faceUpCards.filter(card => (card.scoring > 0)).reduce((sum, card) => sum + card.scoring, 0)
  breakdown.crosses = Math.abs(faceUpCards.filter(card => (card.scoring < 0)).reduce((sum, card) => sum + card.scoring, 0))
  breakdown.specialBonuses = specialBonuses
  
  return totalPoints + specialBonuses
}

function calculateSpecialCardBonus(specialCard, faceUpCards) {
  // Special cards gain +1 spiral for each OTHER face-up card of the indicated color
  const otherCards = faceUpCards.filter(card => card !== specialCard)
  
  if (specialCard.color === 'multi') {
    // Multi-colored cards count for all colors
    return otherCards.length
  } else {
    // Count cards of the same color, plus multi-colored cards
    return otherCards.filter(card => 
      card.color === specialCard.color || card.color === 'multi'
    ).length
  }
}

function calculateColorZoneBonus(grid, currentRound, breakdown) {
  const roundMultiplier = currentRound + 2 // Round 0=2x, Round 1=3x, Round 2=4x (0-based rounds)
  
  // Convert 1D grid to 2D for easier adjacency checking
  const grid2D = []
  for (let i = 0; i < 3; i++) {
    grid2D[i] = []
    for (let j = 0; j < 3; j++) {
      grid2D[i][j] = grid[i * 3 + j]
    }
  }
  
  // Step 1: Create a modified grid where each multi card takes on the color of its best adjacent card
  const resolvedGrid2D = JSON.parse(JSON.stringify(grid2D)) // Deep copy
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const card = resolvedGrid2D[i][j]
      if (card && card.faceUp && card.color === 'multi') {
        // Find the best adjacent color for this multi card
        const adjacentColors = new Map()
        const adjacentPositions = getAdjacentPositions(i, j)
        
        adjacentPositions.forEach(([adjI, adjJ]) => {
          if (adjI >= 0 && adjI < 3 && adjJ >= 0 && adjJ < 3) {
            const adjCard = grid2D[adjI][adjJ]
            if (adjCard && adjCard.faceUp && adjCard.color !== 'multi') {
              const color = adjCard.color
              adjacentColors.set(color, (adjacentColors.get(color) || 0) + 1)
            }
          }
        })
        
        // Choose the color with the most adjacent cards (ties broken alphabetically for consistency)
        if (adjacentColors.size > 0) {
          let bestColor = null
          let bestCount = 0
          
          for (const [color, count] of adjacentColors) {
            if (count > bestCount || (count === bestCount && (!bestColor || color < bestColor))) {
              bestCount = count
              bestColor = color
            }
          }
          
          // Update the resolved grid
          resolvedGrid2D[i][j] = { ...card, color: bestColor }
        }
      }
    }
  }
  
  // Step 2: Calculate zones using the resolved grid (now with multi cards assigned to colors)
  const visited = Array(3).fill(null).map(() => Array(3).fill(false))
  const colorZones = []
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!visited[i][j] && resolvedGrid2D[i][j] && resolvedGrid2D[i][j].faceUp) {
        const zone = floodFillResolvedColorZone(resolvedGrid2D, visited, i, j, resolvedGrid2D[i][j].color)
        if (zone.length >= 2) { // Only count zones with 2+ cards
          colorZones.push({
            color: resolvedGrid2D[i][j].color,
            size: zone.length,
            cards: zone
          })
        }
      }
    }
  }
  
  // Step 3: Find the largest zone
  const largestZone = colorZones.reduce((largest, zone) => {
    return zone.size > largest.size ? zone : largest
  }, { color: null, size: 0, cards: [] })
  
  const zonePoints = largestZone.size * roundMultiplier
  
  breakdown.largestZone = {
    color: largestZone.color,
    size: largestZone.size,
    points: zonePoints,
    multiplier: roundMultiplier
  }
  
  return zonePoints
}

function getAdjacentPositions(i, j) {
  return [
    [i - 1, j], // up
    [i + 1, j], // down
    [i, j - 1], // left
    [i, j + 1]  // right
  ]
}

function floodFillResolvedColorZone(grid2D, visited, startI, startJ, targetColor) {
  const zone = []
  const stack = [{ i: startI, j: startJ }]
  
  while (stack.length > 0) {
    const { i, j } = stack.pop()
    
    if (i < 0 || i >= 3 || j < 0 || j >= 3 || visited[i][j]) {
      continue
    }
    
    const card = grid2D[i][j]
    if (!card || !card.faceUp || card.color !== targetColor) {
      continue
    }
    
    visited[i][j] = true
    zone.push({ i, j, card })
    
    // Add adjacent cells (orthogonally adjacent only)
    const adjacentPositions = getAdjacentPositions(i, j)
    adjacentPositions.forEach(([adjI, adjJ]) => {
      stack.push({ i: adjI, j: adjJ })
    })
  }
  
  return zone
}

function floodFillPureColorZone(grid2D, visited, startI, startJ, targetColor) {
  const zone = []
  const stack = [{ i: startI, j: startJ }]
  
  while (stack.length > 0) {
    const { i, j } = stack.pop()
    
    if (i < 0 || i >= 3 || j < 0 || j >= 3 || visited[i][j]) {
      continue
    }
    
    const card = grid2D[i][j]
    if (!card || !card.faceUp || card.color !== targetColor) {
      continue
    }
    
    visited[i][j] = true
    zone.push({ i, j, card })
    
    // Add adjacent cells (orthogonally adjacent only)
    const adjacentPositions = getAdjacentPositions(i, j)
    adjacentPositions.forEach(([adjI, adjJ]) => {
      stack.push({ i: adjI, j: adjJ })
    })
  }
  
  return zone
}

function floodFillColorZone(grid2D, visited, startI, startJ, targetColor) {
  const zone = []
  const stack = [{ i: startI, j: startJ }]
  
  while (stack.length > 0) {
    const { i, j } = stack.pop()
    
    if (i < 0 || i >= 3 || j < 0 || j >= 3 || visited[i][j]) {
      continue
    }
    
    const card = grid2D[i][j]
    if (!card || !card.faceUp) {
      continue
    }
    
    // Check if colors match (including multi-colored cards)
    if (!colorsMatch(card.color, targetColor)) {
      continue
    }
    
    visited[i][j] = true
    zone.push({ i, j, card })
    
    // Add adjacent cells (orthogonally adjacent only)
    stack.push({ i: i - 1, j }) // up
    stack.push({ i: i + 1, j }) // down
    stack.push({ i, j: j - 1 }) // left
    stack.push({ i, j: j + 1 }) // right
  }
  
  return zone
}

function colorsMatch(color1, color2) {
  // This function is now unused - keeping for backward compatibility
  return color1 === color2
}

export function calculateTotalGameScore(player) {
  return player.scores.reduce((sum, score) => sum + score, 0)
}

export function getScoreBreakdown(player, currentRound) {
  if (!player.grid) return null
  
  return calculatePlayerScore(player.grid, currentRound - 1) // Fix: use 0-based round index
}