async function loadPrices(forceUpdate = false) {
  const contenedor = document.getElementById("contenedor");

  const municipioId = document.getElementById("selectMunicipio").value;
  const tipoGasolina = document.getElementById("selectTipoGasolina").value;
  const marcaSeleccionada = document.getElementById(
    "selectMarcaGasolinera",
  ).value;

  const CACHE_KEY = `gasolinera_cache_${municipioId}`;
  const CACHE_TIME = 10 * 60 * 1000;

  // Lógica de Caché
  const cacheData = localStorage.getItem(CACHE_KEY);
  const now = Date.now();

  if (cacheData) {
    const parsedCache = JSON.parse(cacheData);
    const timeElapsed = now - parsedCache.timestamp;
    if (forceUpdate && timeElapsed < CACHE_TIME) {
      const minutesLeft = Math.ceil((CACHE_TIME - timeElapsed) / 60000);
      alert(
        `Los precios están actualizados. Intenta de nuevo en ${minutesLeft} min.`,
      );
      return;
    }
    if (!forceUpdate && timeElapsed < CACHE_TIME) {
      console.log("Cargando desde Cache");
      const result = filterSorting(
        parsedCache.data,
        marcaSeleccionada,
        tipoGasolina,
      );
      renderizar(result, tipoGasolina);
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

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: gasolineras,
      }),
    );

    const final = filterSorting(gasolineras, marcaSeleccionada, tipoGasolina);
    renderizar(final, tipoGasolina);
  } catch (error) {
    contenedor.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

function renderizar(lista, tipoGasolina) {
  const contenedor = document.getElementById("contenedor");
  contenedor.innerHTML =
    lista.length === 0
      ? "<p>No hay estaciones de gasolinera disponibles.</p>"
      : "";

  lista.forEach((g, indice) => {
    const lastIndex = lista.length - 1;
    const div = document.createElement("div");
    div.className = "card";

    let badgeHTML = "";

    if (indice === 0 && lista.length > 1) {
      badgeHTML = '<span class="best-price-badge">OFERTA MÁS BARATA</span>';
    } else if (indice === lastIndex && lista.length > 1) {
      const precioPrimero = parseFloat(
        lista[0][tipoGasolina].replace(",", "."),
      );
      const precioUltimo = parseFloat(g[tipoGasolina].replace(",", "."));

      if (precioUltimo > precioPrimero) {
        badgeHTML = '<span class="worst-price-badge">OFERTA MÁS CARA</span>';
      }
    }

    div.innerHTML = `
  ${badgeHTML}
  <strong class="estacion-nombre">${g.nombreEstacion}</strong>
  <br>
  <small class="estacion-dir">${g.direccion}</small>
  
  <div class="precio-row">
    <div class="col-combustible">
      <span class="label-gas">Gasolina 95</span>
      <b class="valor-precio">${g.Gasolina95 ? g.Gasolina95 : "No disponible"}€</b>
    </div>
    <div class="col-combustible">
      <span class="label-gas">Diesel</span>
      <b class="valor-precio">${g.Diesel ? g.Diesel : "No disponible"}€</b>
    </div>
  </div>`;
    contenedor.appendChild(div);
  });
}

function filterSorting(list, brand, tipoGasolina) {
  let result = list;

  console.log(result);
  if (brand !== "todas") {
    result = list.filter((g) =>
      g.marca?.toLowerCase().includes(brand.toLowerCase()),
    );
  }
  result = result.filter(
    (g) =>
      g[tipoGasolina] !== undefined &&
      g[tipoGasolina] !== null &&
      g[tipoGasolina] !== "",
  );
  return result.sort(
    (a, b) => parseFloat(a[tipoGasolina]) - parseFloat(b[tipoGasolina]),
  );
}

// Eventos
document
  .getElementById("botonCargar")
  .addEventListener("click", () => loadPrices(true));
window.addEventListener("DOMContentLoaded", () => loadPrices());
document
  .getElementById("selectMunicipio")
  .addEventListener("change", () => loadPrices());
document
  .getElementById("selectTipoGasolina")
  .addEventListener("change", () => loadPrices());
document
  .getElementById("selectMarcaGasolinera")
  .addEventListener("change", () => loadPrices());
