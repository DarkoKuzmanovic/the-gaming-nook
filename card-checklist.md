# Vetrolisci Card Creation Checklist

## **Card Asset Specifications**
- **Format**: PNG with transparency
- **Size**: 280x400 pixels (2:3 aspect ratio)
- **Location**: `public/cards/fronts/` and `public/cards/backs/`
- **Naming**: `{color}-{number}-{symbols}.png`

## **Symbols Legend**
- 🌀 = Spiral (+1 point)
- ✖️ = Cross (-1 point)  
- ⭐ = Special Card (bonus spirals)

---

## **Card Back (1 card)**
- [ ] `card-back.png` - Generic card back design

---

## **Blue Cards (10 cards)**
- [ ] `blue-1.png` - Blue 1 (scoring: 6)
- [ ] `blue-2.png` - Blue 2 (scoring: 4)
- [ ] `blue-3.png` - Blue 3 (scoring: 0)
- [ ] `blue-3-alt.png` - Blue 3 (scoring: 1)
- [ ] `blue-4-special.png` - Blue 4 Special Card (scoring: 1)
- [ ] `blue-4-alt.png` - Blue 4 (scoring: 0)
- [ ] `blue-5-special.png` - Blue 5 Special Card (scoring: 1)
- [ ] `blue-5-alt.png` - Blue 5 (scoring: 0, -2)
- [ ] `blue-6.png` - Blue 6 (scoring: 1, -1)
- [ ] `blue-7.png` - Blue 7 (scoring: -3)
- [ ] `blue-8.png` - Blue 8 (scoring: -3)
- [ ] `blue-9.png` - Blue 9 (scoring: -6, -1)

---

## **Green Cards (10 cards)**
- [ ] `green-1.png` - Green 1 (scoring: 5)
- [ ] `green-2.png` - Green 2 (scoring: 3)
- [ ] `green-3-special.png` - Green 3 Special Card (scoring: 2)
- [ ] `green-4.png` - Green 4 (scoring: 4, -1)
- [ ] `green-5-special.png` - Green 5 Special Card (scoring: 1)
- [ ] `green-5-alt.png` - Green 5 (scoring: -1, 0)
- [ ] `green-6.png` - Green 6 (scoring: -1, 1, -4)
- [ ] `green-7.png` - Green 7 (scoring: -2, 0)
- [ ] `green-8.png` - Green 8 (scoring: -2)
- [ ] `green-9.png` - Green 9 (scoring: -4)

---

## **Yellow Cards (11 cards)**
- [ ] `yellow-1.png` - Yellow 1 (scoring: 4)
- [ ] `yellow-2-special.png` - Yellow 2 Special Card (scoring: 1)
- [ ] `yellow-2-alt.png` - Yellow 2 (scoring: 2)
- [ ] `yellow-3.png` - Yellow 3 (scoring: 5, 0)
- [ ] `yellow-4.png` - Yellow 4 (scoring: -1, 3)
- [ ] `yellow-5-special.png` - Yellow 5 Special Card (scoring: 1)
- [ ] `yellow-5-alt.png` - Yellow 5 (scoring: 0, -2)
- [ ] `yellow-6.png` - Yellow 6 (scoring: 0, -3)
- [ ] `yellow-7.png` - Yellow 7 (scoring: 1, -5)
- [ ] `yellow-8.png` - Yellow 8 (scoring: -1)
- [ ] `yellow-9.png` - Yellow 9 (scoring: -2)

---

## **Red Cards (13 cards)**
- [ ] `red-1-special.png` - Red 1 Special Card (scoring: 1)
- [ ] `red-1-alt.png` - Red 1 (scoring: 3)
- [ ] `red-2.png` - Red 2 (scoring: 5)
- [ ] `red-3.png` - Red 3 (scoring: 4)
- [ ] `red-4.png` - Red 4 (scoring: 2, 0)
- [ ] `red-5-special.png` - Red 5 Special Card (scoring: 1)
- [ ] `red-5-alt.png` - Red 5 (scoring: -1, 0)
- [ ] `red-6.png` - Red 6 (scoring: -2, 0)
- [ ] `red-7.png` - Red 7 (scoring: -4, -1)
- [ ] `red-8.png` - Red 8 (scoring: 0, -5)
- [ ] `red-9.png` - Red 9 (scoring: 0)

---

## **Multi-colored Cards (6 cards)**
- [ ] `multi-2.png` - Multi 2 (scoring: 0)
- [ ] `multi-3.png` - Multi 3 (scoring: 0)
- [ ] `multi-4.png` - Multi 4 (scoring: 0)
- [ ] `multi-6.png` - Multi 6 (scoring: -1)
- [ ] `multi-7.png` - Multi 7 (scoring: -1)
- [ ] `multi-8.png` - Multi 8 (scoring: -1)

---

## **Summary**
- **Total Cards**: 70 cards
- **Blue Cards**: 10 cards
- **Green Cards**: 10 cards  
- **Yellow Cards**: 11 cards
- **Red Cards**: 13 cards
- **Multi-colored Cards**: 6 cards
- **Special Cards**: 9 cards (marked with "yes" in CSV)
- **Card Back**: 1 card

## **Design Notes**
- **Special Cards** should have a distinctive star (⭐) or similar indicator
- **Multi-colored cards** should use gradient or multiple color sections
- **Scoring values** shown in parentheses indicate the card's point value
- **Numbers** should be prominent and readable
- **Color themes** should be distinct but harmonious
- Cards with multiple scoring values represent different instances of the same number/color combination

## **File Organization**
```
public/cards/
├── backs/
│   └── card-back.png
└── fronts/
    ├── blue-1.png
    ├── blue-2-spiral.png
    ├── ... (all 70 cards)
```

**Total Assets Needed: 71 files (1 back + 70 fronts)**

## **Card Distribution Notes**
- Some numbers appear multiple times with different scoring values (e.g., Blue 3 appears twice with scores 0 and 1)
- This represents different card instances with the same number/color but different effects
- Special cards are indicated in the CSV with "yes" in the Special column