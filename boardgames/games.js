// boardgames/games.js
// ============================================================
//  Agregá o quitá juegos de mesa acá
//
//  id:          identificador único (sin espacios ni caracteres especiales)
//  name:        nombre que aparece en pantalla
//  icon:        emoji del juego
//  url:         link a la página del juego (scores.html por defecto)
//  description: descripción corta del juego (1-2 frases)
//  rules:       array de strings, cada uno es una regla o paso
// ============================================================

export const GAMES = [
    {
        id: "ejemplo",
        name: "Ejemplo de juego",
        icon: "🎲",
        url: "scores.html",
        description: "Un juego de ejemplo para probar la app.",
        rules: [
            "Regla 1: explicá el objetivo del juego.",
            "Regla 2: explicá cómo se juega.",
            "Regla 3: explicá cómo se ganan puntos.",
            "Regla 4: explicá cómo se gana la partida.",
        ],
    },

    // Para añadir más juegos, copiá este bloque:
    // {
    //   id:          "uno",
    //   name:        "UNO",
    //   icon:        "🃏",
    //   url:         "scores.html",
    //   description: "El clásico juego de cartas. El primero en quedarse sin cartas gana.",
    //   rules: [
    //     "Cada jugador empieza con 7 cartas.",
    //     "En tu turno debés jugar una carta del mismo color o número.",
    //     "Si no podés jugar, robá una carta del mazo.",
    //     "Cuando te queda una carta, gritá UNO.",
    //     "El primero en quedarse sin cartas gana la ronda.",
    //     "Puntos: cada carta vale su número, las especiales valen 20 pts.",
    //   ],
    // },
];