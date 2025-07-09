// Espera a que el documento HTML esté completamente cargado
window.addEventListener('DOMContentLoaded', () => {
    // Cuando se hace clic en el botón "Calcular", ejecuta la función calculateMRUV()
    document.getElementById('calculateBtn').addEventListener('click', calculateMRUV);
});

// Función principal que calcula y simula el MRUV
function calculateMRUV() {
    // Obtener los valores ingresados por el usuario
    const v0 = parseFloat(document.getElementById('velocity').value); // Velocidad inicial
    const aInput = document.getElementById('acceleration').value;     // Aceleración (si la hay)
    const dInput = document.getElementById('distanceInput').value;    // Distancia (si la hay)
    const t = parseFloat(document.getElementById('time').value);      // Tiempo total

    // Convertir aceleración y distancia a número
    let a = parseFloat(aInput);
    let d = parseFloat(dInput);

    // Si hay aceleración, se calcula la distancia
    if (!isNaN(a)) {
        d = v0 * t + 0.5 * a * t * t;
    }
    // Si hay distancia, se calcula la aceleración necesaria
    else if (!isNaN(d)) {
        a = (2 * (d - v0 * t)) / (t * t);
    }
    // Si no hay ninguno, mostrar alerta y salir
    else {
        alert('Debe ingresar al menos la aceleración o la distancia.');
        return;
    }

    // Crear arreglo con resultados para cada segundo
    const results = [];
    for (let i = 0; i <= t; i++) {
        const vi = v0 + a * i; // Velocidad en el tiempo i
        const di = v0 * i + 0.5 * a * i * i; // Distancia en el tiempo i
        results.push({
            time: i,
            velocity: vi.toFixed(2),
            distance: di.toFixed(2),
            acceleration: a.toFixed(2)
        });
    }

    // Mostrar los resultados y simulaciones
    displayResults(results, v0, a, d, t);        // Muestra tabla y resumen
    animateCarWithMarkers(results, d, t);       // Simula movimiento del carro
    drawGraph(results, t, d);                   // Dibuja gráfica distancia vs tiempo
    drawAccelerationGraph(results, t, a);       // Dibuja gráfica aceleración vs tiempo
}

// Muestra los resultados en resumen y tabla
function displayResults(results, v0, a, d, t) {
    const resultsDiv = document.getElementById('results');
    const finalResultsP = document.getElementById('finalResults');
    const resultsBody = document.getElementById('resultsBody');

    // Mostrar los valores generales
    finalResultsP.innerHTML = `
        <strong>Resumen:</strong><br>
        Velocidad inicial: ${v0} m/s<br>
        Aceleración: ${a.toFixed(2)} m/s²<br>
        Distancia total: ${d.toFixed(2)} m<br>
        Tiempo total: ${t} s
    `;

    // Limpiar resultados anteriores
    resultsBody.innerHTML = '';

    // Agregar una fila por cada segundo
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.time}</td>
            <td>${result.velocity}</td>
            <td>${result.distance}</td>
            <td>${result.acceleration}</td>
        `;
        resultsBody.appendChild(row);
    });

    // Mostrar la sección de resultados
    resultsDiv.style.display = 'block';
}

// Función que anima el movimiento del carro
// Función que anima el movimiento del carro y coloca marcadores
function animateCarWithMarkers(results, totalDistance, totalTime) {
    const car = document.getElementById('car'); // Elemento del carro
    const container = document.getElementById('trackContainer'); // Contenedor de la pista
    const containerWidth = container.clientWidth - 90; // Ancho útil de la pista
    const timeIndicator = document.getElementById('timeIndicator'); // Indicador de tiempo
    const speedIndicator = document.getElementById('speedIndicator'); // Indicador de velocidad

    // Eliminar marcadores anteriores
    const oldMarkers = document.querySelectorAll('.distance-marker, .distance-label');
    oldMarkers.forEach(marker => marker.remove());

    // Calcular el rango total de movimiento (soporta retroceso)
    const distances = results.map(r => parseFloat(r.distance));
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);
    const totalSpan = Math.abs(maxDistance - minDistance);

    // Escala: metros a píxeles
    const scale = containerWidth / totalSpan;

    // Offset: corrige la posición si hay distancias negativas
    const offset = 20 - minDistance * scale;

    // Agregar marcadores de distancia por cada segundo
    results.forEach((result, index) => {
        if (index > 0) {
            const marker = document.createElement('div');
            marker.className = 'distance-marker';
            marker.style.left = `${offset + result.distance * scale}px`;
            container.appendChild(marker);

            const label = document.createElement('div');
            label.className = 'distance-label';
            label.style.left = `${offset + result.distance * scale}px`;
            label.textContent = `${result.distance}m (${result.time}s)`;
            container.appendChild(label);
        }
    });

    // Posicionar el carro al inicio
    car.style.transition = 'none';
    car.style.left = `${offset + results[0].distance * scale}px`;
    timeIndicator.textContent = `Tiempo: 0s`;
    speedIndicator.textContent = `Velocidad: ${results[0].velocity} m/s`;

    car.offsetHeight; // Forzar reflujo (redibujar)

    // Crear fotogramas para animación del carro
    const keyframes = results.map(result => ({
        left: `${offset + result.distance * scale}px`
    }));

    // Iniciar la animación
    car.animate(keyframes, {
        duration: totalTime * 1000,
        easing: 'linear',
        fill: 'forwards'
    });

    // Actualizar tiempo y velocidad cada segundo
    let currentSecond = 0;
    const interval = setInterval(() => {
        timeIndicator.textContent = `Tiempo: ${currentSecond}s`;
        speedIndicator.textContent = `Velocidad: ${results[currentSecond].velocity} m/s`;

        currentSecond++;
        if (currentSecond >= results.length) {
            clearInterval(interval);
        }
    }, 1000);
}


// Dibuja la gráfica de distancia vs tiempo
function drawGraph(results, totalTime, totalDistance) {
    const graphContainer = document.getElementById('graphContainer');
    const containerWidth = graphContainer.clientWidth - 80;
    const containerHeight = graphContainer.clientHeight - 60;

    const distances = results.map(r => parseFloat(r.distance));
    const maxAbsDistance = Math.max(...distances.map(Math.abs));

    const xScale = containerWidth / totalTime;
    const yScale = containerHeight / (2 * maxAbsDistance);
    const yZero = graphContainer.clientHeight - 40 - containerHeight / 2;

    // Borrar gráficos anteriores
    const oldElements = document.querySelectorAll('.graph-line, .graph-point, .tick, .tick-label');
    oldElements.forEach(el => el.remove());

    // Ticks del eje X
    const xTicks = Math.min(10, totalTime);
    for (let i = 0; i <= xTicks; i++) {
        const timeValue = (i / xTicks) * totalTime;
        const xPos = 60 + (timeValue / totalTime) * containerWidth;

        const tick = document.createElement('div');
        tick.className = 'tick x-tick';
        tick.style.left = `${xPos}px`;
        graphContainer.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'tick-label x-tick-label';
        label.style.left = `${xPos}px`;
        label.textContent = timeValue.toFixed(1);
        graphContainer.appendChild(label);
    }

    // Ticks del eje Y
    const yTicks = 8;
    for (let i = -yTicks / 2; i <= yTicks / 2; i++) {
        const distanceValue = i * (maxAbsDistance / (yTicks / 2));
        const yPos = yZero - (distanceValue * yScale);

        const tick = document.createElement('div');
        tick.className = 'tick y-tick';
        tick.style.top = `${yPos}px`;
        graphContainer.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'tick-label y-tick-label';
        label.style.top = `${yPos}px`;
        label.textContent = distanceValue.toFixed(1);
        graphContainer.appendChild(label);
    }

    // Dibujar la curva
    let prevX = 60, prevY = graphContainer.clientHeight - 40;
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const x = 60 + (result.time / totalTime) * containerWidth;
        const y = yZero - (result.distance * yScale);

        const point = document.createElement('div');
        point.className = 'graph-point';
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        graphContainer.appendChild(point);

        if (i > 0) {
            const line = document.createElement('div');
            line.className = 'graph-line';
            line.style.left = `${prevX}px`;
            line.style.top = `${prevY}px`;

            const dx = x - prevX;
            const dy = y - prevY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            line.style.width = `${length}px`;
            line.style.transform = `rotate(${angle}deg)`;
            graphContainer.appendChild(line);
        }

        prevX = x;
        prevY = y;
    }
}

// Dibuja la gráfica de aceleración vs tiempo (línea horizontal)
function drawAccelerationGraph(results, totalTime, acceleration) {
    const container = document.getElementById('accelerationGraphContainer');
    const containerWidth = container.clientWidth - 80;
    const containerHeight = container.clientHeight - 60;

    // Borrar gráfico anterior
    const old = container.querySelectorAll('.graph-line, .graph-point, .tick, .tick-label');
    old.forEach(el => el.remove());

    // Escalas para el gráfico
    const xScale = containerWidth / totalTime;
    const yScale = containerHeight / (2 * Math.abs(acceleration));
    const yZero = container.clientHeight - 40 - containerHeight / 2;

    // Ticks del eje X
    const xTicks = Math.min(10, totalTime);
    for (let i = 0; i <= xTicks; i++) {
        const timeValue = (i / xTicks) * totalTime;
        const xPos = 60 + timeValue * xScale;

        const tick = document.createElement('div');
        tick.className = 'tick x-tick';
        tick.style.left = `${xPos}px`;
        container.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'tick-label x-tick-label';
        label.style.left = `${xPos}px`;
        label.textContent = timeValue.toFixed(1);
        container.appendChild(label);
    }

    // Ticks del eje Y (positivos y negativos)
    const yTicks = 4;
    for (let i = -yTicks / 2; i <= yTicks / 2; i++) {
        const accValue = i * (Math.abs(acceleration) / (yTicks / 2));
        const yPos = yZero - accValue * yScale;

        const tick = document.createElement('div');
        tick.className = 'tick y-tick';
        tick.style.top = `${yPos}px`;
        container.appendChild(tick);

        const label = document.createElement('div');
        label.className = 'tick-label y-tick-label';
        label.style.top = `${yPos}px`;
        label.textContent = accValue.toFixed(1);
        container.appendChild(label);
    }

    // Dibujar línea horizontal de aceleración constante
    const y = yZero - acceleration * yScale;
    let prevX = 60;

    for (let i = 0; i <= results.length - 1; i++) {
        const x = 60 + results[i].time * xScale;

        const point = document.createElement('div');
        point.className = 'graph-point';
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        container.appendChild(point);

        if (i > 0) {
            const line = document.createElement('div');
            line.className = 'graph-line';
            line.style.left = `${prevX}px`;
            line.style.top = `${y}px`;
            const width = x - prevX;
            line.style.width = `${width}px`;
            container.appendChild(line);
        }

        prevX = x;
    }
}
