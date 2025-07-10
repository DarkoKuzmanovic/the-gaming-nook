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
  breakdown.validatedCards = validatedCards.map(card => ({ number: card.number, color: card.color }))
  
  return validatedCards.reduce((sum, card) => sum + card.number, 0)
}

function calculateSymbolPoints(faceUpCards, breakdown) {
  let spirals = 0
  let crosses = 0
  let specialBonuses = 0
  
  // Count base symbols
  faceUpCards.forEach(card => {
    if (card.hasSpiral) spirals++
    if (card.hasCross) crosses++
  })
  
  // Calculate special card bonuses
  const specialCards = faceUpCards.filter(card => card.isSpecial)
  specialCards.forEach(specialCard => {
    const bonusSpirals = calculateSpecialCardBonus(specialCard, faceUpCards)
    specialBonuses += bonusSpirals
  })
  
  breakdown.spirals = spirals
  breakdown.crosses = crosses
  breakdown.specialBonuses = specialBonuses
  
  return spirals + specialBonuses - crosses
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
  const roundMultiplier = currentRound + 1 // Round 1=2x, Round 2=3x, Round 3=4x
  
  // Convert 1D grid to 2D for easier adjacency checking
  const grid2D = []
  for (let i = 0; i < 3; i++) {
    grid2D[i] = []
    for (let j = 0; j < 3; j++) {
      grid2D[i][j] = grid[i * 3 + j]
    }
  }
  
  const visited = Array(3).fill(null).map(() => Array(3).fill(false))
  const colorZones = []
  
  // Find all color zones using flood fill
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!visited[i][j] && grid2D[i][j] && grid2D[i][j].faceUp) {
        const zone = floodFillColorZone(grid2D, visited, i, j, grid2D[i][j].color)
        if (zone.length >= 2) {
          colorZones.push({
            color: grid2D[i][j].color,
            size: zone.length,
            cards: zone
          })
        }
      }
    }
  }
  
  // Find the largest zone
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
  // Multi-colored cards can join any color zone
  return color1 === color2 || color1 === 'multi' || color2 === 'multi'
}

export function calculateTotalGameScore(player) {
  return player.scores.reduce((sum, score) => sum + score, 0)
}

export function getScoreBreakdown(player, currentRound) {
  if (!player.grid) return null
  
  return calculatePlayerScore(player.grid, currentRound)
}