(() => {
  // ==============================
  // Global Variables and Constants
  // ==============================
  const width = 960,
    height = 600;
  const stateMapUrl = "https://rcpope.github.io/map-resources/congressional_map.geojson";
  const districtMapUrl = "https://rcpope.github.io/map-resources/neilson_map.geojson";

  let currentMapType = "state"; // Default map type
  let originalFeatures = []; // Global storage for loaded features
  let filter = ""; // Filter term for search

  // ========================
  // Projection and Geo Path
  // ========================
  const projection = d3.geoAlbersUsa();
  const path = d3.geoPath().projection(projection);

  // ======================
  // Initialize SVG Element
  // ======================
  const svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // =========================
  // Adjust Projection to Fit
  // =========================
  const adjustProjectionToFit = (geojsonData) => {
  const bounds = path.bounds(geojsonData); // Calculate map bounds
  const scale = 0.95 / Math.max(
    (bounds[1][0] - bounds[0][0]) / width,
    (bounds[1][1] - bounds[0][1]) / height
  );
  const translate = [
    (width - scale * (bounds[1][0] + bounds[0][0])) / 2,
    (height - scale * (bounds[1][1] + bounds[0][1])) / 2
  ];
  projection.scale(scale).translate(translate); // Update projection
};

  // ========================
  // Feature Rendering Logic
  // ========================
  const renderFeatures = (features) => {
  svg.selectAll("*").remove(); // Clear existing map content

  svg
    .append("g")
    .attr("class", "map-group")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ccc")
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      d3.select(event.target).attr("fill", "orange");
      showTooltip(d.properties.name || "Unknown", event); // Show tooltip
    })
    .on("mouseout", (event) => {
      d3.select(event.target).attr("fill", "#ccc"); // Reset fill color
      hideTooltip(); // Hide tooltip
    })
    .on("click", (event, d) => {
      if (d.properties) {
        const { stateCd, district, id, name } = d.properties;
        showDistrictDetails(stateCd || "Unknown", district || id || "Unknown", id || "Unknown", name || "Unknown");
      }
    });
};

  // =======================
  // Map Data Loading Logic
  // =======================
  const loadData = () => {
    const filteredFeatures = originalFeatures.filter((f) =>
      (f.properties.name || "").toLowerCase().includes(filter)
    );
    renderFeatures(filteredFeatures);
  };

  const loadMap = (type) => {
  const url = type === "state" ? stateMapUrl : districtMapUrl;

  d3.json(url)
    .then((data) => {
      const features = data.features; // Access GeoJSON features directly

      if (!features) {
        console.error("Features could not be extracted from the map data.");
        return;
      }

      originalFeatures = features; // Save the loaded features globally
      adjustProjectionToFit({ type: "FeatureCollection", features }); // Adjust projection dynamically
      renderFeatures(features); // Render features on the map

      console.log(`Loaded ${type === "state" ? "state map" : "district map"} successfully.`);
    })
    .catch((error) => {
      console.error("Error loading map data:", error);
    });
};

  // ==============================
  // Map Functionality
  // ==============================
  document.addEventListener("DOMContentLoaded", () => {
    const stateButton = document.getElementById("stateButton");
    const districtButton = document.getElementById("districtButton");

    if (stateButton && districtButton) {
      stateButton.addEventListener("click", () => toggleMap("state", stateButton, districtButton));
      districtButton.addEventListener("click", () => toggleMap("dma", districtButton, stateButton));
    }

    loadMap("state"); // Load initial state map
  });

  const toggleMap = (type, activeButton, inactiveButton) => {
    if (currentMapType !== type) {
      currentMapType = type;
      loadMap(type);
      activeButton.classList.add("active");
      inactiveButton.classList.remove("active");
    }
  };

  // ==================
  // Tooltip Management
  // ==================
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "custom-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden");

  const showTooltip = (content, event) => {
    if (!event) return;

    const pageX = event.pageX || (event.touches && event.touches[0]?.pageX);
    const pageY = event.pageY || (event.touches && event.touches[0]?.pageY);

    tooltip
      .style("left", `${pageX + 10}px`)
      .style("top", `${pageY - 20}px`)
      .style("visibility", "visible")
      .html(content);
  };

  const hideTooltip = () => {
    tooltip.style("visibility", "hidden");
  };
})();
