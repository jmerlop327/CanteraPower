async function checkConnection() {
  const r = await fetch("/api/status");
  const d = await r.json();
  const btn = document.getElementById("btnConnect");
  const st = document.getElementById("connStatus");
  if (d.connected) {
    btn.style.display = "none";
    st.textContent = "Conexión con Hattrick OK";
    st.classList.remove("empty");
  } else {
    btn.style.display = "inline-block";
    st.textContent = "Sin conexión con Hattrick";
  }
}
checkConnection();

async function loadPublic() {
  const r = await fetch("/api/public/teams");
  const teams = await r.json();
  const cont = document.getElementById("publicas");
  if (!cont) return;
  cont.innerHTML = "";
  if (!teams.length) { cont.innerHTML = '<div class="empty">Sin equipos publicados</div>'; return; }
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `<thead><tr><th>Equipo</th><th>Total jugadores</th><th>Jugadores canteranos</th><th>Canterano</th></tr></thead>`;
  const tbody = document.createElement("tbody");
  teams.forEach(t => {
    const tr = document.createElement("tr");
    const heart = t.canterano ? '<span class="heart">♥</span>' : "";
    tr.innerHTML = `<td>${heart}${t.nombre}</td><td>${t.totalJugadores || 0}</td><td>${t.canteranos || 0}</td><td><button data-id="${t.id}" data-action="unpublish" class="btn btn-small">Despublicar</button></td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  cont.appendChild(table);
  cont.querySelectorAll("button").forEach(b => {
    b.onclick = async () => {
      await fetch("/api/admin/unpublish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.dataset.id }) });
      loadPublic(); loadAdmin();
    };
  });
}
loadPublic();

async function loadAdmin() {
  const r = await fetch("/api/admin/teams");
  if (!r.ok) return;
  const teams = await r.json();
  const cont = document.getElementById("pendientes");
  cont.innerHTML = "";
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = `<thead><tr><th>Equipo</th><th>Total jugadores</th><th>Jugadores canteranos</th><th>Canterano</th></tr></thead>`;
  const tbody = document.createElement("tbody");
  teams.forEach(t => {
    const tr = document.createElement("tr");
    let cell4;
    if (!t.canterano) {
      cell4 = `<span class="empty">NO</span>`;
    } else if (t.estado === "publicado") {
      cell4 = `<button data-id="${t.id}" data-action="unpublish" class="btn btn-small">Despublicar</button>`;
    } else {
      cell4 = `<button data-id="${t.id}" data-action="publish" class="btn btn-small">Publicar</button>`;
    }
    tr.innerHTML = `<td>${t.nombre}</td><td>${t.totalJugadores || 0}</td><td>${t.canteranos || 0}</td><td>${cell4}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  cont.appendChild(table);
  cont.querySelectorAll("button").forEach(b => {
    b.onclick = async () => {
      const url = b.dataset.action === "unpublish" ? "/api/admin/unpublish" : "/api/admin/publish";
      if (b.dataset.action === "unpublish" && !confirm("¿Despublicar este equipo?")) return;
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.dataset.id }) });
      loadAdmin(); loadPublic();
    };
  });
}

document.getElementById("btnScan").onclick = async () => {
  const seriesID = document.getElementById("seriesID").value;
  const btn = document.getElementById("btnScan");
  const loading = document.getElementById("loading");
  btn.disabled = true;
  loading.style.display = "block";
  try {
    const r = await fetch("/api/admin/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seriesID }) });
    const d = await r.json();
    if (!r.ok) { alert("Error: " + (d.error || r.status)); return; }
    const g = d.grupo || {};
    document.getElementById("grupoInfo").textContent = `Grupo: ${g.id || ""} | País: ${g.pais || ""} | División: ${g.division || ""} | ${g.nombre || ""}`;
    if (d.errores && d.errores.length) {
      alert("Escaneo finalizado con errores parciales");
      console.error("Errores de scan:", d.errores);
    } else {
      alert("Escaneo finalizado");
    }
    loadAdmin();
  } finally {
    btn.disabled = false;
    loading.style.display = "none";
  }
};

document.getElementById("btnGenerate").onclick = async () => {
  const r = await fetch("/api/admin/generate", { method: "POST" });
  const d = await r.json();
  document.getElementById("status").innerHTML = `Generado: <a href="/${d.archivo}" target="_blank">${d.archivo}</a> (${d.total} equipos)`;
};

document.getElementById("btnPush").onclick = async () => {
  if (!confirm("¿Confirmas publicar en git?")) return;
  const r = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true }) });
  const d = await r.json();
  document.getElementById("status").textContent = d.mensaje || d.error;
};