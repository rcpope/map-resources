(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const width = 960;
    const height = 600;
    const usDataUrl = "https://your-hosting-url/usData.json"; // Replace with actual data URL
    const congressDataUrl = "https://your-hosting-url/congressData.json"; // Replace with actual data URL
    let filter = "";

    const svg = d3.select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("tabindex", 0); // Make SVG focusable for keyboard accessibility

    // Tooltip setup
    const tooltip = d3.select("body")
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

    const projection = d3.geoAlbersUsa().scale(1200).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    const renderFeatures = (svg, features, options = {}) => {
      const filteredFeatures = features.filter(feature => {
        const name = feature.properties.name || feature.properties.id;
        return name && name.toLowerCase().includes(filter);
      });

      svg.append("g")
        .selectAll("path")
        .data(filteredFeatures)
        .enter()
        .append("path")
        .attr("class", options.className || "feature")
        .attr("d", path)
        .attr("fill", function (d) {
          const fillColor = options.fill ? options.fill(d) : "#ccc";
          d3.select(this).attr("data-original-fill", fillColor); // Save original fill
          return fillColor;
        })
        .attr("stroke", options.stroke || "#333")
        .attr("role", options.role || "region")
        .attr("aria-label", d => (options.getAriaLabel ? options.getAriaLabel(d) : ""))
        .on("mouseover", options.onMouseOver || null)
        .on("mouseout", options.onMouseOut || null)
        .on("click", options.onClick || null);
    };

    const handleMouseOver = (event, d) => {
      d3.select(event.target).attr("fill", "orange");
      showTooltip(
        `<strong>${d.properties.name ? "State" : "District"} ID:</strong> ${d.properties.name || d.properties.id}`,
        event
      );
    };

    const handleMouseOut = event => {
      const element = d3.select(event.target);
      const originalFill = element.attr("data-original-fill");
      element.attr("fill", originalFill);
      hideTooltip();
    };

    const handleClick = d => {
      console.log(`Clicked on ${d.properties.name || d.properties.id}`);
      showDistrictDetails(d.properties.id); // Integrate lightbox functionality
    };

    const generateColor = id => `hsl(${Math.random() * 360}, 50%, 70%)`;

    const loadData = async () => {
      try {
        const [usData, congressData] = await Promise.all([
          d3.json(usDataUrl).catch(err => {
            console.error("Failed to load US data:", err);
            throw err;
          }),
          d3.json(congressDataUrl).catch(err => {
            console.error("Failed to load Congress data:", err);
            throw err;
          }),
        ]);

        svg.selectAll("*").remove(); // Clear existing content

        const states = topojson.feature(usData, usData.objects.states).features;
        const districts = topojson.feature(congressData, congressData.objects.districts).features;

        renderFeatures(svg, states, {
          className: "state",
          fill: "#ccc",
          stroke: "#333",
          getAriaLabel: d => `State: ${d.properties.name}`,
          onMouseOver: handleMouseOver,
          onMouseOut: handleMouseOut,
          onClick: handleClick,
        });

        renderFeatures(svg, districts, {
          className: "district",
          fill: d => generateColor(d.properties.id),
          stroke: "#fff",
          getAriaLabel: d => `District: ${d.properties.id}`,
          onMouseOver: handleMouseOver,
          onMouseOut: handleMouseOut,
          onClick: handleClick,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

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

    setupDistrictDetailBoxes(); // Ensure this function is defined or imported
    loadData();
  });
})();
