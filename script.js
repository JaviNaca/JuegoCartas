const jugadores = [
    { nombre: "Jugador 1", cartas: [], vivo: true },
    { nombre: "Jugador 2", cartas: [], vivo: true },
    { nombre: "Jugador 3", cartas: [], vivo: true }
];

// Variables globales del estado del juego
let mazo = [];          // Mazo principal
let descarte = [];      // Cartas descartada
let turnoActual = 0;    // Índice del jugador al que le toca el turno


// Crea el mazo con tipos de cartas definidos y sus cantidades
function generarMazo() {
    const mazo = [];
    for (let i = 0; i < 6; i++) mazo.push({ tipo: "Bomba" });
    for (let i = 0; i < 6; i++) mazo.push({ tipo: "Desactivacion" });
    for (let i = 0; i < 10; i++) mazo.push({ tipo: "Saltar" });
    for (let i = 0; i < 33; i++) {
        mazo.push({ tipo: "Puntos", valor: Math.floor(Math.random() * 10) + 1 });
    }
    return mazo;
}

// Algoritmo de mezcla aleatoria del mazo (Fisher-Yates Shuffle)
function fisherYatesShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Devuelve la ruta de imagen de una carta en función de su tipo
function getCardImagePath(carta) {
    const images = {
        'Bomba': './img/bomba/bomba.png',
        'Desactivacion': './img/herramienta/herramienta.png',
        'Saltar': './img/pasarTurno/pasarTurno.png',
        'Puntos': () => {
            let random = Math.floor(Math.random() * 20) + 1;
            return random < 10
                ? `./img/card/robot_0${random}.png`
                : `./img/card/robot_${random}.png`;
        }
    };

    // Devuelve la ruta de la imagen correspondiente según el tipo de carta
    return carta.tipo === "Puntos" ? images.Puntos() : images[carta.tipo];
}


// Muestra la imagen de la carta robada
function mostrarImagenCarta(carta) {
    const img = document.getElementById("imgCartaRobada");
    img.src = getCardImagePath(carta);
}

// Actualiza la lista visual de cartas en el descarte
function actualizarDescarte() {
    const lista = document.getElementById("listaDescarte");
    lista.innerHTML = "";
    const contador = {};

    descarte.forEach(c => {
        const key = c.tipo + (c.tipo === "Puntos" ? ` (${c.valor})` : "");
        contador[key] = (contador[key] || 0) + 1;
    });

    for (const tipo in contador) {
        const li = document.createElement("li");
        li.textContent = `${tipo} x${contador[tipo]}`;
        lista.appendChild(li);
    }
}

// Marca visualmente al jugador cuyo turno está activo
function resaltarTurnoActual() {
    const jugadoresNombres = document.querySelectorAll('.cabeceraJugador h2');
    jugadoresNombres.forEach((nombreJugador, index) => {
        if (index === turnoActual) {
            nombreJugador.classList.add('jugadorActivo');
        } else {
            nombreJugador.classList.remove('jugadorActivo');
        }
    });
}

// Actualiza la información visual de cada jugador (cartas, puntos, etc.)
function actualizarPantalla() {
    jugadores.forEach((jugador, i) => {
        const cartas = jugador.cartas;
        const puntos = cartas.filter(c => c.tipo === "Puntos").reduce((acc, c) => acc + c.valor, 0);
        const saltos = cartas.filter(c => c.tipo === "Saltar").length;
        const desacts = cartas.filter(c => c.tipo === "Desactivacion").length;

        document.getElementById(`J${i + 1}NumCartas`).textContent = `⚪️ Número de cartas: ${cartas.length}`;
        document.getElementById(`J${i + 1}Puntos`).textContent = `⚪️ Puntos totales: ${puntos}`;
        document.getElementById(`J${i + 1}saltoTurno`).textContent = `⚪️ Cartas salto turno: ${saltos}`;
        document.getElementById(`J${i + 1}Desactivacion`).textContent = `⚪️ Cartas desactivación: ${desacts}`;
    });

    const jugador = jugadores[turnoActual];
    let tieneSaltar = false;
    for (let i = 0; i < jugador.cartas.length; i++) {
        if (jugador.cartas[i].tipo === "Saltar") {
            tieneSaltar = true;
            break;
        }
    }
    document.getElementById("btnPasar").disabled = !tieneSaltar;
}

// Cambia el turno al siguiente jugador activo
function siguienteTurno() {
    do {
        turnoActual = (turnoActual + 1) % jugadores.length;
    } while (!jugadores[turnoActual].vivo);

    actualizarPantalla();
    resaltarTurnoActual();
}

// Verifica si solo queda un jugador vivo
function comprobarGanador() {
    const vivos = jugadores.filter(j => j.vivo);
    if (vivos.length === 1) {
        alert(`${vivos[0].nombre} ha ganado 🎉`);
        finalizarJuego();
    }
}

// Finaliza el juego si el mazo se agota (gana quien tenga más puntos)
function finalizarPorPuntos() {
    const vivos = jugadores.filter(j => j.vivo);
    const conPuntos = vivos.map(j => ({
        nombre: j.nombre,
        puntos: j.cartas.filter(c => c.tipo === "Puntos").reduce((acc, c) => acc + c.valor, 0)
    }));

    conPuntos.sort((a, b) => b.puntos - a.puntos);
    const ganador = conPuntos[0];
    alert(`¡El mazo se ha acabado! Gana ${ganador.nombre} con ${ganador.puntos} puntos 🏆`);
    finalizarJuego();
}

// Oculta botones y agrega opción para reiniciar el juego
function finalizarJuego() {
    document.getElementById("btnRobar").style.display = "none";
    document.getElementById("btnPasar").style.display = "none";

    const btnReiniciar = document.createElement("button");
    btnReiniciar.textContent = "Jugar de nuevo";
    btnReiniciar.className = "btnAccion";
    btnReiniciar.addEventListener("click", () => {
        location.reload();
    });

    document.getElementById("contenedorAcciones").appendChild(btnReiniciar);
}

// Acción principal: jugador roba una carta del mazo
function robarCarta() {
    const jugador = jugadores[turnoActual];

    if (mazo.length === 0) {
        finalizarPorPuntos();
        return;
    }
    // Elimina y devuelve el último elemento de un array
    const carta = mazo.pop();
    mostrarImagenCarta(carta);

    if (carta.tipo === "Bomba") {
        // Busca la calta Desactivación. Si no se encuentra ninguna, devolverá -1.
        const index = jugador.cartas.findIndex(c => c.tipo === "Desactivacion");
        if (index !== -1) {
            const desact = jugador.cartas.splice(index, 1)[0];
            descarte.push(carta, desact);
            actualizarDescarte();
        } else {
            jugador.vivo = false;
            descarte.push(carta, ...jugador.cartas);
            jugador.cartas = [];
            actualizarDescarte();
            alert(`${jugador.nombre} ha explotado y ha sido eliminado.`);
            comprobarGanador();
            if (jugadores.filter(j => j.vivo).length > 1) siguienteTurno();
            return;
        }
    } else {
        jugador.cartas.push(carta);
    }

    actualizarPantalla();
    comprobarGanador();
    if (jugadores[turnoActual].vivo) siguienteTurno();
}

// Inicializa el juego desde cero
function inicializarJuego() {
    mazo = fisherYatesShuffle(generarMazo());
    jugadores.forEach(j => {
        j.cartas = [];
        j.vivo = true;
    });
    descarte = [];
    turnoActual = 0;

    document.getElementById("imgCartaRobada").src = "";
    document.getElementById("btnRobar").style.display = "inline-block";
    document.getElementById("btnPasar").style.display = "inline-block";
    document.getElementById("btnPasar").disabled = true;

    actualizarPantalla();
}


inicializarJuego();

// Eventos de botones
document.getElementById("btnRobar").addEventListener("click", () => {
    if (!jugadores[turnoActual].vivo) return;
    robarCarta();
});

document.getElementById("btnPasar").addEventListener("click", () => {
    if (!jugadores[turnoActual].vivo) return;
    const jugador = jugadores[turnoActual];
    // Busca la calta Saltar. Si no se encuentra ninguna, devolverá -1.
    const index = jugador.cartas.findIndex(c => c.tipo === "Saltar");
    if (index !== -1) {
        const carta = jugador.cartas.splice(index, 1)[0];
        descarte.push(carta);
        actualizarDescarte();
        actualizarPantalla();
        siguienteTurno();
    }
});
