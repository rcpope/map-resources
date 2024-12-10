(() => {
  // ==============================
  // Global Variables and Constants
  // ==============================
  const width = 960;
  const height = 600;

  const stateMapUrl = "https://rcpope.github.io/map-resources/congressional_map.geojson";
  const districtMapUrl = "https://rcpope.github.io/map-resources/neilson_map.geojson";

  let currentMapUrl = stateMapUrl; // Default map URL
  let filter = ""; // Filter term for search

  // ======================
  // Initialize SVG Element
  // ======================
  const svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("tabindex", 0); // Accessibility enhancement

  // ========================
  // Projection and Geo Path
  // ========================
  const projection = d3.geoAlbersUsa().scale(1500).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

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
      .style("visibility", "visible")
      .html(content)
      .style("top", `${pageY - 20}px`)
      .style("left", `${pageX + 10}px`);
  };

  const hideTooltip = () => {
    tooltip.style("visibility", "hidden");
  };

  // ========================
  // Feature Rendering Logic
  // ========================
  const renderFeatures = (features, options = {}) => {
    svg.selectAll("*").remove(); // Clear existing map content

    svg
      .append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", options.className || "feature")
      .attr("d", path)
      .attr("fill", (d) => options.fill(d))
      .attr("stroke", options.stroke || "#333")
      .on("mouseover", options.onMouseOver || null)
      .on("mouseout", options.onMouseOut || null)
      .on("click", options.onClick || null);
  };

  // ==========================
  // Event Handlers for Map Data
  // ==========================
  const handleMouseOver = (event, d) => {
    const name = d.properties.name || d.properties.id || "Unknown";
    d3.select(event.target).attr("fill", "orange");
    showTooltip(`<strong>${name}</strong>`, event);
  };

  const handleMouseOut = (event) => {
    const element = d3.select(event.target);
    const originalFill = element.attr("data-original-fill") || "#ccc";
    element.attr("fill", originalFill);
    hideTooltip();
  };

  const handleClick = (event, d) => {
    if (!d.properties) {
      console.error("Missing properties in GeoJSON data", d);
      return;
    }

    const stateCd = d.properties.stateCd || d.properties.state || "Unknown";
    const district = d.properties.district || d.properties.id || "Unknown";
    const id = d.properties.id || "Unknown";
    const lgu = d.properties.name || "Unknown";

    console.log(`Clicked on: StateCd=${stateCd}, District=${district}, ID=${id}, LGU=${lgu}`);
    showDistrictDetails(stateCd, district, id, lgu);
  };

  // =======================
  // Map Data Loading Logic
  // =======================
  const loadData = async () => {
    try {
      const mapData = await d3.json(currentMapUrl);

      const features = mapData.features || [];
      const options = currentMapUrl === stateMapUrl
        ? { className: "state", fill: () => "#ccc", onMouseOver: handleMouseOver, onMouseOut: handleMouseOut, onClick: handleClick }
        : { className: "district", fill: (d) => `hsl(${Math.random() * 360}, 50%, 70%)`, onMouseOver: handleMouseOver, onMouseOut: handleMouseOut, onClick: handleClick };

      renderFeatures(features, options);
    } catch (error) {
      console.error("Error loading map data:", error);
    }
  };

  // ===================
  // Dropdown Management
  // ===================
  const populateDropdown = (dropdown, data, type) => {
    dropdown.innerHTML = `<option disabled selected>Select a ${type}</option>`;
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.properties.id;
      option.textContent = `${type} ${item.properties.id}`;
      dropdown.appendChild(option);
    });
    dropdown.disabled = false;
  };

  // ==============================
// Map Functionality
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    // Map Type Toggle Buttons
    const stateButton = document.getElementById("stateButton");
    const districtButton = document.getElementById("districtButton");

    if (stateButton && districtButton) {
        stateButton.addEventListener("click", () => {
            if (currentMapUrl !== stateMapUrl) {
                currentMapUrl = stateMapUrl;
                stateButton.classList.add("active");
                districtButton.classList.remove("active");
                loadData();
            }
        });

        districtButton.addEventListener("click", () => {
            if (currentMapUrl !== districtMapUrl) {
                currentMapUrl = districtMapUrl;
                districtButton.classList.add("active");
                stateButton.classList.remove("active");
                loadData();
            }
        });
    } else {
        console.error("State or District button not found in the DOM.");
    }

    // Filter Functionality
    d3.select("body")
        .append("input")
        .attr("type", "text")
        .attr("placeholder", "Filter by state or district")
        .style("margin-bottom", "10px")
        .style("padding", "5px")
        .style("width", "100%")
        .on("input", function () {
            filter = this.value.toLowerCase();
            loadData();
        });

    // Initial Map Load
    setupDistrictDetailBoxes(); // Ensure this function is defined in district-details.js
    loadData();
});
