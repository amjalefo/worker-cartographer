# NEXT.md — dónde retomar

**Parqueado el 2026-08-16. Se retoma el jueves 20 o viernes 21/08**, con la ventana de créditos llena (el pozo semanal resetea el 20/08 05:59).

**Deadline de la comp: sábado 29/08/2026, 23:59 EST** — criterio de Arthur, no verificado contra el post. El post dice *"Saturday, August 25th"* y el 25 cae martes; el día de la semana es el dato confiable (Comp #10 cerró sábado 8/08 real) y el sábado siguiente al 25 es el 29. **Confirmar en Skool antes de asumirlo.**

---

## Estado: entregado y verificable, sin anunciar

El repo está público y pasa su propio protocolo de juez desde un clon limpio. Lo que falta no es construcción.

| Qué | Estado |
|---|---|
| Los 5 archivos del instrumento | ✅ escritos, en inglés |
| `verify.mjs` | ✅ 10 fixtures, 12/12 checks cubiertos, sin red ni dependencias |
| `proof/` — 2 mapas de agentes fríos sobre Workers públicos | ✅ con sus friction reports crudos |
| `KNOWN-ISSUES.md` | ✅ 11 defectos: 8 arreglados, 3 abiertos |
| **El comentario en Skool** | 🔴 **sin publicar — el repo existe y nadie lo sabe** |

## Lo primero al retomar

1. **Publicar el comentario en Skool.** Comp #10, textual: *"the comments were the doorway."* Sin eso no hay entrega. Borrador en el historial de la sesión del 16/08; el punto que no se saca es que los friction reports incluyen lo que el instrumento hizo mal.
2. **Confirmar el deadline** contra el post.

## Los tres huecos declarados, en orden de lo que vale

1. **El test de falsificación está a medias.** `KNOWN-ISSUES.md` declara la vara: si un lector obtiene lo mismo pegando el Worker entero en un modelo y preguntando "explicame esto", el cartógrafo fracasó. Se corrió **contra el README de `relay`** (4 de 4: hechos que un cambiador necesita y el README no dice). La versión honesta —pasarle las 862 líneas a un modelo frío, preguntarle qué se rompe si agregás una columna a `clicks`, y comparar— **no se corrió**. Es el hueco más caro y el más barato de tapar.
2. **`identity.md` y `rules.md` se solapan en postura.** Deducción conocida: Comp #9 se la marcó a Toby Iverson con esas palabras. Los dos comparten vocabulario de gates y refusals. Pide leer los dos completos y dejar la postura en uno.
3. **`examples.md` (107) sigue arriba de `rules.md` (101).** Está argumentado en `KNOWN-ISSUES.md`, no despejado. Seis líneas de diferencia; el riesgo es que "examples más grande que rules" es falla nombrada en la historia de esta comp.

## Lo que NO hay que volver a hacer

- **No releer las 112 letters.** Están destiladas en `ALARIFE/_config/fundamentos-comps-clief-notes.md`, con citas textuales. Las fuentes crudas están en `ALARIFE/_references/skool-comp{8,9,10,11}*`, commiteadas.
- **No re-correr los cold-walks.** Los dos mapas de `proof/` son la evidencia y no caducan; los repos que mapean están pineados en su historia (`fluffyhowl/temp-mail`, `YuriCrystal/relay`).
- **No inventar más territorios.** Dos Workers públicos alcanzan; el tercero no agrega evidencia, agrega superficie.

## Contexto que no está en ningún archivo

El territorio del ejemplo (`examples.md`) es `tero-closer/clinicvia-intake`, privado, y **se queda privado a propósito** — Comp #10, Iris Heddes: *"the lived cases staying private is honest, not a hide."* Las citas `path:línea` no resuelven para un extraño y eso está declarado en el README, no escondido.
