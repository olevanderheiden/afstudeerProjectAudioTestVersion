# Audio Tour Project

Dit project gebruikt **WordPress** als backend (voor contentbeheer) en **React (Vite)** als frontend.

## Structuur

```
afstudeerProject/
├── backEnd/   # WordPress backend (PHP/MySQL, niet voor GitHub Pages)
└── frontEndAudioTour/    # React frontend (kan op GitHub Pages worden geplaatst)
```

## Ontwikkeling

- **WordPress**: Draai lokaal met Laragon/andere locale server of plaats op een PHP/MySQL host.
- **React FrontEnd**:
  - Ontwikkel met `npm run dev` in de `FrontEnd` map.
  - Bouw voor productie met `npm run host`. Dit zet het ook op github pages

## Opmerkingen

- De frontend haalt content op via de WordPress REST API.
- WordPress kan niet op GitHub Pages worden gehost; alleen de statische frontend kan dat.
