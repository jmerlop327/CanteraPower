require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");
const axios = require("axios");
const OAuthClient = require("oauth").OAuth;
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "cp-local-secret", resave: false, saveUninitialized: true }));
app.use(express.static("."));

const ADMIN_PASS = process.env.ADMIN_PASS || "admin";
const GIT_REPO = process.env.GIT_REPO || "";
const PUBLIC_DIR = path.join(__dirname, "public");
const CHPP_BASE = "https://chpp.hattrick.org/chppxml.ashx";
const DB_FILE = path.join(__dirname, "equipos.json");

const oa = new OAuthClient(
  "https://chpp.hattrick.org/oauth/request_token.ashx",
  "https://chpp.hattrick.org/oauth/access_token.ashx",
  process.env.CHPP_CONSUMER_KEY,
  process.env.CHPP_CONSUMER_SECRET,
  "1.0",
  "http://localhost:3000/auth/callback",
  "HMAC-SHA1"
);

function readEquipos() { try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch { return []; } }
function writeEquipos(arr) { fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2)); }

const TOKEN_FILE = path.join(__dirname, "chpp_token.json");
let chppTokenGlobal = null;
try { chppTokenGlobal = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")); } catch {}

function requireAdmin(req, res, next) { next(); }
function requireChpp(req, res, next) {
  if (chppTokenGlobal) return next();
  res.status(401).json({ error: "Conecta con Hattrick primero" });
}

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASS) { req.session.admin = true; return res.json({ ok: true }); }
  res.status(401).json({ error: "Contraseña incorrecta" });
});

app.get("/auth/login", (req, res) => {
  oa.getOAuthRequestToken((err, oauthToken, oauthTokenSecret) => {
    if (err) return res.status(500).send("Error OAuth: " + JSON.stringify(err));
    req.session.oauthToken = oauthToken;
    req.session.oauthTokenSecret = oauthTokenSecret;
    res.redirect(`https://chpp.hattrick.org/oauth/authorize.aspx?oauth_token=${oauthToken}`);
  });
});

app.get("/auth/callback", (req, res) => {
  const { oauth_verifier } = req.query;
  const oauthToken = req.session.oauthToken;
  const oauthTokenSecret = req.session.oauthTokenSecret;
  if (!oauthToken || !oauthTokenSecret) return res.status(400).send("Token no encontrado");
  oa.getOAuthAccessToken(oauthToken, oauthTokenSecret, oauth_verifier, (err, accessToken, accessTokenSecret) => {
    console.log("CALLBACK err:", err);
    console.log("CALLBACK token:", accessToken);
    if (err) return res.status(500).send("Error callback: " + JSON.stringify(err));
    chppTokenGlobal = { key: accessToken, secret: accessTokenSecret };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(chppTokenGlobal));
    console.log("Token saved to", TOKEN_FILE);
    res.redirect("/");
  });
});

function chppGet(file, token, extra = {}) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams(extra).toString();
    const url = `${CHPP_BASE}?file=${file}` + (params ? "&" + params : "");
    oa.get(url, token.key, token.secret, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function extractAll(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out = []; let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

app.get("/api/status", (req, res) => { res.json({ connected: !!chppTokenGlobal }); });
app.post("/api/admin/settoken", requireAdmin, (req, res) => {
  const { key, secret } = req.body;
  if (!key || !secret) return res.status(400).json({ error: "Faltan key/secret" });
  chppTokenGlobal = { key, secret };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(chppTokenGlobal));
  res.json({ ok: true });
});
app.get("/api/admin/teams", requireAdmin, (req, res) => {
  res.json(readEquipos());
});

app.post("/api/admin/scan", requireAdmin, requireChpp, async (req, res) => {
  const { seriesID } = req.body;
  try {
    const seriesXml = await chppGet("leagueDetails", chppTokenGlobal, { leagueLevelUnitID: seriesID });
    const leagueName = (seriesXml.match(/<LeagueName>(.*?)<\/LeagueName>/) || [])[1] || "";
    const leagueLevel = (seriesXml.match(/<LeagueLevel>(.*?)<\/LeagueLevel>/) || [])[1] || "";
    const groupName = (seriesXml.match(/<LeagueLevelUnitName>(.*?)<\/LeagueLevelUnitName>/) || [])[1] || "";
    const teamBlocks = extractAll(seriesXml, "Team");
    const teamNames = teamBlocks.map(b => { const m = b.match(/<TeamName>(.*?)<\/TeamName>/); return m ? m[1] : null; }).filter(Boolean);
    const teamIds = teamBlocks.map(b => { const m = b.match(/<TeamID>(.*?)<\/TeamID>/); return m ? m[1] : null; });

    const now = new Date().toISOString();
    const equipos = readEquipos();
    let escaneados = 0;
    const resumen = [];
    const errores = [];
    for (let i = 0; i < teamNames.length; i++) {
      const name = teamNames[i];
      const teamId = teamIds[i];
      let canterano = 1;
      let nonHomegrownCount = 0;
      let nonHomegrownNames = [];
      let playedNonHomegrown = [];
      let totalActivos = 0;
      let canteranosActivos = 0;
      try {
        const playersXml = await chppGet("players", chppTokenGlobal, { teamID: teamId });
        const playerBlocks = extractAll(playersXml, "Player");
        const playerIds = playerBlocks.map(b => { const m = b.match(/<PlayerID>(.*?)<\/PlayerID>/); return m ? m[1] : null; }).filter(Boolean);
        const homegrownMap = {};
        const nameMap = {};
        // fetch playerDetails in parallel
        await Promise.all(playerIds.map(async (pid) => {
          try {
            const pdXml = await chppGet("playerDetails", chppTokenGlobal, { playerID: pid, version: "3.3" });
            const nm = pdXml.match(/<FirstName>(.*?)<\/FirstName>/);
            const lm = pdXml.match(/<LastName>(.*?)<\/LastName>/);
            const hm = pdXml.match(/<MotherClubBonus>(.*?)<\/MotherClubBonus>/);
            const tsi = pdXml.match(/<TSI>(.*?)<\/TSI>/);
            const sal = pdXml.match(/<Salary>(.*?)<\/Salary>/);
            const inj = pdXml.match(/<InjuryLevel>(.*?)<\/InjuryLevel>/);
            const tsiVal = tsi ? parseInt(tsi[1]) : 0;
            const salVal = sal ? parseInt(sal[1]) : 0;
            const injVal = inj ? parseInt(inj[1]) : -1;
            const esEntrenador = /<TrainerData>[\s\S]*?<\/TrainerData>/.test(pdXml) && !/<TrainerData\s*\/>/.test(pdXml);
            const activo = !(tsiVal === 0 && salVal === 0 && injVal === 999) && !esEntrenador;
            if (!activo) { homegrownMap[pid] = null; nameMap[pid] = ((nm ? nm[1] : "") + " " + (lm ? lm[1] : "")).trim(); return; }
            totalActivos++;
            const isHomegrown = hm ? /true|1/i.test(hm[1]) : null;
            homegrownMap[pid] = isHomegrown;
            nameMap[pid] = ((nm ? nm[1] : "") + " " + (lm ? lm[1] : "")).trim();
            if (isHomegrown === true) canteranosActivos++;
            if (isHomegrown === false) { nonHomegrownCount++; nonHomegrownNames.push(nameMap[pid]); }
          } catch (e) {
            homegrownMap[pid] = null;
            nameMap[pid] = pid;
          }
        }));
        if (nonHomegrownCount > 3) { canterano = 0; }
        else {
          const matchesXml = await chppGet("matches", chppTokenGlobal, { teamID: teamId });
          const matchIds = extractAll(matchesXml, "MatchID").slice(0, 16);
          const matchDetails = await Promise.all(matchIds.map(mid => chppGet("matchdetails", chppTokenGlobal, { matchID: mid })));
          const playedPlayers = new Set();
          matchDetails.forEach(md => extractAll(md, "PlayerID").forEach(pid => playedPlayers.add(pid)));
          for (const pid of playedPlayers) {
            if (homegrownMap[pid] === false) { canterano = 0; playedNonHomegrown.push(nameMap[pid] || pid); }
          }
        }
      } catch (e) { canterano = 0; errores.push(name + ": " + e.message); }

      escaneados++;
      resumen.push({ nombre: name, nonHomegrownCount, canterano, nonHomegrownNames, playedNonHomegrown, totalJugadores: totalActivos, canteranos: canteranosActivos });
      const exists = equipos.find(e => e.nombre === name);
      const estado = exists ? (canterano ? "publicado" : "pendiente") : (canterano ? "pendiente" : "pendiente");
      if (exists) {
        exists.canterano = canterano; exists.division = "Grupo " + seriesID; exists.grupo = seriesID; exists.fecha_escaneo = now; exists.estado = canterano ? exists.estado : "pendiente"; exists.totalJugadores = totalActivos; exists.canteranos = canteranosActivos;
      } else {
        equipos.push({ id: Date.now() + Math.random(), nombre: name, canterano, division: "Grupo " + seriesID, grupo: seriesID, estado: canterano ? "pendiente" : "pendiente", fecha_escaneo: now, totalJugadores: totalActivos, canteranos: canteranosActivos });
      }
    }
    writeEquipos(equipos);
    res.json({ ok: true, escaneados, resumen, grupo: { id: seriesID, pais: leagueName, division: leagueLevel, nombre: groupName }, errores });
  } catch (e) { console.error("ERROR:", e); const msg = (e.statusCode === 401) ? "Token inválido o expirado. Reconecta con Hattrick." : e.message; res.status(500).json({ error: msg }); }
});

app.post("/api/admin/relocate", requireAdmin, (req, res) => {
  const equipos = readEquipos().map(e => ({ ...e, fecha_escaneo: new Date().toISOString() }));
  writeEquipos(equipos);
  res.json({ ok: true });
});

app.post("/api/admin/publish", requireAdmin, (req, res) => {
  const equipos = readEquipos();
  const e = equipos.find(x => x.id == req.body.id);
  if (e) { e.estado = "publicado"; writeEquipos(equipos); }
  res.json({ ok: true });
});
app.post("/api/admin/unpublish", requireAdmin, (req, res) => {
  const equipos = readEquipos();
  const e = equipos.find(x => x.id == req.body.id);
  if (e) { e.estado = "pendiente"; writeEquipos(equipos); }
  res.json({ ok: true });
});

app.post("/api/admin/generate", requireAdmin, (req, res) => {
  const teams = readEquipos().filter(e => e.estado === "publicado").sort((a,b) => (a.division+a.grupo+a.nombre).localeCompare(b.division+b.grupo+b.nombre));
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
  let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CanteraPower</title><link rel="stylesheet" href="styles.css"></head><body><header class="header"><h1>CanteraPower</h1><p class="subtitle">Equipos canteranos de Hattrick</p></header><main class="container"><section class="panel"><h2>Listas públicas</h2><div class="list">`;
  teams.forEach(t => {
    const heart = t.canterano ? '<span class="heart">♥</span>' : "";
    html += `<div class="item">${heart}${t.nombre} <small>${t.division} / ${t.grupo}</small></div>`;
  });
  html += `</div></section></main></body></html>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html);
  fs.copyFileSync(path.join(__dirname, "styles.css"), path.join(PUBLIC_DIR, "styles.css"));
  res.json({ ok: true, archivo: "public/index.html", total: teams.length });
});

app.post("/api/admin/push", requireAdmin, async (req, res) => {
  if (!req.body.confirm) return res.status(400).json({ error: "Confirmación requerida" });
  if (!GIT_REPO) return res.status(400).json({ error: "GIT_REPO no configurado" });
  try {
    const git = simpleGit(PUBLIC_DIR);
    await git.init();
    await git.add(".");
    await git.commit("Actualización CanteraPower");
    await git.push(GIT_REPO, "main").catch(() => git.push(GIT_REPO, "master"));
    res.json({ ok: true, mensaje: "Publicado en git" });
  } catch (e) { console.error("ERROR:", e); const msg = (e.statusCode === 401) ? "Token inválido o expirado. Reconecta con Hattrick." : e.message; res.status(500).json({ error: msg }); }
});

console.log("CHPP_CONSUMER_KEY definido:", !!process.env.CHPP_CONSUMER_KEY, "longitud:", (process.env.CHPP_CONSUMER_KEY || "").length);
console.log("CHPP_CONSUMER_SECRET definido:", !!process.env.CHPP_CONSUMER_SECRET, "longitud:", (process.env.CHPP_CONSUMER_SECRET || "").length);
function contarNoCanteranos(jugadores) {
  return jugadores.filter(j => j.motherClubBonus === false).length;
}

function esCanterano(jugadores, partidosJugados) {
  if (contarNoCanteranos(jugadores) > 3) return false;
  const idSet = partidosJugados instanceof Set ? partidosJugados : new Set(partidosJugados);
  for (const id of idSet) {
    const j = jugadores.find(x => x.id === id);
    if (j && j.motherClubBonus === false) return false;
  }
  return true;
}

function filtrarEquiposCanteranos(equipos) {
  return equipos.filter(e => e.canterano === true);
}

module.exports = { esCanterano, contarNoCanteranos, filtrarEquiposCanteranos };

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CanteraPower local en http://localhost:${PORT}`));
}