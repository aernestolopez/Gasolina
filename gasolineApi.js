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

  lista.forEach((g, indice) => {
    const div = document.createElement("div");
    div.className = "card";

    const etiquetaBarata =
      indice === 0
        ? '<span class="best-price-badge">OFERTA MÁS BARATA</span>'
        : "";

    div.innerHTML = `
      ${etiquetaBarata}
      <strong>${g.nombreEstacion}</strong>
      <small>${g.direccion}</small>
      <div class="precio-row">
        <div class="gasolina">
          <span>Gasolina 95</span>
          <b>${g.Gasolina95}€</b>
        </div>
        <div class="diesel">
          <span>Diesel</span>
          <b>${g.Diesel}€</b>
        </div>
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
