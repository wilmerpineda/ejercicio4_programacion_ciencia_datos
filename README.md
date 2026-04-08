# Ejercicio 4 - Programación para Ciencia de Datos

Aplicación web interactiva para la práctica de Programación Orientada a Objetos en contextos de Ciencia de Datos.

## Descripción

Esta aplicación genera un ejercicio personalizado a partir del correo electrónico del estudiante. Cada estudiante recibe una variante estable del reto y dispone de un único intento en la plataforma.

La evaluación está dividida en dos partes:

- **30%**: retroalimentación automática en plataforma
- **70%**: evaluación posterior con pruebas adicionales sobre el código entregado

## Características

- Generación personalizada del ejercicio por estudiante
- Casos inspirados en problemas de Ciencia de Datos
- Editor de código integrado
- Retroalimentación automática sobre estructura y lógica inicial
- Registro del intento en Google Sheets
- Bloqueo de intentos duplicados desde frontend y backend

## Tecnologías usadas

- React
- Vite
- Google Apps Script
- Google Sheets
- GitHub Pages

## Estructura del proyecto

```text
.
├── public/
│   └── branding/
│       └── usta-logo.png
├── src/
│   ├── components/
│   │   └── UniversityHeader.jsx
│   ├── App.jsx
│   ├── evaluator.js
│   ├── exercises.js
│   ├── main.jsx
│   └── styles.css
├── .gitignore
├── index.html
├── package.json
└── vite.config.js