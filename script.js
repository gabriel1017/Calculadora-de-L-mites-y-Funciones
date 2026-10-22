let myChart = null; // Variable global para guardar la instancia de la gráfica

// ==========================================
// 1. LÓGICA PRINCIPAL: CALCULAR Y GRAFICAR
// ==========================================
document.getElementById('calculateBtn').addEventListener('click', function () {
    const exprString = document.getElementById('functionInput').value.trim();
    const limitString = document.getElementById('limitInput').value.trim();
    const stepsOutput = document.getElementById('stepsOutput');

    if (!exprString) {
        stepsOutput.innerText = "Por favor ingresa una función válida.";
        return;
    }

    stepsOutput.innerText = ""; // Limpiar output anterior

    try {
        // Parsear la expresión con Math.js
        const node = math.parse(exprString);
        const compiled = node.compile();

        let stepsText = `Función ingresada: f(x) = ${exprString}\n\n`;

        // Si se ingresó un valor para evaluar el límite
        if (limitString !== "") {
            const targetX = parseFloat(limitString);

            if (isNaN(targetX)) {
                stepsOutput.innerText = "El valor del límite debe ser un número.";
                return;
            }

            stepsText += `--- CÁLCULO DEL LÍMITE (x -> ${targetX}) ---\n\n`;
            stepsText += `Paso 1: Evaluar directamente f(${targetX})\n`;

            let directResult;
            try {
                directResult = compiled.evaluate({ x: targetX });
            } catch (e) {
                directResult = NaN;
            }

            // Comprobar indeterminación o resultado válido
            if (isNaN(directResult) || !isFinite(directResult)) {
                stepsText += `--> Sustitución directa resulta en Indeterminación (0/0 o Indefinido).\n\n`;
                stepsText += `Paso 2: Intentar simplificación algebraica...\n`;

                try {
                    const simplifiedNode = math.simplify(node);
                    const simplifiedString = simplifiedNode.toString();

                    stepsText += `--> Función simplificada: f(x) = ${simplifiedString}\n\n`;
                    stepsText += `Paso 3: Evaluar el límite en la función simplificada:\n`;

                    const simplifiedCompiled = simplifiedNode.compile();
                    const newResult = simplifiedCompiled.evaluate({ x: targetX });

                    if (isNaN(newResult) || !isFinite(newResult)) {
                        const delta = 0.0001;
                        const leftVal = compiled.evaluate({ x: targetX - delta });
                        const rightVal = compiled.evaluate({ x: targetX + delta });

                        stepsText += `--> Evaluación por aproximación lateral:\n`;
                        stepsText += `    Por la izquierda (x = ${targetX - delta}): ${leftVal.toFixed(4)}\n`;
                        stepsText += `    Por la derecha (x = ${targetX + delta}): ${rightVal.toFixed(4)}\n\n`;

                        const avgVal = (leftVal + rightVal) / 2;
                        stepsText += `--> El límite tiende a: ${avgVal.toFixed(4)}\n`;
                    } else {
                        stepsText += `--> Límite = ${newResult}\n`;
                    }
                } catch (err) {
                    stepsText += `No se pudo simplificar algebraicamente la expresión.\n`;
                }
            } else {
                stepsText += `--> La sustitución directa funcionó.\n`;
                stepsText += `--> Resultado del Límite = ${directResult}\n`;
            }
        } else {
            stepsText += "No se ingresó un punto para el límite. Mostrando únicamente la gráfica de la función.";
        }

        stepsOutput.innerText = stepsText;

        // Generar la gráfica
        plotFunction(compiled, limitString !== "" ? parseFloat(limitString) : 0);

    } catch (error) {
        stepsOutput.innerText = "Error al procesar la función. Revisa que la sintaxis sea correcta.\nEjemplos válidos:\n - x^2 - 4 / (x - 2)\n - 3*x + 5\n - sin(x)";
    }
});


// ==========================================
// 2. FUNCIÓN PARA GENERAR LA GRÁFICA
// ==========================================
function plotFunction(compiledExpr, targetX) {
    const ctx = document.getElementById('functionGraph').getContext('2d');

    const rangeMin = targetX - 10;
    const rangeMax = targetX + 10;
    const step = 0.2;

    const xValues = [];
    const yValues = [];

    for (let x = rangeMin; x <= rangeMax; x += step) {
        xValues.push(parseFloat(x.toFixed(2)));
        try {
            let y = compiledExpr.evaluate({ x: x });
            if (!isFinite(y) || Math.abs(y) > 100) {
                yValues.push(null);
            } else {
                yValues.push(y);
            }
        } catch (e) {
            yValues.push(null);
        }
    }

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [{
                label: 'f(x)',
                data: yValues,
                borderColor: '#3498db',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Eje X' },
                    grid: { color: '#e0e0e0' }
                },
                y: {
                    title: { display: true, text: 'Eje Y' },
                    grid: { color: '#e0e0e0' }
                }
            }
        }
    });
}


// ==========================================
// 3. LÓGICA DE LOS BOTONES DE LIMPIEZA
// ==========================================

// Botón "Limpiar Ecuación": Borra solo el campo f(x)
document.getElementById('clearEqBtn').addEventListener('click', function () {
    const functionInput = document.getElementById('functionInput');
    functionInput.value = '';
    functionInput.focus();
});

// Botón "Limpiar Todo": Restablece campos, texto y gráfica
document.getElementById('clearAllBtn').addEventListener('click', function () {
    document.getElementById('functionInput').value = '';
    document.getElementById('limitInput').value = '';
    document.getElementById('stepsOutput').innerText = 'Aquí aparecerá el desglose paso a paso...';
    
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }
    
    document.getElementById('functionInput').focus();
});