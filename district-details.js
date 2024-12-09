// district-details.js: Refactored for modern JavaScript practices

// Global variables (minimized scope)
let filteredGranteeDataCache = [];
let grantDetails = [];
let districtGrantResults = [];
const columnHeaderRenames = {
    grantee_nm: "Grantee Name",
    funding_type_nm: "Funding Type",
    award_amt: "Award Amount ($)",
    grant_num: "Award Number",
    accession_num: "Accession No.",
    award_start_dt: "Award Start Date",
    award_end_dt: "Award End Date",
    program_area_cd: "Program Area Code",
    program_area_nm: "Program Area",
    proposal_title: "Proposal Title",
};

const granteeSummaries = []; // Placeholder for grantee data
const selectedFilters = { award_year: "2024", funding_type: "All" }; // Example filters

/**
 * Filters grantee data based on the given parameters.
 * @param {string} stateCd - State code.
 * @param {string} district - District number.
 * @param {string} awardFy - Award fiscal year.
 * @param {string} fundingTypeNm - Funding type name.
 * @returns {Array} Filtered grantee data.
 */
const filterGranteeData = (stateCd, district, awardFy, fundingTypeNm) => {
    const numericDistrict = parseInt(district, 10); // Remove leading zeros
    const filteredData = granteeSummaries.filter(
        (d) =>
            d.award_fy === awardFy &&
            d.state_cd === stateCd &&
            d.district === numericDistrict
    );

    if (fundingTypeNm !== "All") {
        return filteredData.filter((d) => d.funding_type_nm === fundingTypeNm);
    }
    return filteredData;
};

/**
 * Filters grant data based on the given parameters.
 * @param {string} stateCd - State code.
 * @param {string} district - District number.
 * @param {string} awardFy - Award fiscal year.
 * @param {string} fundingTypeNm - Funding type name.
 * @returns {Array} Filtered grant data.
 */
const filterGrantData = (stateCd, district, awardFy, fundingTypeNm) => {
    const numericDistrict = parseInt(district, 10); // Remove leading zeros
    let filteredData = grantDetails.filter(
        (d) =>
            d.award_fy === awardFy &&
            d.state_cd === stateCd &&
            d.district === numericDistrict
    );

    if (fundingTypeNm !== "All") {
        filteredData = filteredData.filter((d) => d.funding_type_nm === fundingTypeNm);
    }
    return filteredData;
};

/**
 * Handles click events on map elements.
 * @param {Object} event - D3 event object.
 * @param {Object} d - Data bound to the clicked element.
 */
const handleClick = (event, d) => {
    if (!d.properties) {
        console.error("GeoJSON properties are missing", d);
        return;
    }

    const stateCd = d.properties.stateCd || d.properties.state;
    const district = d.properties.district || d.properties.id;
    const id = d.properties.id;
    const lgu = d.properties.name;

    showDistrictDetails(stateCd, district, id, lgu);
};

/**
 * Sets up the district detail lightbox for displaying information.
 */
const setupDistrictDetailBoxes = () => {
    const outerContainer = d3
        .select(".outer-container")
        .append("div")
        .attr("id", "lightbox")
        .style("display", "none");

    const tablesContainer = outerContainer.append("div").attr("id", "tables-container");

    // Title row
    tablesContainer.append("div").attr("id", "title-row");

    // Grant table container
    tablesContainer
        .append("div")
        .attr("class", "grant-table-container grant-details")
        .html("<b>This box is for Grant Details...</b>");

    // Prevent clicks inside the container from closing the lightbox
    d3.select("#tables-container").on("click", (event) => event.stopPropagation());
};

/**
 * Hides the district detail lightbox.
 */
const hideDistrictDetails = () => {
    d3.select("#lightbox").style("display", "none");
};

/**
 * Displays the district detail lightbox with the given parameters.
 * @param {string} stateCd - State code.
 * @param {string} district - District number.
 * @param {string} id - ID of the district.
 * @param {string} lgu - Local government unit.
 */
const showDistrictDetails = (stateCd, district, id, lgu) => {
    const numericDistrict = parseInt(district, 10);
    const awardFy = selectedFilters.award_year;
    const fundingTypeNm = selectedFilters.funding_type;

    // Display lightbox
    d3.select("#lightbox").style("display", "block");

    // Generate header content
    const headerText = `
        <div class="header">
            <h2>Fiscal Year: ${awardFy}, Funding Type: ${fundingTypeNm}, ${lgu || `${stateCd}-${numericDistrict}`}</h2>
            <button class="close-btn" aria-label="Close" onclick="hideDistrictDetails()">×</button>
        </div>`;
    d3.select("#title-row").html(headerText);

    // Populate grant table
    const filteredData = filterGrantData(stateCd, numericDistrict, awardFy, fundingTypeNm);
    populateDistrictGrantTable(filteredData);
};

/**
 * Populates the grant table in the district detail lightbox.
 * @param {Array} filteredData - Filtered grant data.
 */
const populateDistrictGrantTable = (filteredData) => {
    const container = ".grant-table-container";
    const columns = [
        "grantee_nm",
        "grant_num",
        "award_start_dt",
        "award_end_dt",
        "award_amt",
        "funding_type_nm",
        "program_area_cd",
        "program_area_nm",
    ];

    // Clear old data
    d3.select(container).html("");

    // Populate new data
    createTable(filteredData, columns, container);
};

/**
 * Creates a table in the given container using the specified data and columns.
 * @param {Array} data - Data to display.
 * @param {Array} columns - Columns to display.
 * @param {string} container - Container selector.
 * @returns {Object} D3 table object.
 */
const createTable = (data, columns, container) => {
    const table = d3
        .select(container)
        .attr("source-data", JSON.stringify(data))
        .append("table");

    // Append header
    const thead = table.append("thead");
    thead
        .append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text((column) => columnHeaderRenames[column] || column);

    // Append rows and cells
    const tbody = table.append("tbody");
    const rows = tbody.selectAll("tr").data(data).enter().append("tr");
    rows
        .selectAll("td")
        .data((row) =>
            columns.map((column) => ({
                column,
                value: row[column],
            }))
        )
        .enter()
        .append("td")
        .text((d) =>
            d.column === "award_amt"
                ? `$${Number(d.value).toLocaleString()}`
                : d.value
        );

    return table;
};

// Initialize the lightbox setup
setupDistrictDetailBoxes();
