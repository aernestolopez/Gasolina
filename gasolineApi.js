async function loadPrices(forceUpdate = false) {
  const contenedor = document.getElementById("contenedor");

  const municipioId = document.getElementById("selectMunicipio").value;
  const tipoGasolina = document.getElementById("selectTipoGasolina").value;
  const CACHE_KEY = `repsol_cache_${municipioId}`;
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
      parsedCache.data.sort((a, b) => {
        const precioA = parseFloat(a[tipoGasolina]);
        const precioB = parseFloat(b[tipoGasolina]);
        return precioA - precioB;
      });
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
      //console.log(a["Diesel"]);
      const precioA = parseFloat(a[tipoGasolina]);
      const precioB = parseFloat(b[tipoGasolina]);
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
    const lastIndex = lista.length - 1;
    const div = document.createElement("div");
    div.className = "card";

    const etiquetaBarata =
      indice === 0
        ? '<span class="best-price-badge">OFERTA MÁS BARATA</span>'
        : "";

    const etiquetaCara =
      indice === lastIndex && lista[0].Gasolina95 != lista[lastIndex].Gasolina95
        ? '<span class="worst-price-badge">OFERTA MÁS CARA</span>'
        : "";

    div.innerHTML = `
  ${etiquetaBarata}
  ${etiquetaCara}
  <strong class="estacion-nombre">${g.nombreEstacion}</strong>
  <br>
  <small class="estacion-dir">${g.direccion}</small>
  
  <div class="precio-row">
    <div class="col-combustible">
      <span class="label-gas">Gasolina 95</span>
      <b class="valor-precio">${g.Gasolina95}€</b>
    </div>
    <div class="col-combustible">
      <span class="label-gas">Diesel</span>
      <b class="valor-precio">${g.Diesel}€</b>
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
document
  .getElementById("selectTipoGasolina")
  .addEventListener("change", () => loadPrices());
