(() => {
  // ==============================
  // Global Variables and Constants
  // ==============================
  const width = 960,
    height = 600;
  const stateMapUrl = "https://rcpope.github.io/map-resources/congressional_map.json";
  const districtMapUrl = "https://rcpope.github.io/map-resources/dma_map.json";

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

  // ======================
  // Initialize Input Box
  // ======================
  const inputBox = d3
    .select("body")
    .append("input")
    .attr("type", "text")
    .attr("placeholder", "Filter by state or district")
    .style("margin-bottom", "10px")
    .style("padding", "5px")
    .style("width", "100%")
    .on("input", function () {
      filter = this.value.toLowerCase();
      loadData(); // Call loadData() to apply the filter
    });

  // =========================
  // Adjust Projection to Fit
  // =========================
  const adjustProjectionToFit = (geojsonData) => {
    const bounds = path.bounds(geojsonData); // Calculate bounds
    const scale = 0.95 / Math.max(
      (bounds[1][0] - bounds[0][0]) / width,
      (bounds[1][1] - bounds[0][1]) / height
    );
    const translate = [
      (width - scale * (bounds[1][0] + bounds[0][0])) / 2,
      (height - scale * (bounds[1][1] + bounds[0][1])) / 2,
    ];
    projection.scale(scale).translate(translate);
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

    const tooltipWidth = tooltip.node().offsetWidth;
    const tooltipHeight = tooltip.node().offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    tooltip
      .style("left", Math.min(pageX + 10, windowWidth - tooltipWidth) + "px")
      .style("top", Math.min(pageY - 20, windowHeight - tooltipHeight) + "px")
      .style("visibility", "visible")
      .html(content);
  };

  const hideTooltip = () => {
    tooltip.style("visibility", "hidden");
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
      .attr("fill", (d) => {
        const fillColor = d.properties.fill || "#ccc";
        d3.select(this).attr("data-original-fill", fillColor); // Set original fill
        return fillColor;
      })
      .attr("stroke", "#333")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "orange");
        showTooltip(d.properties.name || "Unknown", event);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", d3.select(this).attr("data-original-fill"));
        hideTooltip();
      })
      .on("click", (event, d) => {
        console.log(`Clicked on: ${d.properties.name || "Unknown"}`);
      });
  };

  // =======================
  // Map Data Loading Logic
  // =======================
  const loadData = () => {
    const filteredFeatures = originalFeatures.filter((f) =>
      f.properties.name.toLowerCase().includes(filter)
    );
    renderFeatures(filteredFeatures);
  };

  const loadMap = (type) => {
    d3.json(type === "state" ? stateMapUrl : districtMapUrl, (error, data) => {
      if (error) throw error;

      const features =
        type === "state" ? data.features : topojson.feature(data, data.objects.nielsen_dma).features;

      originalFeatures = features; // Store features globally for filtering
      adjustProjectionToFit({ type: "FeatureCollection", features });
      renderFeatures(features);
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
    } else {
      console.error("State or District button not found in the DOM.");
    }

    loadMap("state"); // Load initial map
  });

  const toggleMap = (type, activeButton, inactiveButton) => {
    if (currentMapType !== type) {
      currentMapType = type;
      loadMap(type);
      activeButton.classList.add("active");
      inactiveButton.classList.remove("active");
    }
  };
})();
