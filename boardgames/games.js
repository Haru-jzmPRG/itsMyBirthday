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
        id: "1",
        name: "BIBLIOTECARIOS GRITONES",
        icon: "📚",
        url: "scores.html",
        description: "No se vale cambiar las Z’s por las S’s ni quitar las H’s de las palabras. Consigue la mayor cantidad de puntos gracias a tu vocabulario! ",
        rules: [
            "Divididos en dos equipos entre todas las personas que participen, cada equipo tendrá un turno para conseguir la mayor cantidad de palabras en 1 minuto, durante 5 rondas.",

            "Tendrás dos tipos de cartas, las de LETRAS que se irán descartando a medida que vayan gritando palabras, y las de CATEGORÍA que dictará el tema de cada ronda. OJO! Con las letras en  DORADO, cuando grites una palabra con esa letra CAMBIAS LA CATEGORÍA DE LA RONDA.",

            "OBJETIVO: Cada carta vale 1 PUNTO, consigue la mayor cantidad de cartas en un minuto!",
        ]
    },
    {
        id: "2",
        name: "MENTE VACUNA ",
        icon: "🐮",
        url: "scores.html",
        description: "¡Sigue al Rebaño! En este juego, pensar diferente es un error. No busques la respuesta correcta, busca la respuesta que daría todo el mundo. Si todos dicen 'Pizza' y tú dices 'Sushi', ¡te quedas fuera!",
        rules: [
            "Puntos (Vacas): Si tu respuesta es la que más gente ha escrito, ¡ganas una ficha de vaca! 🐄",
            "El Castigo (La Vaca Rosa): Si tu respuesta es la única diferente a todas las demás, te llevas la Vaca Rosa de plástico. Mientras la tengas, no puedes ganar, ¡aunque tengas mil puntos! Te la quitas de encima solo cuando otra persona sea la \"rara\" en otra ronda.",
            "El Ganador: El primero en reunir 8 fichas de vaca (y que no tenga la vaca rosa a su lado) se corona como el Rey o Reina del Rebaño."
        ]
    },
    {
        id: "3",
        name: "¿POR QUÉ ERES ASÍ?",
        icon: "🤔",
        url: "scores.html",
        description: "Es un juego de adivinar palabras, pero con un giro cruel: el juego te obliga a hacer el ridículo mientras lo intentas. Olvida las mímicas normales; aquí vas a terminar preguntándote seriamente por qué tus amigos (o tú) aceptaron jugar a esto.",
        rules: [
            "Divide y vencerás: Se arman dos equipos.",
            "Elige tu número: Se elige un número del 1 al 4. Esa será la palabra que todos deberán adivinar de cada carta de \"Palabra Secreta\".",
            "Tres asaltos: El juego dura exactamente 3 rondas, y en cada una el nivel de vergüenza sube.",
            "🎲 Cómo se juega (El Caos)",
            "En cada ronda, se saca una Carta de Reto. Esta carta dicta cómo debes dar las pistas. No es solo \"actuar\", es hacerlo bajo condiciones absurdas. Por ejemplo:",
            "El Reto: \"Debes explicar la palabra...\"",
            "El Giro: \"...mientras mantienes los codos pegados a las costillas y saltas como un conejo\".",
            "El \"capitán\" del equipo intenta que sus compañeros adivinen la mayor cantidad de cartas posibles antes de que se acabe el tiempo. Luego, le toca al otro equipo sufrir con el mismo reto.",
            "🏆 ¿Quién gana?",
            "Al final de las 3 rondas, el equipo que haya recolectado más cartas de palabras adivinadas se lleva la victoria (y probablemente la dignidad de los perdedores)."
        ]
    },

];