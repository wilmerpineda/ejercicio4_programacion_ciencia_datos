export function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function round(value, decimals = 4) {
  return Number(value.toFixed(decimals))
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0
  const index = Math.floor((1 - p) * sortedValues.length)
  const bounded = Math.max(0, Math.min(sortedValues.length - 1, index))
  return sortedValues[bounded]
}

function simpleExpSmoothing(data, alpha) {
  if (!data.length) return []
  const smoothed = [data[0]]
  for (let i = 1; i < data.length; i++) {
    const prev = smoothed[i - 1]
    const current = alpha * data[i] + (1 - alpha) * prev
    smoothed.push(round(current))
  }
  return smoothed
}

function buildVarExamples(returns, confidence) {
  const mean =
    returns.reduce((acc, value) => acc + value, 0) / returns.length
  const sortedReturns = [...returns].sort((a, b) => a - b)
  const varValue = Math.abs(percentile(sortedReturns, confidence))

  let riskLabel = 'Bajo'
  if (varValue >= 0.025) riskLabel = 'Alto'
  else if (varValue >= 0.015) riskLabel = 'Medio'

  return [
    { call: 'mean_return()', output: round(mean).toString() },
    { call: 'var_historical()', output: round(varValue).toString() },
    { call: 'risk_level()', output: `"${riskLabel}"` },
  ]
}

function buildTimeSeriesExamples(data, alpha) {
  const smoothed = simpleExpSmoothing(data, alpha)
  const nextForecast = smoothed[smoothed.length - 1]
  const last = data[data.length - 1]
  const first = data[0]

  let trend = 'estable'
  if (last > first) trend = 'creciente'
  if (last < first) trend = 'decreciente'

  return [
    { call: 'smooth()', output: JSON.stringify(smoothed) },
    { call: 'forecast_next()', output: round(nextForecast).toString() },
    { call: 'trend()', output: `"${trend}"` },
  ]
}

function buildMetricsExamples(yTrue, yPred) {
  let correct = 0
  let tp = 0
  let fp = 0
  let fn = 0

  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === yPred[i]) correct += 1
    if (yTrue[i] === 1 && yPred[i] === 1) tp += 1
    if (yTrue[i] === 0 && yPred[i] === 1) fp += 1
    if (yTrue[i] === 1 && yPred[i] === 0) fn += 1
  }

  const accuracy = correct / yTrue.length
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)

  return [
    { call: 'accuracy()', output: round(accuracy).toString() },
    { call: 'precision()', output: round(precision).toString() },
    { call: 'recall()', output: round(recall).toString() },
  ]
}

function buildStabilityExamples(train, test) {
  const meanTrain = train.reduce((acc, value) => acc + value, 0) / train.length
  const meanTest = test.reduce((acc, value) => acc + value, 0) / test.length
  const diff = Math.abs(meanTrain - meanTest)
  const stability = 1 / (1 + diff)
  const isStable = diff < 1

  return [
    { call: 'mean_difference()', output: round(diff).toString() },
    { call: 'stability_score()', output: round(stability).toString() },
    { call: 'is_stable()', output: isStable ? 'True' : 'False' },
  ]
}

function buildEngagementExamples(clicks, views, purchases) {
  const score = round(clicks * 0.2 + views * 0.05 + purchases * 2)
  const isHighValue = purchases >= 2 || score >= 10

  let segment = 'Casual'
  if (score >= 12) segment = 'Power User'
  else if (score >= 7) segment = 'Active'

  return [
    { call: 'score()', output: score.toString() },
    { call: 'is_high_value()', output: isHighValue ? 'True' : 'False' },
    { call: 'segment()', output: `"${segment}"` },
  ]
}

export function buildExercise(studentId) {
  const base = hashString(studentId)
  const type = base % 5
  const variant = hashString(studentId + '_v') % 5

  if (type === 0) return buildVARExercise(variant)
  if (type === 1) return buildTimeSeriesExercise(variant)
  if (type === 2) return buildMetricsExercise(variant)
  if (type === 3) return buildStabilityExercise(variant)
  return buildEngagementExercise(variant)
}

function buildVARExercise(variant) {
  const confidenceOptions = [0.9, 0.95, 0.99]
  const returnSets = [
    [0.02, -0.01, 0.015, -0.03, 0.01, -0.02],
    [0.03, -0.015, 0.01, -0.025, 0.005, -0.01],
    [0.025, -0.02, 0.012, -0.018, 0.009, -0.014],
    [0.018, -0.012, 0.02, -0.028, 0.011, -0.016],
    [0.022, -0.017, 0.014, -0.021, 0.008, -0.011],
  ]

  const confidence = confidenceOptions[variant % confidenceOptions.length]
  const returns = returnSets[variant % returnSets.length]

  return {
    id: 'portfolio_var',
    title: 'Análisis de riesgo financiero (VaR)',
    className: 'PortfolioRiskAnalyzer',
    requiredAttributes: ['returns', 'confidence'],
    requiredMethods: ['mean_return', 'var_historical', 'risk_level'],
    requiredLogicSignals: {
      mean_return: ['sum', 'len'],
      var_historical: ['sorted', 'int', 'len'],
      risk_level: ['if', 'return'],
    },
    context: `
⚖️ El Reto: El Guardián del Capital
¡Bienvenido al mundo de las Finanzas Cuantitativas! Te has unido a un equipo de élite encargado de proteger y optimizar portafolios de inversión. En un entorno donde los mercados nunca duermen y la incertidumbre es la única constante, tu código será la brújula que guíe las decisiones de inversión.

Tu desafío no es solo procesar números, sino construir una infraestructura financiera robusta. Necesitamos encapsular la ciencia del riesgo en una clase que sea el estándar de oro para nuestros analistas: clara, escalable y, sobre todo, confiable.

🎯 Tu Misión: El Analista de Riesgos Digital
Tu objetivo es diseñar una clase de gestión de portafolios que transforme datos históricos en inteligencia financiera. Deberás implementar:

    - Cálculo de Retorno Promedio: Determinar el rendimiento histórico para entender cuánto valor está generando el portafolio.

    - Estimación de Value at Risk (VaR): Calcular "la peor pérdida esperada" en un periodo de tiempo. No buscamos una fórmula de doctorado, sino una aproximación lógica (por ejemplo, basada en percentiles o desviaciones).

    - Clasificación de Perfil: Traducir los números en etiquetas interpretables (Bajo, Medio, Alto Riesgo) para que cualquier inversor pueda entender su exposición.

🛠️ Tus Herramientas de Construcción
Para esta misión financiera, utilizaremos las mejores prácticas de ingeniería de software:

    1. Manejo de Listas y Agregaciones: Para procesar series de retornos con eficiencia.
    
    2. Arquitectura de Métodos: Diseñando una interfaz que oculte la complejidad matemática y entregue resultados limpios.
    
    3. Tipado y Documentación: Porque en finanzas, la claridad es seguridad. Queremos ver un código bien documentado que explique qué está calculando.

El mercado está esperando tu solución. ¿Estás listo para cuantificar el riesgo?
`,
    skeleton: `from typing import List

class PortfolioRiskAnalyzer:
    """
    Analiza el riesgo histórico de un portafolio.
    """

    def __init__(self, returns: List[float], confidence: float):
        self.returns = returns
        self.confidence = confidence

    def mean_return(self) -> float:
        """Calcula el retorno promedio."""
        pass

    def var_historical(self) -> float:
        """Calcula el VaR histórico."""
        pass

    def risk_level(self) -> str:
        """Clasifica el nivel de riesgo."""
        pass
`,
    data: { returns, confidence },
    examples: buildVarExamples(returns, confidence),
  }
}

function buildTimeSeriesExercise(variant) {
  const alphaOptions = [0.2, 0.5, 0.7]
  const seriesSets = [
    [10, 12, 11, 13, 15, 14],
    [20, 21, 23, 22, 25, 27],
    [15, 14, 13, 13, 12, 11],
    [8, 9, 10, 11, 13, 14],
    [30, 29, 31, 32, 33, 34],
  ]

  const alpha = alphaOptions[variant % alphaOptions.length]
  const data = seriesSets[variant % seriesSets.length]

  return {
    id: 'time_series',
    title: 'Pronóstico con suavizado exponencial',
    className: 'TimeSeriesForecaster',
    requiredAttributes: ['data', 'alpha'],
    requiredMethods: ['smooth', 'forecast_next', 'trend'],
    requiredLogicSignals: {
      smooth: ['for', 'append'],
      forecast_next: ['smooth', 'return'],
      trend: ['if', 'return'],
    },
    context: `
🔮 El Reto: El Arquitecto de Tendencias
¡Bienvenido al análisis predictivo! En el mundo real, los datos no son estáticos: fluyen a través del tiempo. Tu desafío hoy es dejar de mirar el pasado como una foto fija y empezar a usarlo como un mapa para anticipar el futuro.

Como ingeniero/a, tu objetivo no es solo calcular un número, sino construir una herramienta reutilizable que pueda procesar flujos de datos históricos y decirnos hacia dónde se dirige el barco. ¿Estamos creciendo, decayendo o simplemente navegando en ruido?

🎯 Tu Misión: El Motor de Pronóstico
Debes diseñar una clase robusta que actúe como un filtro inteligente para series temporales. Tu código tendrá la responsabilidad de:

    - Aplicar Suavizado Exponencial: Limpiar el "ruido" de los datos históricos para quedarte con la señal verdaderamente importante.
    
    - Generar el Próximo Paso: Basándote en lo aprendido, proponer cuál será el valor más probable del siguiente periodo.
    
    - Identificar la Tendencia: Dictaminar si la dirección general del sistema es al alza, a la baja o si se mantiene estable.

🛠️ Tus Herramientas de Construcción
Para este reto, nos alejaremos de las cajas negras y construiremos la lógica desde los cimientos:

    1. Ciclos y Lógica Iterativa: Para recorrer la historia de los datos y actualizar el conocimiento del modelo paso a paso.

    2. Diseño de Métodos: Estructurando la clase de forma que sea fácil de integrar en cualquier sistema de producción.

    3. Coherencia y Claridad: Buscamos un código que explique por sí mismo cómo se llega de un dato crudo a una predicción valiosa.

No buscamos una bola de cristal perfecta, sino una solución lógica, elegante y profesional. ¡El futuro está en tu código!
`,
    skeleton: `from typing import List

class TimeSeriesForecaster:
    """
    Realiza suavizado exponencial simple sobre una serie.
    """

    def __init__(self, data: List[float], alpha: float):
        self.data = data
        self.alpha = alpha

    def smooth(self) -> List[float]:
        """Retorna la serie suavizada."""
        pass

    def forecast_next(self) -> float:
        """Pronostica el siguiente valor."""
        pass

    def trend(self) -> str:
        """Describe la tendencia general."""
        pass
`,
    data: { data, alpha },
    examples: buildTimeSeriesExamples(data, alpha),
  }
}

function buildMetricsExercise(variant) {
  const sets = [
    { yTrue: [1, 0, 1, 1, 0], yPred: [1, 0, 0, 1, 0] },
    { yTrue: [1, 1, 0, 0, 1], yPred: [1, 0, 0, 0, 1] },
    { yTrue: [0, 1, 1, 0, 1], yPred: [0, 1, 0, 0, 1] },
    { yTrue: [1, 0, 0, 1, 1], yPred: [1, 1, 0, 1, 0] },
    { yTrue: [0, 0, 1, 1, 1], yPred: [0, 0, 1, 0, 1] },
  ]

  const selected = sets[variant % sets.length]

  return {
    id: 'classification_metrics',
    title: 'Evaluación de modelos de clasificación',
    className: 'ClassificationMetrics',
    requiredAttributes: ['y_true', 'y_pred'],
    requiredMethods: ['accuracy', 'precision', 'recall'],
    requiredLogicSignals: {
      accuracy: ['for', 'len'],
      precision: ['if', 'return'],
      recall: ['if', 'return'],
    },
    context: `
🏆 El Reto: El Juez de la Inteligencia Artificial
¡Felicidades! Has construido un modelo, pero en el mundo de la Inteligencia Artificial, un modelo que no se puede medir es solo una caja negra. Tu siguiente gran desafío es convertirte en el auditor de tu propio algoritmo.

No siempre el modelo que más acierta es el mejor; a veces necesitamos precisión quirúrgica y otras veces no podemos permitirnos olvidar ni un solo caso. Tu misión es construir la infraestructura que nos diga la verdad sobre qué tan bien está funcionando nuestra solución.

🎯 Tu Misión: El Motor de Evaluación
Debes diseñar una clase de evaluación que procese las predicciones y las compare con la realidad. Tu código debe ser capaz de extraer tres verdades fundamentales:

    - Accuracy (Exactitud): ¿Qué porcentaje de nuestras predicciones totales fueron correctas?

    - Precision (Precisión): Cuando el modelo dice "es positivo", ¿qué tan seguido tiene razón?

    - Recall (Sensibilidad): De todos los casos positivos reales que existían, ¿cuántos fue capaz de encontrar el modelo?

🛠️ Tus Herramientas de Construcción
Para este reto, no utilizaremos librerías externas. Queremos ver tu habilidad para manipular datos "a mano" usando:

    1. Iteraciones Inteligentes: Para recorrer los resultados y comparar predicción vs. realidad.

    2. Lógica Condicional: Para clasificar cada resultado en los pilares de la evaluación (Verdaderos Positivos, Falsos Negativos, etc.).

    3. Arquitectura Limpia: Métodos bien definidos que hagan que calcular una métrica sea tan sencillo como llamar a una función.

¿Estás listo para demostrar que entiendes la matemática detrás de la IA? ¡Es hora de codear!
`,
    skeleton: `from typing import List

class ClassificationMetrics:
    """
    Calcula métricas básicas de clasificación binaria.
    """

    def __init__(self, y_true: List[int], y_pred: List[int]):
        self.y_true = y_true
        self.y_pred = y_pred

    def accuracy(self) -> float:
        """Calcula accuracy."""
        pass

    def precision(self) -> float:
        """Calcula precision."""
        pass

    def recall(self) -> float:
        """Calcula recall."""
        pass
`,
    data: selected,
    examples: buildMetricsExamples(selected.yTrue, selected.yPred),
  }
}

function buildStabilityExercise(variant) {
  const sets = [
    { train: [1, 2, 3, 4], test: [2, 3, 4, 5] },
    { train: [10, 12, 11, 13], test: [11, 12, 14, 15] },
    { train: [5, 5, 6, 6], test: [7, 7, 8, 8] },
    { train: [2, 4, 6, 8], test: [2, 5, 7, 9] },
    { train: [3, 3, 4, 5], test: [3, 4, 5, 6] },
  ]

  const selected = sets[variant % sets.length]

  return {
    id: 'stability',
    title: 'Análisis de estabilidad de variables',
    className: 'FeatureStabilityAnalyzer',
    requiredAttributes: ['train', 'test'],
    requiredMethods: ['mean_difference', 'stability_score', 'is_stable'],
    requiredLogicSignals: {
      mean_difference: ['abs', 'sum', 'len'],
      stability_score: ['return'],
      is_stable: ['if', 'return'],
    },
    context: `
🛡️ El Reto: Guardián de Modelos en Producción
¡Te damos la bienvenida a la primera línea de defensa de nuestros sistemas inteligentes! En el mundo real, un modelo de Machine Learning es tan bueno como los datos que recibe. Cuando el comportamiento de las variables cambia (un fenómeno que los expertos llaman Data Drift), la precisión de nuestras predicciones puede caer en picada.

Tu misión es construir una herramienta de monitoreo estructurada que actúe como un radar, detectando anomalías antes de que afecten a nuestros usuarios.

🎯 Tu Misión: El Sensor de Estabilidad
Debes diseñar una clase técnica capaz de analizar la salud de nuestras variables. Tu código será el encargado de:

    - Contrastar Entornos: Comparar estadísticamente cómo se ven los datos de entrenamiento frente a los que están llegando hoy en producción.

    - Cuantificar la Estabilidad: Crear una métrica propia que nos diga, del 0 al 100, qué tan "sano" es el comportamiento actual.

    - Dictaminar Confiabilidad: Tomar la decisión crítica: ¿Podemos seguir confiando en esta variable o necesitamos encender las alarmas?

🛠️ Tus Herramientas
No buscamos algoritmos complejos de estadística avanzada, sino una lógica sólida y bien estructurada. Nos enfocaremos en:

    1. Operaciones Matemáticas: Implementar cálculos que den sentido a la diferencia entre datos.

    2. Arquitectura de Métodos: Diseñar una interfaz clara que cualquier ingeniero de tu equipo pueda usar.

    3. Código de Calidad: Escribir una solución que sea tan limpia como eficiente.

¡Estamos listos para ver tu propuesta! Recuerda: no se trata de encontrar la fórmula perfecta, sino de diseñar una solución razonable y profesional para un problema crítico del día a día.
`,
    skeleton: `from typing import List

class FeatureStabilityAnalyzer:
    """
    Analiza estabilidad entre una muestra de entrenamiento y una de prueba.
    """

    def __init__(self, train: List[float], test: List[float]):
        self.train = train
        self.test = test

    def mean_difference(self) -> float:
        """Calcula la diferencia absoluta entre medias."""
        pass

    def stability_score(self) -> float:
        """Construye un score simple de estabilidad."""
        pass

    def is_stable(self) -> bool:
        """Determina si la variable es estable."""
        pass
`,
    data: selected,
    examples: buildStabilityExamples(selected.train, selected.test),
  }
}

function buildEngagementExercise(variant) {
  const sets = [
    { clicks: 10, views: 100, purchases: 2 },
    { clicks: 5, views: 60, purchases: 1 },
    { clicks: 14, views: 150, purchases: 3 },
    { clicks: 8, views: 75, purchases: 0 },
    { clicks: 12, views: 90, purchases: 2 },
  ]

  const selected = sets[variant % sets.length]

  return {
    id: 'engagement',
    title: 'Modelo de engagement de usuarios',
    className: 'EngagementModel',
    requiredAttributes: ['clicks', 'views', 'purchases'],
    requiredMethods: ['score', 'is_high_value', 'segment'],
    requiredLogicSignals: {
      score: ['return'],
      is_high_value: ['if', 'return'],
      segment: ['if', 'return'],
    },
    context: `
🚀 El Reto: Modelando el Futuro de la Experiencia Digital
¡Bienvenido/a al equipo de Data & Software! Hoy te enfrentas a un desafío real: entender y predecir el comportamiento de nuestros usuarios. En las plataformas digitales modernas, no basta con acumular datos; el verdadero valor reside en cómo transformamos esos datos en decisiones inteligentes. Para que nuestra solución sea robusta y capaz de crecer con millones de usuarios (lo que llamamos escalabilidad), necesitamos que estructures esta lógica dentro de una arquitectura limpia y organizada.

🎯 Tu Misión
Tu objetivo es diseñar una clase técnica que actúe como el "cerebro" analítico de la plataforma. Esta pieza de código deberá ser capaz de:

    - Calcular el Score de Engagement: Determinar qué tan activa y comprometida es una persona con nuestro contenido.

    - Identificar Usuarios de Alto Valor: Detectar mediante lógica inteligente quiénes son los perfiles más destacados.

    - Asignar Segmentos Personalizados: Organizar a los usuarios en grupos estratégicos para ofrecerles una mejor experiencia.

🛠️ Herramientas de Construcción
Para superar este reto, deberás demostrar tu dominio en:

    1. Lógica Condicional: Para tomar decisiones precisas basadas en los datos.

    2. Diseño de Métodos: Creando funciones claras, eficientes y fáciles de leer.

Estamos ansiosos por ver cómo estructuras esta solución. ¡Es hora de convertir el código en impacto real!
`,
    skeleton: `class EngagementModel:
    """
    Modela engagement a partir de señales básicas de comportamiento.
    """

    def __init__(self, clicks: int, views: int, purchases: int):
        self.clicks = clicks
        self.views = views
        self.purchases = purchases

    def score(self) -> float:
        """Calcula un score de engagement."""
        pass

    def is_high_value(self) -> bool:
        """Determina si el usuario es de alto valor."""
        pass

    def segment(self) -> str:
        """Asigna un segmento."""
        pass
`,
    data: selected,
    examples: buildEngagementExamples(
      selected.clicks,
      selected.views,
      selected.purchases
    ),
  }
}