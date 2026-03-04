async function loadPrices(forceUpdate = false) {
  const contenedor = document.getElementById("contenedor");

  const municipioId = document.getElementById("selectMunicipio").value;

  const CACHE_KEY = `repsol_cache_${municipioId}`;
  const CACHE_TIME = 10 * 60 * 1000;

  // Lógica de Caché
  const cacheData = localStorage.getItem(CACHE_KEY);
  if (cacheData && !forceUpdate) {
    const parsedCache = JSON.parse(cacheData);
    if (Date.now() - parsedCache.timestamp < CACHE_TIME) {
      console.log("Cargando desde Cache");
      renderizar(parsedCache.data);
      return;
    }
  }

  // Llamada API
  console.log("llamada API");
  contenedor.innerHTML = "<p>Actualizando precios...</p>";
  try {
    const respuesta = await fetch(
      `https://api.precioil.es/estaciones/municipio/${municipioId}`,
    );
    if (!respuesta.ok) throw new Error("Error de conexión");

    const gasolineras = await respuesta.json();

    /**let repsol = gasolineras.filter((g) =>
      g.marca?.toLowerCase().includes("repsol"),
    );**/

    // let repsol = gasolineras.filter((g) => g.Gasolina95);

    let repsol = gasolineras
      .filter((g) => g.Gasolina95)
      .filter((g) => g.marca?.toLowerCase().includes("repsol"));

    //Ordenar por precios
    repsol.sort((a, b) => {
      const precioA = parseFloat(a.Gasolina95);
      const precioB = parseFloat(b.Gasolina95);
      return precioA - precioB;
    });

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: repsol,
      }),
    );

    renderizar(repsol);
  } catch (error) {
    contenedor.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

function renderizar(lista) {
  const contenedor = document.getElementById("contenedor");
  contenedor.innerHTML =
    lista.length === 0 ? "<p>No hay estaciones Repsol disponibles.</p>" : "";

  date = new Date();
  lista.forEach((g, indice) => {
    const div = document.createElement("div");
    div.className = "card";

    const etiquetaBarata =
      indice === 0
        ? '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 5px; font-size: 0.7rem;">¡EL MEJOR PRECIO!</span><br>'
        : "";

    div.innerHTML = `
     ${etiquetaBarata}
      <strong>${g.nombreEstacion}</strong>
      <small>${g.direccion}</small>
      <div class="precio-row">
        <span class="gasolina">Gasolina 95: ${g.Gasolina95}€</span>
        <span class="diesel">Diesel: ${g.Diesel}€</span>
      </div>`;
    contenedor.appendChild(div);
  });
}

// Eventos
document
  .getElementById("botonCargar")
  .addEventListener("click", () => loadPrices(true));
window.addEventListener("DOMContentLoaded", () => loadPrices());
document
  .getElementById("selectMunicipio")
  .addEventListener("change", () => loadPrices());
