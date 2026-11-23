const { test } = require("node:test");
const assert = require("node:assert");
const { esCanterano, contarNoCanteranos, filtrarEquiposCanteranos } = require("../server.js");

test("esCanterano: 0 no-cant, sin partidos -> true", () => {
  const jugadores = [{ id: 1, motherClubBonus: true }];
  assert.strictEqual(esCanterano(jugadores, new Set()), true);
});

test("esCanterano: 3 no-cant, ninguno jugo -> true", () => {
  const jugadores = [
    { id: 1, motherClubBonus: false },
    { id: 2, motherClubBonus: false },
    { id: 3, motherClubBonus: false },
    { id: 4, motherClubBonus: true }
  ];
  assert.strictEqual(esCanterano(jugadores, new Set()), true);
});

test("esCanterano: 4 no-cant -> false", () => {
  const jugadores = [
    { id: 1, motherClubBonus: false },
    { id: 2, motherClubBonus: false },
    { id: 3, motherClubBonus: false },
    { id: 4, motherClubBonus: false },
    { id: 5, motherClubBonus: true }
  ];
  assert.strictEqual(esCanterano(jugadores, new Set()), false);
});

test("esCanterano: no-cant que jugo -> false", () => {
  const jugadores = [
    { id: 1, motherClubBonus: false },
    { id: 2, motherClubBonus: true }
  ];
  assert.strictEqual(esCanterano(jugadores, new Set([1])), false);
});

test("contarNoCanteranos", () => {
  const jugadores = [
    { id: 1, motherClubBonus: false },
    { id: 2, motherClubBonus: true },
    { id: 3, motherClubBonus: false }
  ];
  assert.strictEqual(contarNoCanteranos(jugadores), 2);
});

test("filtrarEquiposCanteranos", () => {
  const equipos = [
    { nombre: "A", canterano: true },
    { nombre: "B", canterano: false }
  ];
  const res = filtrarEquiposCanteranos(equipos);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].nombre, "A");
});