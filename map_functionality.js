(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const width = 960;
    const height = 600;

    // Add URLs for state and district maps
    const stateMapUrl = "https://rcpope.github.io/map-resources/congress_map.geojson";
    const districtMapUrl = "https://rcpope.github.io/map-resources/neilson_map.geojson";

    let currentMapUrl = stateMapUrl; // Default to state map
    let filter = ""; // Filter for searching by state or district

    // Add event listener for toggle button
    document.querySelector("#toggle-map").addEventListener("click", toggleMapType);

    // Function to toggle map types
    const toggleMapType = () => {
      currentMapUrl = currentMapUrl === stateMapUrl ? districtMapUrl : stateMapUrl;
      loadData(); // Reload map data
    };

    // Initialize SVG
    const svg = d3
      .select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("tabindex", 0); // Make SVG focusable for keyboard accessibility

    // Tooltip setup
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "custom-tooltip") // Add a class for consistent styling
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    // Function to show the tooltip
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

    // Function to hide the tooltip
    const hideTooltip = () => {
      tooltip.style("visibility", "hidden");
    };

    // Define map projection and path
    const projection = d3.geoAlbersUsa().scale(1200).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Function to render map features
    const renderFeatures = (svg, features, options = {}) => {
      const filteredFeatures = features.filter((feature) => {
        const name = feature.properties.name || feature.properties.id;
        return name && name.toLowerCase().includes(filter);
      });

      svg
        .append("g")
        .selectAll("path")
        .data(filteredFeatures)
        .enter()
        .append("path")
        .attr("class", options.className || "feature")
        .attr("d", path)
        .attr("fill", (d) => {
          const fillColor = options.fill ? options.fill(d) : "#ccc";
          d3.select(this).attr("data-original-fill", fillColor); // Save original fill
          return fillColor;
        })
        .attr("stroke", options.stroke || "#333")
        .attr("role", options.role || "region")
        .attr("aria-label", (d) => (options.getAriaLabel ? options.getAriaLabel(d) : ""))
        .on("mouseover", options.onMouseOver || null)
        .on("mouseout", options.onMouseOut || null)
        .on("click", options.onClick || null);
    };

    // Hover interactions
    const handleMouseOver = (event, d) => {
      d3.select(event.target).attr("fill", "orange");
      showTooltip(
        `<strong>${d.properties.name ? "State" : "District"} ID:</strong> ${
          d.properties.name || d.properties.id
        }`,
        event
      );
    };

    const handleMouseOut = (event) => {
      const element = d3.select(event.target);
      const originalFill = element.attr("data-original-fill");
      element.attr("fill", originalFill);
      hideTooltip();
    };

    // Click interactions
    const handleClick = (d) => {
      if (!d.properties) {
        console.error("Missing properties in GeoJSON data", d);
        return;
      }

      console.log(`Clicked on ${d.properties.name || d.properties.id}`);
      showDistrictDetails(d.properties.id); // Integrate lightbox functionality
    };

    // Generate a random color
    const generateColor = (id) => `hsl(${Math.random() * 360}, 50%, 70%)`;

    // Function to load map data dynamically
    const loadData = async () => {
      try {
        const mapData = await d3.json(currentMapUrl);

        // Clear existing map content
        svg.selectAll("*").remove();

        const features = mapData.features || [];
        const states = features.filter((d) => d.properties.type === "state");
        const districts = features.filter((d) => d.properties.type === "district");

        // Render states
        renderFeatures(svg, states, {
          className: "state",
          fill: "#ccc",
          stroke: "#333",
          getAriaLabel: (d) => `State: ${d.properties.name}`,
          onMouseOver: handleMouseOver,
          onMouseOut: handleMouseOut,
          onClick: handleClick,
        });

        // Render districts
        renderFeatures(svg, districts, {
          className: "district",
          fill: (d) => generateColor(d.properties.id),
          stroke: "#fff",
          getAriaLabel: (d) => `District: ${d.properties.id}`,
          onMouseOver: handleMouseOver,
          onMouseOut: handleMouseOut,
          onClick: handleClick,
        });
      } catch (error) {
        console.error("Error loading map data:", error);
      }
    };

    // Add a filter input box
    d3.select("body")
      .append("input")
      .attr("type", "text")
      .attr("placeholder", "Filter by state or district")
      .style("margin-bottom", "10px")
      .style("padding", "5px")
      .style("width", "100%")
      .on("input", function () {
        filter = this.value.toLowerCase();
        loadData(); // Re-render the map with the updated filter
      });

    // Ensure lightbox setup and load initial map data
    setupDistrictDetailBoxes(); // Ensure this function is defined or imported
    loadData();
  });
})();
