function countMatches(text, regex) {
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

function hasClassDefinition(code, className) {
  const regex = new RegExp(`class\\s+${className}\\b`)
  return regex.test(code)
}

function hasMethodDefinition(code, methodName) {
  const regex = new RegExp(`def\\s+${methodName}\\s*\\(`)
  return regex.test(code)
}

function hasInitDefinition(code) {
  return /def\s+__init__\s*\(/.test(code)
}

function hasAttributeAssignment(code, attribute) {
  const regex = new RegExp(`self\\.${attribute}\\s*=`)
  return regex.test(code)
}

function hasTyping(code) {
  const hasListTyping = /List\s*\[/.test(code)
  const hasPrimitiveTyping =
    /:\s*(int|float|str|bool)/.test(code) || /->\s*(int|float|str|bool|List)/.test(code)

  return hasListTyping || hasPrimitiveTyping
}

function hasDocstrings(code) {
  return countMatches(code, /"""/g) >= 2
}

function extractMethodBlock(code, methodName) {
  const startRegex = new RegExp(`def\\s+${methodName}\\s*\\([^)]*\\):`)
  const startMatch = code.match(startRegex)

  if (!startMatch || startMatch.index === undefined) return ''

  const startIndex = startMatch.index
  const afterStart = code.slice(startIndex)

  const nextMethodMatch = afterStart.slice(startMatch[0].length).match(/\ndef\s+\w+\s*\(/)
  if (!nextMethodMatch || nextMethodMatch.index === undefined) {
    return afterStart
  }

  return afterStart.slice(0, startMatch[0].length + nextMethodMatch.index)
}

function methodHasReturn(code, methodName) {
  const block = extractMethodBlock(code, methodName)
  return /\breturn\b/.test(block)
}

function logicSignalsFound(code, methodName, signals) {
  const block = extractMethodBlock(code, methodName).toLowerCase()
  if (!block) return 0

  let hits = 0
  signals.forEach((signal) => {
    if (block.includes(signal.toLowerCase())) hits += 1
  })
  return hits
}

export function evaluateCode(code, exercise) {
  if (!code || !code.trim()) {
    return {
      score: 0,
      feedback: ['No se envió código.'],
    }
  }

  let score = 0
  const feedback = []

  if (hasClassDefinition(code, exercise.className)) {
    score += 10
  } else {
    feedback.push(`No se encontró la clase ${exercise.className}.`)
  }

  if (hasInitDefinition(code)) {
    score += 10
  } else {
    feedback.push('Falta el método __init__.')
  }

  let attributeHits = 0
  exercise.requiredAttributes.forEach((attribute) => {
    if (hasAttributeAssignment(code, attribute)) {
      attributeHits += 1
    } else {
      feedback.push(`No se detecta la asignación self.${attribute}.`)
    }
  })
  score += Math.min(15, attributeHits * 5)

  let methodHits = 0
  exercise.requiredMethods.forEach((methodName) => {
    if (hasMethodDefinition(code, methodName)) {
      methodHits += 1
    } else {
      feedback.push(`Falta el método ${methodName}.`)
    }
  })
  score += Math.min(25, methodHits * 8)

  if (hasTyping(code)) {
    score += 15
  } else {
    feedback.push('No se detecta tipado suficiente en la implementación.')
  }

  if (hasDocstrings(code)) {
    score += 10
  } else {
    feedback.push('No se detectan docstrings suficientes.')
  }

  let returnHits = 0
  exercise.requiredMethods.forEach((methodName) => {
    if (methodHasReturn(code, methodName)) {
      returnHits += 1
    } else {
      feedback.push(`El método ${methodName} no parece retornar un valor.`)
    }
  })
  score += Math.min(10, returnHits * 3)

  let logicScore = 0
  exercise.requiredMethods.forEach((methodName) => {
    const signals = exercise.requiredLogicSignals?.[methodName] || []
    const hits = logicSignalsFound(code, methodName, signals)
    logicScore += Math.min(2, hits)
  })
  score += Math.min(20, logicScore * 2)

  if (feedback.length === 0) {
    feedback.push('Muy buen trabajo. La estructura general de la solución es consistente.')
  }

  return {
    score: Math.min(100, score),
    feedback,
  }
}