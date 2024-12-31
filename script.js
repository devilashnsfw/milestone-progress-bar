async function fetchMilestoneProgress() {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get("user");
    const repo = queryParams.get("repo");
    const milestoneTitle = queryParams.get("milestone");

    const milestoneElement = document.getElementById("milestone-title");
    const progressInfo = document.getElementById("progress-info");
    const progressFill = document.querySelector(".progress-fill");

    if (!user || !repo || !milestoneTitle) {
        progressInfo.textContent = "Invalid URL parameters.";
        return;
    }

    try {
        // Fetch milestone data
        const milestonesUrl = `https://api.github.com/repos/${user}/${repo}/milestones`;
        const milestonesResponse = await fetch(milestonesUrl);

        if (!milestonesResponse.ok) {
            throw new Error(`HTTP Error: ${milestonesResponse.status}`);
        }

        const milestones = await milestonesResponse.json();
        const milestone = milestones.find(m => m.title === milestoneTitle);

        if (!milestone) {
            progressInfo.textContent = "Milestone not found.";
            return;
        }

        // Set milestone title
        milestoneElement.textContent = milestone.title;

        // Fetch issues data
        const milestoneNumber = milestone.number;
        const issuesUrl = `https://api.github.com/repos/${user}/${repo}/issues?milestone=${milestoneNumber}&state=all`;
        const issuesResponse = await fetch(issuesUrl);

        if (!issuesResponse.ok) {
            throw new Error(`HTTP Error: ${issuesResponse.status}`);
        }

        const issues = await issuesResponse.json();
        const totalIssues = issues.length;
        const closedIssues = issues.filter(issue => issue.state === "closed");
        const openIssues = issues.filter(issue => issue.state === "open");

        // Display progress info
        const percentageComplete = totalIssues > 0 ? Math.round((closedIssues.length / totalIssues) * 100) : 0;
        progressInfo.textContent = `${percentageComplete}% Complete (${closedIssues.length}/${totalIssues} Issues)`;

        // Prepare closed issue tag data
        const tagCounts = {};
        closedIssues.forEach(issue => {
            issue.labels.forEach(label => {
                const tag = label.name;
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const totalTags = Object.keys(tagCounts).length;
        const tagColors = generateTagColors(totalTags);

        // Render closed issue progress by tags
        Object.keys(tagCounts).forEach((tag, index) => {
            const widthPercentage = (tagCounts[tag] / totalIssues) * 100;
            const tagDiv = document.createElement("div");
            tagDiv.style.backgroundColor = tagColors[index];
            tagDiv.style.width = `${widthPercentage}%`;
            progressFill.appendChild(tagDiv);
        });

        // Render open issues as a grey section
        const openPercentage = (openIssues.length / totalIssues) * 100;
        if (openPercentage > 0) {
            const openDiv = document.createElement("div");
            openDiv.style.backgroundColor = "#d6d6d6"; // Grey color for open issues
            openDiv.style.width = `${openPercentage}%`;
            progressFill.appendChild(openDiv);
        }
    } catch (error) {
        console.error("Error fetching milestone data:", error);
        progressInfo.textContent = "Error loading progress.";
    }
}

// Generate colors for tags
function generateTagColors(count) {
    const baseColors = [
        "#E57373", "#FFB74D", "#81C784", "#64B5F6", "#9575CD",
        "#F06292", "#4DB6AC", "#7986CB", "#FFD54F", "#4DD0E1"
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

fetchMilestoneProgress();
